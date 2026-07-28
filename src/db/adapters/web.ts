/**
 * Adaptador web / fallback em memória
 * ====================================
 *
 * Serve a mesma interface `DocumentStore` sem SQLite. Usado em três cenários:
 *  1. Web (a build que vai para a Vercel).
 *  2. Testes de unidade, que rodam em Node sem módulos nativos.
 *  3. Fallback se `expo-sqlite` falhar ao abrir no dispositivo — melhor um app
 *     que funciona na sessão do que uma tela de erro.
 *
 * Estratégia: índices em memória (Map por coleção) + persistência assíncrona
 * em `AsyncStorage`, que na web é `localStorage`.
 *
 * A escrita em disco é **debounced e por coleção**. Sem isso, uma sessão de
 * revisão com 60 itens dispararia 60 serializações completas e travaria a
 * thread principal do navegador.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLLECTION_BY_NAME } from '../collections';
import {
  type CollectionSpec,
  type DocumentStore,
  type Query,
  applyOrder,
  matchesFilter,
} from '../store';

const STORAGE_PREFIX = '@lumo/db/';
const FLUSH_DELAY_MS = 400;

type IndexedRecord = {
  id: string;
  /** Valores das colunas indexadas — o que os filtros consultam. */
  fields: Record<string, string | number | null>;
  doc: unknown;
};

export class WebDocumentStore implements DocumentStore {
  private data = new Map<string, Map<string, IndexedRecord>>();
  private specs = new Map<string, CollectionSpec<never>>();
  private dirty = new Set<string>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  /**
   * `persist: false` desliga o AsyncStorage inteiro. É o modo usado em testes,
   * onde a persistência só adicionaria lentidão e estado compartilhado.
   */
  constructor(private readonly persist = true) {}

  async init(collections: CollectionSpec<never>[]): Promise<void> {
    if (this.initialized) return;

    for (const collection of collections) {
      this.specs.set(collection.name, collection);
      this.data.set(collection.name, new Map());
    }

    if (this.persist) {
      await Promise.all(collections.map((collection) => this.load(collection.name)));
    }

    this.initialized = true;
  }

  private async load(collection: string): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_PREFIX + collection);
      if (!raw) return;

      const records = JSON.parse(raw) as IndexedRecord[];
      const map = new Map<string, IndexedRecord>();
      for (const record of records) map.set(record.id, record);
      this.data.set(collection, map);
    } catch {
      // Dados corrompidos ou storage cheio: começa vazio em vez de travar o
      // app. O conteúdo será re-semeado e o progresso vem do servidor no
      // próximo sync.
      this.data.set(collection, new Map());
    }
  }

  private scheduleFlush(collection: string): void {
    if (!this.persist) return;

    this.dirty.add(collection);
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, FLUSH_DELAY_MS);
  }

  /** Grava as coleções sujas. Público para poder ser chamado ao ir a background. */
  async flush(): Promise<void> {
    if (!this.persist || this.dirty.size === 0) return;

    const pending = [...this.dirty];
    this.dirty.clear();

    await Promise.all(
      pending.map(async (collection) => {
        const map = this.data.get(collection);
        if (!map) return;
        try {
          await AsyncStorage.setItem(
            STORAGE_PREFIX + collection,
            JSON.stringify([...map.values()]),
          );
        } catch {
          // Cota estourada: remarca como suja para tentar de novo mais tarde.
          this.dirty.add(collection);
        }
      }),
    );
  }

  private collectionMap(collection: string): Map<string, IndexedRecord> {
    const map = this.data.get(collection);
    if (!map) {
      const created = new Map<string, IndexedRecord>();
      this.data.set(collection, created);
      return created;
    }
    return map;
  }

  private specOf(collection: string): CollectionSpec<never> {
    const spec = this.specs.get(collection) ?? COLLECTION_BY_NAME.get(collection);
    if (!spec) throw new Error(`Coleção desconhecida: ${collection}`);
    return spec;
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    return (this.collectionMap(collection).get(id)?.doc as T) ?? null;
  }

  async put<T>(collection: string, doc: T): Promise<void> {
    const spec = this.specOf(collection);
    const id = spec.idOf(doc as never);
    this.collectionMap(collection).set(id, {
      id,
      fields: spec.indexer(doc as never),
      doc,
    });
    this.scheduleFlush(collection);
  }

  async putMany<T>(collection: string, docs: T[]): Promise<void> {
    if (docs.length === 0) return;
    const spec = this.specOf(collection);
    const map = this.collectionMap(collection);

    for (const doc of docs) {
      const id = spec.idOf(doc as never);
      map.set(id, { id, fields: spec.indexer(doc as never), doc });
    }
    this.scheduleFlush(collection);
  }

  async delete(collection: string, id: string): Promise<void> {
    this.collectionMap(collection).delete(id);
    this.scheduleFlush(collection);
  }

  async deleteWhere(collection: string, query: Query): Promise<number> {
    const map = this.collectionMap(collection);
    const matches = this.select(collection, query);

    for (const record of matches) map.delete(record.id);
    if (matches.length > 0) this.scheduleFlush(collection);

    return matches.length;
  }

  /** Filtra + ordena + pagina, sobre os campos indexados. */
  private select(collection: string, query: Query): IndexedRecord[] {
    const all = [...this.collectionMap(collection).values()];

    const filtered = query.where?.length
      ? all.filter((record) =>
          query.where!.every((filter) => matchesFilter(record.fields[filter.field], filter)),
        )
      : all;

    const ordered = query.orderBy?.length
      ? applyOrder(
          filtered.map((record) => ({ ...record.fields, __record: record })),
          query.orderBy,
        ).map((row) => row.__record as IndexedRecord)
      : filtered;

    const offset = query.offset ?? 0;
    const limit = query.limit ?? ordered.length;
    return ordered.slice(offset, offset + limit);
  }

  async query<T>(collection: string, query: Query = {}): Promise<T[]> {
    return this.select(collection, query).map((record) => record.doc as T);
  }

  async first<T>(collection: string, query: Query): Promise<T | null> {
    const rows = await this.query<T>(collection, { ...query, limit: 1 });
    return rows[0] ?? null;
  }

  async count(collection: string, query: Query = {}): Promise<number> {
    if (!query.where?.length) return this.collectionMap(collection).size;
    return this.select(collection, { where: query.where }).length;
  }

  async clear(collection: string): Promise<void> {
    this.collectionMap(collection).clear();
    this.scheduleFlush(collection);
  }

  /**
   * Transação com snapshot-and-rollback.
   *
   * Sem SQLite não há transação real, então copiamos o estado das coleções
   * antes do bloco e restauramos em caso de erro. É O(n) na memória, mas as
   * transações do app são pequenas (concluir uma lição toca ~5 coleções) e a
   * garantia de atomicidade vale mais do que a cópia.
   */
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const snapshot = new Map<string, Map<string, IndexedRecord>>();
    for (const [name, map] of this.data) {
      snapshot.set(name, new Map(map));
    }

    try {
      return await fn();
    } catch (error) {
      this.data = snapshot;
      throw error;
    }
  }

  async estimateSizeBytes(): Promise<number> {
    let total = 0;
    for (const map of this.data.values()) {
      for (const record of map.values()) {
        // Aproximação: 2 bytes por caractere UTF-16 do JSON serializado.
        total += JSON.stringify(record.doc).length * 2;
      }
    }
    return total;
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
    this.data.clear();
    this.initialized = false;
  }
}
