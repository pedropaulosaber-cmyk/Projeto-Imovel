/**
 * Testes das expressões idiomáticas.
 *
 * Expressão idiomática é o conteúdo mais fácil de escrever errado sem que
 * ninguém perceba: uma tradução literal plausível, um equivalente brasileiro
 * inventado, o mesmo verbete repetido em dois níveis. Nada disso quebra o app —
 * só ensina errado. Por isso os testes olham o **conteúdo**, não a forma.
 */

import type { CefrLevel, LanguageCode } from '@/domain/types';
import { buildIdioms, idiomCount, idiomCountByLevel } from '../idioms';

const LANGUAGES: LanguageCode[] = ['en', 'es', 'fr', 'it', 'de', 'ja', 'ko', 'zh'];
const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const NON_LATIN: LanguageCode[] = ['ja', 'ko', 'zh'];

/** Minúsculas sem acento — "está" e "estar" precisam se encontrar. */
function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[’']/g, "'");
}

describe('catálogo de expressões', () => {
  it('todo idioma tem expressões', () => {
    for (const language of LANGUAGES) {
      expect(buildIdioms(language).length).toBeGreaterThan(0);
    }
  });

  it('nenhum id se repete dentro do idioma', () => {
    // Os dois lotes (curado e extra) são unidos em `buildIdioms`. Ids iguais
    // fariam um verbete sobrescrever o outro na gravação do banco.
    for (const language of LANGUAGES) {
      const ids = buildIdioms(language).map((idiom) => idiom.id);
      expect(ids.length).toBe(new Set(ids).size);
    }
  });

  it('nenhuma expressão se repete dentro do idioma', () => {
    for (const language of LANGUAGES) {
      const expressions = buildIdioms(language).map((idiom) => idiom.expression);
      const duplicated = expressions.filter(
        (expression, index) => expressions.indexOf(expression) !== index,
      );
      expect(duplicated).toEqual([]);
    }
  });

  it('todo verbete tem literal, significado e exemplo traduzido', () => {
    for (const language of LANGUAGES) {
      for (const idiom of buildIdioms(language)) {
        // Dois caracteres bastam: a tradução literal de "dai" é "dá", e uma
        // tradução curta e certa não é um defeito.
        expect(idiom.literal.length).toBeGreaterThanOrEqual(2);
        // As fórmulas de A2 têm significado de uma palavra — "De nada.",
        // "Desmaiar." — e essa é a tradução certa, não uma definição
        // preguiçosa. O piso existe só para pegar campo vazio ou truncado.
        expect(idiom.meaning.length).toBeGreaterThanOrEqual(7);
        expect(idiom.example.length).toBeGreaterThan(4);
        expect(idiom.exampleTranslation.length).toBeGreaterThan(4);
      }
    }
  });

  it('o exemplo contém a expressão ou parte dela', () => {
    // Um exemplo que não usa a expressão não ensina a usá-la — e um verbete
    // assim passa despercebido numa revisão a olho, porque a frase é correta.
    //
    // A verificação é por trecho, não por igualdade, porque a expressão
    // flexiona dentro da frase ("to call it a day" → "let us call it a day",
    // 「腹が立つ」→「腹が立ちました」). Nas escritas sem espaço entre palavras a
    // heurística de palavras não funciona, então lá se compara o início da
    // expressão, que é a parte que a flexão preserva.
    for (const language of LANGUAGES) {
      for (const idiom of buildIdioms(language)) {
        const example = fold(idiom.example);

        if (NON_LATIN.includes(language)) {
          // `fold` também é aplicado à expressão: a normalização NFD separa o
          // dakuten japonês (「が」→ か + ゛), e comparar um lado normalizado
          // com o outro não normalizado nunca casaria.
          const expression = fold(idiom.expression);
          const head = expression.slice(0, Math.ceil(expression.length / 2));
          expect({ id: idiom.id, hit: example.includes(head) }).toEqual({
            id: idiom.id,
            hit: true,
          });
          continue;
        }

        // O verbo auxiliar sai da conta porque é ele que flexiona ("avoir mal"
        // → "j'ai mal"); o resto da expressão é o que se espera reencontrar.
        const anchors = fold(idiom.expression)
          .replace(/^(to|se|si|sich|etre|avoir)\s+/, '')
          .split(/\s+/)
          .filter((word) => word.length > 3);

        // Expressões feitas só de palavras curtas ("no way", "avoir mal à") não
        // têm âncora possível; a comparação as deixa passar de propósito.
        if (anchors.length === 0) continue;

        // Compara o radical de quatro letras, não a palavra inteira: o verbo
        // se conjuga dentro do exemplo ("tomber à pic" → "ça tombe à pic") e
        // exigir a forma de dicionário obrigaria a escrever frases artificiais
        // — o que degradaria o conteúdo para agradar o teste.
        const hit = anchors.some((word) => example.includes(word.slice(0, 4)));
        expect({ id: idiom.id, hit }).toEqual({ id: idiom.id, hit: true });
      }
    }
  });

  it('idiomas de escrita não latina trazem romanização', () => {
    // Sem romanização, o aluno de japonês vê um bloco de kanji e não consegue
    // nem pronunciar o que está estudando.
    for (const language of NON_LATIN) {
      for (const idiom of buildIdioms(language)) {
        expect(idiom.romanization).not.toBeNull();
      }
    }
  });

  it('frequência fica entre 1 e 5', () => {
    for (const language of LANGUAGES) {
      for (const idiom of buildIdioms(language)) {
        expect(idiom.frequency).toBeGreaterThanOrEqual(1);
        expect(idiom.frequency).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe('distribuição por nível', () => {
  it('todo nível de A2 a C2 tem ao menos 25 expressões em todo idioma', () => {
    // A1 fica de fora de propósito: quem tem cem palavras não tem repertório
    // para entender que a soma delas significa outra coisa.
    //
    // O número 25 é o pedido explícito do produto. Ele fica no teste, e não
    // num comentário, porque cobertura de conteúdo é o tipo de meta que se
    // perde silenciosamente no refactor seguinte.
    for (const language of LANGUAGES) {
      for (const level of LEVELS.filter((candidate) => candidate !== 'A1')) {
        expect({ language, level, count: idiomCountByLevel(language, level) }).toEqual({
          language,
          level,
          count: expect.any(Number),
        });
        expect(idiomCountByLevel(language, level)).toBeGreaterThanOrEqual(25);
      }
    }
  });

  it('idiomCountByLevel bate com o catálogo construído', () => {
    for (const language of LANGUAGES) {
      const built = buildIdioms(language);
      for (const level of LEVELS) {
        const counted = built.filter((idiom) => idiom.cefr === level).length;
        expect(idiomCountByLevel(language, level)).toBe(counted);
      }
    }
  });

  it('idiomCount soma os dois lotes', () => {
    for (const language of LANGUAGES) {
      expect(idiomCount(language)).toBe(buildIdioms(language).length);
    }
  });
});
