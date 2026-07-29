/**
 * Repositório da biblioteca: apostilas e expressões idiomáticas.
 *
 * Apostilas e expressões são **conteúdo** (somente leitura, vêm da semente ou
 * do download), mas o progresso do usuário sobre elas — apostila baixada,
 * expressão favoritada — é dado dele e sincroniza.
 */

import type {
  CefrLevel,
  ID,
  Idiom,
  IdiomProgress,
  LanguageCode,
  Workbook,
  WorkbookDownload,
} from '@/domain/types';
import { deterministicId } from '@/lib/id';
import { COLLECTION } from '../collections';
import { getDatabase } from '../index';
import { syncRepository } from './sync';

export const libraryRepository = {
  /* ---------------------------------------------------------------- *
   * Apostilas
   * ---------------------------------------------------------------- */

  /** Apostilas de um idioma, na ordem dos níveis CEFR. */
  async listWorkbooks(language: LanguageCode): Promise<Workbook[]> {
    const workbooks = await getDatabase().query<Workbook>(COLLECTION.workbooks, {
      where: [{ field: 'language', op: '=', value: language }],
    });

    // Ordena pela escala CEFR, não alfabeticamente: 'A1' < 'A2' < 'B1' por
    // acaso funciona em ordem alfabética, mas depender disso é frágil.
    const order: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return workbooks.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
  },

  async getWorkbook(id: ID): Promise<Workbook | null> {
    return getDatabase().get<Workbook>(COLLECTION.workbooks, id);
  },

  async saveWorkbooks(workbooks: Workbook[]): Promise<void> {
    await getDatabase().putMany(COLLECTION.workbooks, workbooks);
  },

  /* ---------------------------------------------------------------- *
   * Downloads de apostila
   * ---------------------------------------------------------------- */

  async listWorkbookDownloads(): Promise<WorkbookDownload[]> {
    return getDatabase().query<WorkbookDownload>(COLLECTION.workbookDownloads);
  },

  async isWorkbookDownloaded(workbookId: ID): Promise<boolean> {
    const record = await getDatabase().get<WorkbookDownload>(
      COLLECTION.workbookDownloads,
      deterministicId('wbdl', workbookId),
    );
    return record !== null;
  },

  /**
   * Marca a apostila como disponível offline.
   *
   * Não há transferência de rede: a apostila é **gerada no dispositivo** a
   * partir do conteúdo que já está lá. "Baixar" aqui significa fixá-la para
   * que a limpeza de cache não a remova e ela apareça na lista de offline.
   */
  async markWorkbookDownloaded(workbook: Workbook): Promise<WorkbookDownload> {
    const record: WorkbookDownload = {
      id: deterministicId('wbdl', workbook.id),
      workbookId: workbook.id,
      downloadedAt: Date.now(),
      // Estimativa a partir do texto real, não de um número inventado.
      sizeBytes: JSON.stringify(workbook).length * 2,
    };

    await getDatabase().put(COLLECTION.workbookDownloads, record);
    return record;
  },

  async removeWorkbookDownload(workbookId: ID): Promise<void> {
    await getDatabase().delete(
      COLLECTION.workbookDownloads,
      deterministicId('wbdl', workbookId),
    );
  },

  /* ---------------------------------------------------------------- *
   * Expressões idiomáticas
   * ---------------------------------------------------------------- */

  /**
   * Expressões de um idioma, das mais usadas para as mais raras.
   *
   * A ordem por frequência é o que torna a lista útil: começar por "加油"
   * (todo dia) em vez de uma curiosidade literária é a diferença entre
   * conteúdo aplicável e enciclopédia.
   */
  async listIdioms(
    language: LanguageCode,
    options: { maxLevel?: CefrLevel; limit?: number } = {},
  ): Promise<Idiom[]> {
    const idioms = await getDatabase().query<Idiom>(COLLECTION.idioms, {
      where: [{ field: 'language', op: '=', value: language }],
      orderBy: [{ field: 'frequency', direction: 'desc' }],
      limit: options.limit,
    });

    if (!options.maxLevel) return idioms;

    const order: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const ceiling = order.indexOf(options.maxLevel);
    return idioms.filter((idiom) => order.indexOf(idiom.cefr) <= ceiling);
  },

  async getIdiom(id: ID): Promise<Idiom | null> {
    return getDatabase().get<Idiom>(COLLECTION.idioms, id);
  },

  async saveIdioms(idioms: Idiom[]): Promise<void> {
    await getDatabase().putMany(COLLECTION.idioms, idioms);
  },

  /* ---------------------------------------------------------------- *
   * Progresso nas expressões
   * ---------------------------------------------------------------- */

  async listIdiomProgress(userId: ID): Promise<IdiomProgress[]> {
    return getDatabase().query<IdiomProgress>(COLLECTION.idiomProgress, {
      where: [{ field: 'userId', op: '=', value: userId }],
    });
  },

  /** Registra que a expressão foi vista, e se foi acertada num exercício. */
  async recordIdiomSeen(userId: ID, idiomId: ID, correct?: boolean): Promise<IdiomProgress> {
    const id = deterministicId(userId, idiomId);
    const existing = await getDatabase().get<IdiomProgress>(COLLECTION.idiomProgress, id);

    const next: IdiomProgress = {
      id,
      userId,
      idiomId,
      seen: (existing?.seen ?? 0) + 1,
      correct: (existing?.correct ?? 0) + (correct === true ? 1 : 0),
      starred: existing?.starred ?? false,
      updatedAt: Date.now(),
    };

    await getDatabase().put(COLLECTION.idiomProgress, next);
    await syncRepository.enqueue('idiom_progress', next.id, 'upsert', next);
    return next;
  },

  async toggleIdiomStar(userId: ID, idiomId: ID): Promise<IdiomProgress> {
    const id = deterministicId(userId, idiomId);
    const existing = await getDatabase().get<IdiomProgress>(COLLECTION.idiomProgress, id);

    const next: IdiomProgress = {
      id,
      userId,
      idiomId,
      seen: existing?.seen ?? 0,
      correct: existing?.correct ?? 0,
      starred: !(existing?.starred ?? false),
      updatedAt: Date.now(),
    };

    await getDatabase().put(COLLECTION.idiomProgress, next);
    await syncRepository.enqueue('idiom_progress', next.id, 'upsert', next);
    return next;
  },
};
