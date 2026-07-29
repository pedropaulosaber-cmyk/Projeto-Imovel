/**
 * Lumo — Definição das coleções locais
 *
 * Cada coleção declara quais campos viram coluna indexada. A regra para
 * promover um campo: só entra aqui se for usado em WHERE ou ORDER BY de uma
 * consulta real do app. Índice a mais custa escrita e espaço em disco — os
 * dois recursos mais escassos num celular de entrada.
 */

import type {
  AchievementProgress,
  ContentBundle,
  Course,
  DailyStat,
  DownloadRecord,
  Enrollment,
  Exercise,
  Idiom,
  IdiomProgress,
  Lesson,
  LessonProgress,
  Module,
  Quest,
  ReviewState,
  StudySession,
  SyncOperation,
  TutorConversation,
  TutorMessage,
  UserProfile,
  VocabularyItem,
  Workbook,
  WorkbookDownload,
} from '@/domain/types';
import type { CollectionSpec } from './store';

export const COLLECTION = {
  profiles: 'profiles',
  enrollments: 'enrollments',
  courses: 'courses',
  modules: 'modules',
  lessons: 'lessons',
  exercises: 'exercises',
  vocabulary: 'vocabulary',
  reviewStates: 'review_states',
  lessonProgress: 'lesson_progress',
  dailyStats: 'daily_stats',
  sessions: 'sessions',
  quests: 'quests',
  achievementProgress: 'achievement_progress',
  tutorConversations: 'tutor_conversations',
  tutorMessages: 'tutor_messages',
  workbooks: 'workbooks',
  workbookDownloads: 'workbook_downloads',
  idioms: 'idioms',
  idiomProgress: 'idiom_progress',
  contentBundles: 'content_bundles',
  downloads: 'downloads',
  syncQueue: 'sync_queue',
  keyValue: 'key_value',
} as const;

export type CollectionName = (typeof COLLECTION)[keyof typeof COLLECTION];

/** Documento genérico de chave-valor, para estado que não merece coleção própria. */
export type KeyValueDoc = { id: string; value: string; updatedAt: number };

/**
 * `as unknown as CollectionSpec<never>` aparece na lista final porque a porta
 * é invariante em T. Cada spec continua tipada individualmente — a perda de
 * tipo acontece só na fronteira do array heterogêneo.
 */
function spec<T>(definition: CollectionSpec<T>): CollectionSpec<T> {
  return definition;
}

export const profilesCollection = spec<UserProfile>({
  name: COLLECTION.profiles,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'email', type: 'text', indexed: true },
    { name: 'plan', type: 'text' },
    { name: 'onboardingCompleted', type: 'integer' },
    { name: 'updatedAt', type: 'integer', indexed: true },
  ],
  indexer: (doc) => ({
    email: doc.email,
    plan: doc.plan,
    onboardingCompleted: doc.onboardingCompleted ? 1 : 0,
    updatedAt: doc.updatedAt,
  }),
});

export const enrollmentsCollection = spec<Enrollment>({
  name: COLLECTION.enrollments,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'userId', type: 'text', indexed: true },
    { name: 'language', type: 'text', indexed: true },
    { name: 'isActive', type: 'integer' },
  ],
  indexer: (doc) => ({
    userId: doc.userId,
    language: doc.language,
    isActive: doc.isActive ? 1 : 0,
  }),
});

export const coursesCollection = spec<Course>({
  name: COLLECTION.courses,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'language', type: 'text', indexed: true },
    { name: 'level', type: 'text' },
    { name: 'order', type: 'integer' },
  ],
  indexer: (doc) => ({ language: doc.language, level: doc.level, order: doc.order }),
});

export const modulesCollection = spec<Module>({
  name: COLLECTION.modules,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'courseId', type: 'text', indexed: true },
    { name: 'order', type: 'integer' },
  ],
  indexer: (doc) => ({ courseId: doc.courseId, order: doc.order }),
});

export const lessonsCollection = spec<Lesson>({
  name: COLLECTION.lessons,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'moduleId', type: 'text', indexed: true },
    { name: 'order', type: 'integer' },
    { name: 'kind', type: 'text' },
    { name: 'premium', type: 'integer' },
  ],
  indexer: (doc) => ({
    moduleId: doc.moduleId,
    order: doc.order,
    kind: doc.kind,
    premium: doc.premium ? 1 : 0,
  }),
});

export const exercisesCollection = spec<Exercise>({
  name: COLLECTION.exercises,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'lessonId', type: 'text', indexed: true },
    { name: 'order', type: 'integer' },
    { name: 'type', type: 'text' },
  ],
  indexer: (doc) => ({ lessonId: doc.lessonId, order: doc.order, type: doc.type }),
});

export const vocabularyCollection = spec<VocabularyItem>({
  name: COLLECTION.vocabulary,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'language', type: 'text', indexed: true },
    { name: 'term', type: 'text', indexed: true },
    { name: 'cefr', type: 'text' },
    { name: 'frequencyRank', type: 'integer', indexed: true },
  ],
  indexer: (doc) => ({
    language: doc.language,
    term: doc.term.toLowerCase(),
    cefr: doc.cefr,
    frequencyRank: doc.frequencyRank,
  }),
});

/**
 * A coleção mais quente do app. `dueAt` é consultada a cada abertura para
 * montar a fila de revisão, por isso tem índice próprio junto de `userId`.
 */
export const reviewStatesCollection = spec<ReviewState>({
  name: COLLECTION.reviewStates,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'userId', type: 'text', indexed: true },
    { name: 'language', type: 'text', indexed: true },
    { name: 'conceptId', type: 'text', indexed: true },
    { name: 'dueAt', type: 'integer', indexed: true },
    { name: 'state', type: 'text', indexed: true },
    { name: 'starred', type: 'integer' },
  ],
  indexer: (doc) => ({
    userId: doc.userId,
    language: doc.language,
    conceptId: doc.conceptId,
    dueAt: doc.dueAt,
    state: doc.state,
    starred: doc.starred ? 1 : 0,
  }),
});

export const lessonProgressCollection = spec<LessonProgress>({
  name: COLLECTION.lessonProgress,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'userId', type: 'text', indexed: true },
    { name: 'lessonId', type: 'text', indexed: true },
    { name: 'status', type: 'text' },
  ],
  indexer: (doc) => ({ userId: doc.userId, lessonId: doc.lessonId, status: doc.status }),
});

export const dailyStatsCollection = spec<DailyStat>({
  name: COLLECTION.dailyStats,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'userId', type: 'text', indexed: true },
    { name: 'date', type: 'text', indexed: true },
    { name: 'goalMet', type: 'integer' },
  ],
  indexer: (doc) => ({ userId: doc.userId, date: doc.date, goalMet: doc.goalMet ? 1 : 0 }),
});

export const sessionsCollection = spec<StudySession>({
  name: COLLECTION.sessions,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'userId', type: 'text', indexed: true },
    { name: 'startedAt', type: 'integer', indexed: true },
    { name: 'kind', type: 'text' },
    { name: 'language', type: 'text' },
  ],
  indexer: (doc) => ({
    userId: doc.userId,
    startedAt: doc.startedAt,
    kind: doc.kind,
    language: doc.language,
  }),
});

export const questsCollection = spec<Quest>({
  name: COLLECTION.quests,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'userId', type: 'text', indexed: true },
    { name: 'period', type: 'text' },
    { name: 'expiresAt', type: 'integer', indexed: true },
  ],
  indexer: (doc) => ({ userId: doc.userId, period: doc.period, expiresAt: doc.expiresAt }),
});

export const achievementProgressCollection = spec<AchievementProgress>({
  name: COLLECTION.achievementProgress,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'userId', type: 'text', indexed: true },
    { name: 'achievementId', type: 'text', indexed: true },
    { name: 'unlockedAt', type: 'integer' },
    { name: 'seen', type: 'integer' },
  ],
  indexer: (doc) => ({
    userId: doc.userId,
    achievementId: doc.achievementId,
    unlockedAt: doc.unlockedAt,
    seen: doc.seen ? 1 : 0,
  }),
});

export const tutorConversationsCollection = spec<TutorConversation>({
  name: COLLECTION.tutorConversations,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'userId', type: 'text', indexed: true },
    { name: 'language', type: 'text' },
    { name: 'updatedAt', type: 'integer', indexed: true },
  ],
  indexer: (doc) => ({
    userId: doc.userId,
    language: doc.language,
    updatedAt: doc.updatedAt,
  }),
});

export const tutorMessagesCollection = spec<TutorMessage>({
  name: COLLECTION.tutorMessages,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'conversationId', type: 'text', indexed: true },
    { name: 'createdAt', type: 'integer', indexed: true },
    { name: 'role', type: 'text' },
  ],
  indexer: (doc) => ({
    conversationId: doc.conversationId,
    createdAt: doc.createdAt,
    role: doc.role,
  }),
});

export const workbooksCollection = spec<Workbook>({
  name: COLLECTION.workbooks,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'language', type: 'text', indexed: true },
    { name: 'level', type: 'text', indexed: true },
    { name: 'courseId', type: 'text' },
  ],
  indexer: (doc) => ({ language: doc.language, level: doc.level, courseId: doc.courseId }),
});

export const workbookDownloadsCollection = spec<WorkbookDownload>({
  name: COLLECTION.workbookDownloads,
  idOf: (doc) => doc.id,
  indexes: [{ name: 'workbookId', type: 'text', indexed: true }],
  indexer: (doc) => ({ workbookId: doc.workbookId }),
});

export const idiomsCollection = spec<Idiom>({
  name: COLLECTION.idioms,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'language', type: 'text', indexed: true },
    { name: 'cefr', type: 'text', indexed: true },
    { name: 'register', type: 'text' },
    // Ordenar por frequência é a consulta padrão da tela: expressão comum
    // primeiro, curiosidade depois.
    { name: 'frequency', type: 'integer', indexed: true },
  ],
  indexer: (doc) => ({
    language: doc.language,
    cefr: doc.cefr,
    register: doc.register,
    frequency: doc.frequency,
  }),
});

export const idiomProgressCollection = spec<IdiomProgress>({
  name: COLLECTION.idiomProgress,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'userId', type: 'text', indexed: true },
    { name: 'idiomId', type: 'text', indexed: true },
    { name: 'starred', type: 'integer' },
  ],
  indexer: (doc) => ({
    userId: doc.userId,
    idiomId: doc.idiomId,
    starred: doc.starred ? 1 : 0,
  }),
});

export const contentBundlesCollection = spec<ContentBundle>({
  name: COLLECTION.contentBundles,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'language', type: 'text', indexed: true },
    { name: 'scope', type: 'text' },
    { name: 'scopeId', type: 'text' },
  ],
  indexer: (doc) => ({ language: doc.language, scope: doc.scope, scopeId: doc.scopeId }),
});

export const downloadsCollection = spec<DownloadRecord>({
  name: COLLECTION.downloads,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'bundleId', type: 'text', indexed: true },
    { name: 'status', type: 'text', indexed: true },
  ],
  indexer: (doc) => ({ bundleId: doc.bundleId, status: doc.status }),
});

/** Fila de saída da sincronização. Ordenada por relógio lógico. */
export const syncQueueCollection = spec<SyncOperation>({
  name: COLLECTION.syncQueue,
  idOf: (doc) => doc.id,
  indexes: [
    { name: 'entity', type: 'text', indexed: true },
    { name: 'entityId', type: 'text' },
    { name: 'clock', type: 'integer', indexed: true },
    { name: 'attempts', type: 'integer' },
  ],
  indexer: (doc) => ({
    entity: doc.entity,
    entityId: doc.entityId,
    clock: doc.clock,
    attempts: doc.attempts,
  }),
});

export const keyValueCollection = spec<KeyValueDoc>({
  name: COLLECTION.keyValue,
  idOf: (doc) => doc.id,
  indexes: [{ name: 'updatedAt', type: 'integer' }],
  indexer: (doc) => ({ updatedAt: doc.updatedAt }),
});

/** Todas as coleções, na ordem em que devem ser criadas. */
export const ALL_COLLECTIONS = [
  profilesCollection,
  enrollmentsCollection,
  coursesCollection,
  modulesCollection,
  lessonsCollection,
  exercisesCollection,
  vocabularyCollection,
  reviewStatesCollection,
  lessonProgressCollection,
  dailyStatsCollection,
  sessionsCollection,
  questsCollection,
  achievementProgressCollection,
  tutorConversationsCollection,
  tutorMessagesCollection,
  workbooksCollection,
  workbookDownloadsCollection,
  idiomsCollection,
  idiomProgressCollection,
  contentBundlesCollection,
  downloadsCollection,
  syncQueueCollection,
  keyValueCollection,
] as unknown as CollectionSpec<never>[];

/** Índice por nome, usado pelos adaptadores para achar o `indexer` certo. */
export const COLLECTION_BY_NAME = new Map<string, CollectionSpec<never>>(
  ALL_COLLECTIONS.map((collection) => [collection.name, collection]),
);
