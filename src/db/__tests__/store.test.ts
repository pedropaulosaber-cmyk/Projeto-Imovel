/**
 * Testes da camada de persistência.
 *
 * Rodam contra o `WebDocumentStore` sem persistência, que é a mesma
 * implementação usada na web e o contrato que o adaptador SQLite precisa
 * respeitar. Testar aqui trava o comportamento **esperado de ambos** — filtros,
 * ordenação, atomicidade — sem precisar de um dispositivo.
 */

import type { ReviewState, VocabularyItem } from '@/domain/types';
import { WebDocumentStore } from '../adapters/web';
import { ALL_COLLECTIONS, COLLECTION } from '../collections';
import { type DocumentStore, applyOrder, matchesFilter } from '../store';

function vocab(id: string, overrides: Partial<VocabularyItem> = {}): VocabularyItem {
  return {
    id,
    language: 'en',
    term: id,
    translation: `t-${id}`,
    partOfSpeech: 'substantivo',
    phonetic: null,
    exampleSentence: null,
    exampleTranslation: null,
    frequencyRank: 1,
    cefr: 'A1',
    tags: [],
    ...overrides,
  };
}

function review(id: string, overrides: Partial<ReviewState> = {}): ReviewState {
  return {
    id,
    userId: 'user-1',
    conceptId: `concept-${id}`,
    language: 'en',
    easeFactor: 2.5,
    intervalDays: 1,
    repetitions: 0,
    dueAt: 1000,
    lastReviewedAt: null,
    stability: 0,
    difficulty: 0.3,
    lapses: 0,
    totalReviews: 0,
    state: 'review',
    starred: false,
    ...overrides,
  };
}

describe('matchesFilter', () => {
  it('compara igualdade e diferença', () => {
    expect(matchesFilter('a', { field: 'f', op: '=', value: 'a' })).toBe(true);
    expect(matchesFilter('a', { field: 'f', op: '!=', value: 'b' })).toBe(true);
  });

  it('compara ordem apenas entre números', () => {
    expect(matchesFilter(5, { field: 'f', op: '<', value: 10 })).toBe(true);
    expect(matchesFilter(5, { field: 'f', op: '>=', value: 5 })).toBe(true);
    expect(matchesFilter('5', { field: 'f', op: '<', value: 10 })).toBe(false);
  });

  it('suporta IN e lista vazia', () => {
    expect(matchesFilter('a', { field: 'f', op: 'in', value: ['a', 'b'] })).toBe(true);
    expect(matchesFilter('c', { field: 'f', op: 'in', value: [] })).toBe(false);
  });

  it('LIKE é uma busca por substring sem diferenciar caixa', () => {
    expect(matchesFilter('Bonjour', { field: 'f', op: 'like', value: 'jour' })).toBe(true);
    expect(matchesFilter('Bonjour', { field: 'f', op: 'like', value: 'tarde' })).toBe(false);
  });
});

describe('applyOrder', () => {
  it('ordena crescente e decrescente', () => {
    const rows = [{ n: 3 }, { n: 1 }, { n: 2 }];

    expect(applyOrder(rows, [{ field: 'n', direction: 'asc' }]).map((r) => r.n)).toEqual([
      1, 2, 3,
    ]);
    expect(applyOrder(rows, [{ field: 'n', direction: 'desc' }]).map((r) => r.n)).toEqual([
      3, 2, 1,
    ]);
  });

  it('coloca nulos por último em qualquer direção, como o SQLite', () => {
    const rows = [{ n: 2 }, { n: null }, { n: 1 }];

    expect(applyOrder(rows, [{ field: 'n', direction: 'asc' }]).map((r) => r.n)).toEqual([
      1,
      2,
      null,
    ]);
    expect(applyOrder(rows, [{ field: 'n', direction: 'desc' }]).map((r) => r.n)).toEqual([
      2,
      1,
      null,
    ]);
  });

  it('desempata pelo segundo critério', () => {
    const rows = [
      { a: 1, b: 2 },
      { a: 1, b: 1 },
    ];
    const sorted = applyOrder(rows, [
      { field: 'a', direction: 'asc' },
      { field: 'b', direction: 'asc' },
    ]);
    expect(sorted.map((r) => r.b)).toEqual([1, 2]);
  });
});

describe('DocumentStore', () => {
  let store: DocumentStore;

  beforeEach(async () => {
    // `false` desliga a persistência: os testes rodam em memória pura.
    store = new WebDocumentStore(false);
    await store.init(ALL_COLLECTIONS);
  });

  afterEach(async () => {
    await store.close();
  });

  it('grava e lê um documento', async () => {
    await store.put(COLLECTION.vocabulary, vocab('water'));
    const found = await store.get<VocabularyItem>(COLLECTION.vocabulary, 'water');

    expect(found?.term).toBe('water');
  });

  it('devolve null para id inexistente', async () => {
    expect(await store.get(COLLECTION.vocabulary, 'nada')).toBeNull();
  });

  it('put substitui o documento existente (upsert)', async () => {
    await store.put(COLLECTION.vocabulary, vocab('water'));
    await store.put(COLLECTION.vocabulary, vocab('water', { translation: 'nova' }));

    expect(await store.count(COLLECTION.vocabulary)).toBe(1);
    const found = await store.get<VocabularyItem>(COLLECTION.vocabulary, 'water');
    expect(found?.translation).toBe('nova');
  });

  it('putMany grava em lote', async () => {
    await store.putMany(COLLECTION.vocabulary, [vocab('a'), vocab('b'), vocab('c')]);
    expect(await store.count(COLLECTION.vocabulary)).toBe(3);
  });

  it('putMany com lista vazia não faz nada', async () => {
    await store.putMany(COLLECTION.vocabulary, []);
    expect(await store.count(COLLECTION.vocabulary)).toBe(0);
  });

  it('filtra por campo indexado', async () => {
    await store.putMany(COLLECTION.vocabulary, [
      vocab('a', { language: 'en' }),
      vocab('b', { language: 'fr' }),
    ]);

    const results = await store.query<VocabularyItem>(COLLECTION.vocabulary, {
      where: [{ field: 'language', op: '=', value: 'fr' }],
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('b');
  });

  it('combina filtros com AND', async () => {
    await store.putMany(COLLECTION.reviewStates, [
      review('1', { dueAt: 500, state: 'review' }),
      review('2', { dueAt: 5000, state: 'review' }),
      review('3', { dueAt: 500, state: 'new' }),
    ]);

    const due = await store.query<ReviewState>(COLLECTION.reviewStates, {
      where: [
        { field: 'userId', op: '=', value: 'user-1' },
        { field: 'dueAt', op: '<=', value: 1000 },
        { field: 'state', op: '!=', value: 'new' },
      ],
    });

    expect(due.map((item) => item.id)).toEqual(['1']);
  });

  it('ordena e pagina', async () => {
    await store.putMany(
      COLLECTION.vocabulary,
      [3, 1, 2, 4].map((rank) => vocab(`w${rank}`, { frequencyRank: rank })),
    );

    const page = await store.query<VocabularyItem>(COLLECTION.vocabulary, {
      orderBy: [{ field: 'frequencyRank', direction: 'asc' }],
      limit: 2,
      offset: 1,
    });

    expect(page.map((item) => item.frequencyRank)).toEqual([2, 3]);
  });

  it('first devolve apenas o primeiro resultado', async () => {
    await store.putMany(COLLECTION.vocabulary, [vocab('a'), vocab('b')]);

    const first = await store.first<VocabularyItem>(COLLECTION.vocabulary, {
      orderBy: [{ field: 'term', direction: 'asc' }],
    });
    expect(first?.id).toBe('a');
  });

  it('count com e sem filtro', async () => {
    await store.putMany(COLLECTION.vocabulary, [
      vocab('a', { language: 'en' }),
      vocab('b', { language: 'en' }),
      vocab('c', { language: 'de' }),
    ]);

    expect(await store.count(COLLECTION.vocabulary)).toBe(3);
    expect(
      await store.count(COLLECTION.vocabulary, {
        where: [{ field: 'language', op: '=', value: 'en' }],
      }),
    ).toBe(2);
  });

  it('delete e deleteWhere', async () => {
    await store.putMany(COLLECTION.vocabulary, [
      vocab('a', { language: 'en' }),
      vocab('b', { language: 'de' }),
      vocab('c', { language: 'de' }),
    ]);

    await store.delete(COLLECTION.vocabulary, 'a');
    expect(await store.count(COLLECTION.vocabulary)).toBe(2);

    const removed = await store.deleteWhere(COLLECTION.vocabulary, {
      where: [{ field: 'language', op: '=', value: 'de' }],
    });

    expect(removed).toBe(2);
    expect(await store.count(COLLECTION.vocabulary)).toBe(0);
  });

  it('clear esvazia a coleção', async () => {
    await store.putMany(COLLECTION.vocabulary, [vocab('a'), vocab('b')]);
    await store.clear(COLLECTION.vocabulary);
    expect(await store.count(COLLECTION.vocabulary)).toBe(0);
  });

  it('transação confirma quando o bloco termina bem', async () => {
    await store.transaction(async () => {
      await store.put(COLLECTION.vocabulary, vocab('a'));
      await store.put(COLLECTION.vocabulary, vocab('b'));
    });

    expect(await store.count(COLLECTION.vocabulary)).toBe(2);
  });

  it('transação desfaz tudo quando o bloco lança', async () => {
    await store.put(COLLECTION.vocabulary, vocab('original'));

    await expect(
      store.transaction(async () => {
        await store.put(COLLECTION.vocabulary, vocab('novo'));
        await store.delete(COLLECTION.vocabulary, 'original');
        throw new Error('falha no meio da conclusão da lição');
      }),
    ).rejects.toThrow('falha no meio');

    // Estado anterior intacto: nem o novo entrou, nem o antigo saiu.
    expect(await store.count(COLLECTION.vocabulary)).toBe(1);
    expect(await store.get(COLLECTION.vocabulary, 'original')).not.toBeNull();
    expect(await store.get(COLLECTION.vocabulary, 'novo')).toBeNull();
  });

  it('estima o tamanho ocupado', async () => {
    expect(await store.estimateSizeBytes()).toBe(0);
    await store.putMany(COLLECTION.vocabulary, [vocab('a'), vocab('b')]);
    expect(await store.estimateSizeBytes()).toBeGreaterThan(0);
  });
});
