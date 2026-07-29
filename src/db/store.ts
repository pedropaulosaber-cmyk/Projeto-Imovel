/**
 * Lumo — Porta de persistência local
 * ===================================
 *
 * Define o contrato do banco local. O app inteiro fala com esta interface;
 * nenhuma tela e nenhum repositório sabe se por baixo há SQLite, IndexedDB ou
 * memória.
 *
 * ## Por que uma porta de documentos e não SQL cru
 *
 * O produto precisa rodar em três alvos (Android, iOS, web) a partir de uma
 * base só. SQLite existe nativamente nos dois primeiros; na web ele só existe
 * via WebAssembly, que exige cabeçalhos COOP/COEP e OPFS — uma dependência
 * frágil para uma landing page que precisa abrir em qualquer navegador.
 *
 * A solução é abstrair no nível certo: **coleções com campos indexados**.
 *  - No nativo, cada coleção vira uma tabela SQLite real, com colunas tipadas
 *    para os campos indexados, índices de verdade e consultas em SQL. É banco
 *    de dados robusto de fato, não um cache disfarçado.
 *  - Na web, a mesma interface é servida por um armazenamento de documentos
 *    com índices em memória.
 *
 * Repositórios e regras de negócio são escritos uma vez só e não mudam.
 *
 * ## Formato híbrido (coluna + JSON)
 *
 * Cada registro guarda os campos consultáveis em colunas próprias e o objeto
 * completo em JSON. Isso dá o melhor dos dois mundos: consulta indexada rápida
 * nos caminhos quentes (itens vencidos por data, lições por módulo) e evolução
 * de schema sem migração para todo campo novo que não é filtrado.
 */

/* ------------------------------------------------------------------ *
 * Esquema
 * ------------------------------------------------------------------ */

export type IndexType = 'text' | 'integer' | 'real';

export type IndexSpec = {
  /** Nome do campo indexado. Deve existir no objeto extraído por `indexer`. */
  name: string;
  type: IndexType;
  /** Cria um índice dedicado. Use nos campos realmente usados em WHERE/ORDER. */
  indexed?: boolean;
};

export type CollectionSpec<T = unknown> = {
  name: string;
  /** Campos promovidos a coluna. */
  indexes: IndexSpec[];
  /** Extrai os valores das colunas indexadas a partir do documento. */
  indexer: (doc: T) => Record<string, string | number | null>;
  /** Extrai o id primário. */
  idOf: (doc: T) => string;
};

/* ------------------------------------------------------------------ *
 * Consultas
 * ------------------------------------------------------------------ */

export type FilterOperator = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'like';

export type Filter = {
  field: string;
  op: FilterOperator;
  value: string | number | null | (string | number)[];
};

export type Query = {
  where?: Filter[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
};

/* ------------------------------------------------------------------ *
 * Porta
 * ------------------------------------------------------------------ */

export interface DocumentStore {
  /** Cria/atualiza as tabelas. Idempotente — pode rodar a cada abertura. */
  init(collections: CollectionSpec<never>[]): Promise<void>;

  get<T>(collection: string, id: string): Promise<T | null>;

  /** Insere ou substitui um documento. */
  put<T>(collection: string, doc: T): Promise<void>;

  /** Escrita em lote. Deve ser atômica e muito mais rápida que N `put`. */
  putMany<T>(collection: string, docs: T[]): Promise<void>;

  delete(collection: string, id: string): Promise<void>;

  /** Remove tudo que casar com a consulta. Devolve quantos foram removidos. */
  deleteWhere(collection: string, query: Query): Promise<number>;

  query<T>(collection: string, query?: Query): Promise<T[]>;

  /** Primeiro resultado ou null — atalho para consultas por chave única. */
  first<T>(collection: string, query: Query): Promise<T | null>;

  count(collection: string, query?: Query): Promise<number>;

  clear(collection: string): Promise<void>;

  /**
   * Executa um bloco atomicamente. Um erro dentro do bloco desfaz tudo.
   * Essencial para concluir uma lição: XP, progresso, SRS e fila de sync
   * precisam ser gravados juntos, ou nada é gravado.
   */
  transaction<T>(fn: () => Promise<T>): Promise<T>;

  /** Tamanho aproximado em bytes — alimenta a tela de gerenciar downloads. */
  estimateSizeBytes(): Promise<number>;

  /** Fecha as conexões. Usado em testes e ao trocar de usuário. */
  close(): Promise<void>;
}

/* ------------------------------------------------------------------ *
 * Avaliação de filtros (compartilhada pelos adaptadores)
 * ------------------------------------------------------------------ */

/**
 * Aplica um filtro a um valor já extraído.
 * Usado pelo adaptador web e pelos testes; o adaptador SQLite traduz para SQL.
 */
export function matchesFilter(value: unknown, filter: Filter): boolean {
  const { op, value: expected } = filter;

  switch (op) {
    case '=':
      return value === expected;
    case '!=':
      return value !== expected;
    case '<':
      return typeof value === 'number' && typeof expected === 'number' && value < expected;
    case '<=':
      return typeof value === 'number' && typeof expected === 'number' && value <= expected;
    case '>':
      return typeof value === 'number' && typeof expected === 'number' && value > expected;
    case '>=':
      return typeof value === 'number' && typeof expected === 'number' && value >= expected;
    case 'in':
      return Array.isArray(expected) && expected.includes(value as string | number);
    case 'like':
      return (
        typeof value === 'string' &&
        typeof expected === 'string' &&
        value.toLowerCase().includes(expected.toLowerCase().replace(/%/g, ''))
      );
    default:
      return false;
  }
}

/** Ordena registros pela cláusula `orderBy`. Estável e tipada. */
export function applyOrder<T extends Record<string, unknown>>(
  rows: T[],
  orderBy: Query['orderBy'],
): T[] {
  if (!orderBy || orderBy.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const { field, direction } of orderBy) {
      const left = a[field];
      const right = b[field];
      if (left === right) continue;

      // `null` vai sempre para o fim, independentemente da direção — é o que
      // o SQLite faz com NULLS LAST e mantém os dois adaptadores coerentes.
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;

      const comparison = left < right ? -1 : 1;
      return direction === 'desc' ? -comparison : comparison;
    }
    return 0;
  });
}
