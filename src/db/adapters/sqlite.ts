/**
 * Adaptador SQLite (Android / iOS)
 * =================================
 *
 * Implementa `DocumentStore` sobre `expo-sqlite`. Cada coleção vira uma tabela
 * real com colunas tipadas para os campos indexados e uma coluna `doc` com o
 * JSON completo.
 *
 * Ajustes de PRAGMA aplicados na abertura e por quê:
 *  - `journal_mode = WAL`: leitura e escrita concorrentes sem bloqueio. Sem
 *    isso, gravar o progresso de um exercício congela a lista da trilha.
 *  - `synchronous = NORMAL`: em WAL é seguro contra queda do app (só perde em
 *    queda de energia do aparelho) e reduz muito o I/O — que é bateria.
 *  - `foreign_keys = ON`: integridade referencial de verdade no dispositivo.
 *  - `temp_store = MEMORY`: ordenações intermediárias na RAM, não no cartão.
 */

import * as SQLite from 'expo-sqlite';

import { COLLECTION_BY_NAME, type CollectionName } from '../collections';
import type { CollectionSpec, DocumentStore, Filter, Query } from '../store';

const DATABASE_NAME = 'lumo.db';

/** Escapa um identificador para uso seguro em SQL (`order`, `type` etc.). */
function quote(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

const SQL_TYPE: Record<string, string> = {
  text: 'TEXT',
  integer: 'INTEGER',
  real: 'REAL',
};

/** Traduz um filtro para um fragmento SQL parametrizado. */
function filterToSql(filter: Filter): { sql: string; params: (string | number | null)[] } {
  const column = quote(filter.field);

  if (filter.op === 'in') {
    const values = Array.isArray(filter.value) ? filter.value : [];
    if (values.length === 0) {
      // `IN ()` é sintaticamente inválido; um predicado sempre falso é o
      // equivalente semântico correto.
      return { sql: '0 = 1', params: [] };
    }
    const placeholders = values.map(() => '?').join(', ');
    return { sql: `${column} IN (${placeholders})`, params: values };
  }

  if (filter.op === 'like') {
    return { sql: `${column} LIKE ?`, params: [`%${String(filter.value)}%`] };
  }

  if (filter.value === null) {
    return {
      sql: filter.op === '=' ? `${column} IS NULL` : `${column} IS NOT NULL`,
      params: [],
    };
  }

  return { sql: `${column} ${filter.op} ?`, params: [filter.value as string | number] };
}

function buildWhere(where: Filter[] | undefined): {
  clause: string;
  params: (string | number | null)[];
} {
  if (!where || where.length === 0) return { clause: '', params: [] };

  const parts = where.map(filterToSql);
  return {
    clause: ` WHERE ${parts.map((p) => p.sql).join(' AND ')}`,
    params: parts.flatMap((p) => p.params),
  };
}

function buildOrder(orderBy: Query['orderBy']): string {
  if (!orderBy || orderBy.length === 0) return '';
  const parts = orderBy.map(
    ({ field, direction }) =>
      `${quote(field)} ${direction === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`,
  );
  return ` ORDER BY ${parts.join(', ')}`;
}

function buildLimit(query: Query): string {
  if (query.limit === undefined && query.offset === undefined) return '';
  // SQLite exige LIMIT para poder aplicar OFFSET; -1 significa "sem limite".
  const limit = query.limit ?? -1;
  const offset = query.offset ?? 0;
  return ` LIMIT ${limit} OFFSET ${offset}`;
}

type Row = { doc: string };

export class SqliteDocumentStore implements DocumentStore {
  private db: SQLite.SQLiteDatabase | null = null;
  /** Impede que duas chamadas concorrentes de `init` criem tabelas em paralelo. */
  private initPromise: Promise<void> | null = null;

  private requireDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Banco não inicializado. Chame init() antes de usar o store.');
    }
    return this.db;
  }

  async init(collections: CollectionSpec<never>[]): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      this.db = db;

      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
        PRAGMA temp_store = MEMORY;
      `);

      for (const collection of collections) {
        await this.createCollection(db, collection);
      }
    })();

    return this.initPromise;
  }

  private async createCollection(
    db: SQLite.SQLiteDatabase,
    collection: CollectionSpec<never>,
  ): Promise<void> {
    const columns = collection.indexes
      .map((index) => `${quote(index.name)} ${SQL_TYPE[index.type] ?? 'TEXT'}`)
      .join(', ');

    const table = quote(collection.name);

    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS ${table} (
        id TEXT PRIMARY KEY NOT NULL,
        ${columns}${columns ? ',' : ''}
        doc TEXT NOT NULL
      );`,
    );

    // Cria os índices declarados. Fora do CREATE TABLE para que adicionar um
    // índice a uma versão futura não exija recriar a tabela.
    for (const index of collection.indexes) {
      if (!index.indexed) continue;
      const indexName = quote(`idx_${collection.name}_${index.name}`);
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} (${quote(index.name)});`,
      );
    }
  }

  /**
   * Adiciona colunas que passaram a existir numa versão nova do app.
   *
   * Migração aditiva: nunca remove coluna nem reescreve tabela. Um app
   * offline pode ficar meses sem atualizar e precisa continuar abrindo — o
   * caminho seguro é só somar.
   */
  async migrate(collections: CollectionSpec<never>[]): Promise<void> {
    const db = this.requireDb();

    for (const collection of collections) {
      const existing = await db.getAllAsync<{ name: string }>(
        `PRAGMA table_info(${quote(collection.name)});`,
      );
      const existingColumns = new Set(existing.map((row) => row.name));

      for (const index of collection.indexes) {
        if (existingColumns.has(index.name)) continue;
        await db.execAsync(
          `ALTER TABLE ${quote(collection.name)} ADD COLUMN ${quote(index.name)} ${
            SQL_TYPE[index.type] ?? 'TEXT'
          };`,
        );
      }
    }
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const db = this.requireDb();
    const row = await db.getFirstAsync<Row>(
      `SELECT doc FROM ${quote(collection)} WHERE id = ?;`,
      [id],
    );
    return row ? (JSON.parse(row.doc) as T) : null;
  }

  async put<T>(collection: string, doc: T): Promise<void> {
    await this.putMany(collection, [doc]);
  }

  async putMany<T>(collection: string, docs: T[]): Promise<void> {
    if (docs.length === 0) return;

    const db = this.requireDb();
    const spec = COLLECTION_BY_NAME.get(collection);
    if (!spec) throw new Error(`Coleção desconhecida: ${collection}`);

    const columnNames = spec.indexes.map((index) => index.name);
    const placeholders = ['?', ...columnNames.map(() => '?'), '?'].join(', ');
    const sql = `INSERT OR REPLACE INTO ${quote(collection)} (id, ${columnNames
      .map(quote)
      .join(', ')}${columnNames.length ? ', ' : ''}doc) VALUES (${placeholders});`;

    const statement = await db.prepareAsync(sql);
    try {
      // Uma transação só para o lote inteiro: 500 inserções passam de segundos
      // para milissegundos, o que importa muito ao semear o conteúdo offline.
      await db.withTransactionAsync(async () => {
        for (const doc of docs) {
          const indexed = spec.indexer(doc as never);
          const params = [
            spec.idOf(doc as never),
            ...columnNames.map((name) => indexed[name] ?? null),
            JSON.stringify(doc),
          ];
          await statement.executeAsync(params);
        }
      });
    } finally {
      await statement.finalizeAsync();
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    const db = this.requireDb();
    await db.runAsync(`DELETE FROM ${quote(collection)} WHERE id = ?;`, [id]);
  }

  async deleteWhere(collection: string, query: Query): Promise<number> {
    const db = this.requireDb();
    const { clause, params } = buildWhere(query.where);
    const result = await db.runAsync(`DELETE FROM ${quote(collection)}${clause};`, params);
    return result.changes;
  }

  async query<T>(collection: string, query: Query = {}): Promise<T[]> {
    const db = this.requireDb();
    const { clause, params } = buildWhere(query.where);
    const sql = `SELECT doc FROM ${quote(collection)}${clause}${buildOrder(
      query.orderBy,
    )}${buildLimit(query)};`;

    const rows = await db.getAllAsync<Row>(sql, params);
    return rows.map((row) => JSON.parse(row.doc) as T);
  }

  async first<T>(collection: string, query: Query): Promise<T | null> {
    const rows = await this.query<T>(collection, { ...query, limit: 1 });
    return rows[0] ?? null;
  }

  async count(collection: string, query: Query = {}): Promise<number> {
    const db = this.requireDb();
    const { clause, params } = buildWhere(query.where);
    const row = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total FROM ${quote(collection)}${clause};`,
      params,
    );
    return row?.total ?? 0;
  }

  async clear(collection: string): Promise<void> {
    const db = this.requireDb();
    await db.execAsync(`DELETE FROM ${quote(collection)};`);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const db = this.requireDb();
    let result!: T;
    await db.withTransactionAsync(async () => {
      result = await fn();
    });
    return result;
  }

  async estimateSizeBytes(): Promise<number> {
    const db = this.requireDb();
    const row = await db.getFirstAsync<{ size: number }>(
      'SELECT page_count * page_size AS size FROM pragma_page_count(), pragma_page_size();',
    );
    return row?.size ?? 0;
  }

  /**
   * Recupera espaço após excluir conteúdo baixado.
   * Só deve ser chamado a partir da tela de downloads — `VACUUM` reescreve o
   * arquivo inteiro e é caro demais para rodar automaticamente.
   */
  async vacuum(): Promise<void> {
    const db = this.requireDb();
    await db.execAsync('VACUUM;');
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initPromise = null;
    }
  }
}

export type { CollectionName };
