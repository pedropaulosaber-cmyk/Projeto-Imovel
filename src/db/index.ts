/**
 * Lumo — Abertura do banco local
 *
 * Escolhe o adaptador certo por plataforma e garante que o app tenha um banco
 * utilizável em qualquer cenário. A regra de ouro aqui é: **nunca falhar de
 * forma dura.** Um erro ao abrir o SQLite não pode virar uma tela branca; ele
 * degrada para o armazenamento em memória e o app continua funcionando.
 *
 * ## Por que o adaptador SQLite é carregado por import dinâmico
 *
 * `expo-sqlite` resolve o módulo nativo `ExpoSQLite` **no momento em que o
 * módulo é avaliado**, não quando uma função dele é chamada. Com um `import`
 * estático no topo deste arquivo, o bundle web executava esse require assim que
 * carregava e lançava `Cannot find native module 'ExpoSQLite'` — antes de
 * qualquer checagem de `Platform.OS` e antes do `try/catch` abaixo. Resultado:
 * tela branca na web, com todo o "fallback seguro" inalcançável.
 *
 * O `await import()` dentro do ramo nativo resolve isso de forma definitiva: na
 * web o módulo nunca é avaliado, e no nativo a falha (se houver) acontece dentro
 * do `try` e degrada como planejado.
 */

import { Platform } from 'react-native';

import { WebDocumentStore } from './adapters/web';
import { ALL_COLLECTIONS } from './collections';
import type { DocumentStore } from './store';

let instance: DocumentStore | null = null;
let openPromise: Promise<DocumentStore> | null = null;

/** Verdadeiro quando o app está usando o fallback em vez de SQLite nativo. */
let usingFallback = false;

export function isUsingFallbackStore(): boolean {
  return usingFallback;
}

/**
 * Abre (ou reaproveita) o banco local.
 *
 * Idempotente e seguro para chamadas concorrentes: várias telas montando ao
 * mesmo tempo compartilham a mesma promessa de abertura.
 */
export async function openDatabase(): Promise<DocumentStore> {
  if (instance) return instance;
  if (openPromise) return openPromise;

  openPromise = (async () => {
    if (Platform.OS === 'web') {
      const store = new WebDocumentStore(true);
      await store.init(ALL_COLLECTIONS);
      usingFallback = false;
      instance = store;
      return store;
    }

    try {
      // Import dinâmico: em web este caminho nunca é alcançado, então o módulo
      // nativo jamais é avaliado. Ver o bloco de documentação no topo.
      const { SqliteDocumentStore } = await import('./adapters/sqlite');

      const store = new SqliteDocumentStore();
      await store.init(ALL_COLLECTIONS);
      await store.migrate(ALL_COLLECTIONS);
      usingFallback = false;
      instance = store;
      return store;
    } catch (error) {
      // Falhar aqui é raro (disco cheio, banco corrompido, sandbox restrito),
      // mas o custo de não tratar é o app não abrir.
      console.warn('[lumo/db] SQLite indisponível, usando fallback em memória.', error);
      const fallback = new WebDocumentStore(true);
      await fallback.init(ALL_COLLECTIONS);
      usingFallback = true;
      instance = fallback;
      return fallback;
    }
  })();

  return openPromise;
}

/** Acesso síncrono ao banco já aberto. Lança se chamado antes de `openDatabase`. */
export function getDatabase(): DocumentStore {
  if (!instance) {
    throw new Error('Banco não aberto. Chame openDatabase() na inicialização do app.');
  }
  return instance;
}

/** Fecha e descarta a instância. Usado ao sair da conta e em testes. */
export async function closeDatabase(): Promise<void> {
  if (instance) {
    await instance.close();
    instance = null;
    openPromise = null;
  }
}

/**
 * Injeta um store específico. Existe exclusivamente para testes — permite
 * rodar os repositórios contra `WebDocumentStore(false)` sem tocar em disco.
 */
export function __setDatabaseForTests(store: DocumentStore | null): void {
  instance = store;
  openPromise = store ? Promise.resolve(store) : null;
}

export * from './store';
export * from './collections';
export { WebDocumentStore } from './adapters/web';

// `SqliteDocumentStore` NÃO é reexportado aqui de propósito: uma reexportação
// é um import estático e traria de volta a avaliação de `expo-sqlite` no bundle
// web. Quem precisar dele no nativo importa de './adapters/sqlite' diretamente.
