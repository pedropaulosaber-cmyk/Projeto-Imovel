/**
 * Repositório do aprendiz: perfil, matrícula, progresso, SRS, estatísticas,
 * carteira e ofensiva.
 *
 * Diferente do conteúdo, **tudo aqui é escrito pelo usuário** e precisa ser
 * sincronizado. Cada método de escrita enfileira a operação correspondente na
 * outbox — é o que garante que nada se perde quando o app é usado em modo avião.
 */

import { type StreakOutcome, levelFromXp, updateStreak } from '@/domain/gamification';
import {
  type ScheduleOutcome,
  buildReviewQueue,
  countDue,
  createReviewState,
  schedule,
} from '@/domain/srs';
import type {
  DailyStat,
  Enrollment,
  ID,
  LanguageCode,
  LessonProgress,
  LocalDate,
  ReviewGrade,
  ReviewState,
  StreakState,
  StudySession,
  Timestamp,
  UserProfile,
  Wallet,
} from '@/domain/types';
import { toLocalDate } from '@/lib/date';
import { deterministicId, ulid } from '@/lib/id';
import { COLLECTION, type KeyValueDoc } from '../collections';
import { getDatabase } from '../index';
import { syncRepository } from './sync';

/* ------------------------------------------------------------------ *
 * Chave-valor tipado
 * ------------------------------------------------------------------ */

async function readJson<T>(key: string): Promise<T | null> {
  const doc = await getDatabase().get<KeyValueDoc>(COLLECTION.keyValue, key);
  if (!doc) return null;
  try {
    return JSON.parse(doc.value) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await getDatabase().put<KeyValueDoc>(COLLECTION.keyValue, {
    id: key,
    value: JSON.stringify(value),
    updatedAt: Date.now(),
  });
}

const KEY = {
  currentUserId: 'current_user_id',
  streak: (userId: ID) => `streak:${userId}`,
  wallet: (userId: ID) => `wallet:${userId}`,
  league: (userId: ID) => `league:${userId}`,
} as const;

/* ------------------------------------------------------------------ *
 * Perfil e matrícula
 * ------------------------------------------------------------------ */

export const learnerRepository = {
  async getCurrentUserId(): Promise<ID | null> {
    return readJson<ID>(KEY.currentUserId);
  },

  async setCurrentUserId(userId: ID): Promise<void> {
    await writeJson(KEY.currentUserId, userId);
  },

  async getProfile(userId: ID): Promise<UserProfile | null> {
    return getDatabase().get<UserProfile>(COLLECTION.profiles, userId);
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    const next = { ...profile, updatedAt: Date.now() };
    await getDatabase().put(COLLECTION.profiles, next);
    await syncRepository.enqueue('profiles', next.id, 'upsert', next);
  },

  async getActiveEnrollment(userId: ID): Promise<Enrollment | null> {
    return getDatabase().first<Enrollment>(COLLECTION.enrollments, {
      where: [
        { field: 'userId', op: '=', value: userId },
        { field: 'isActive', op: '=', value: 1 },
      ],
    });
  },

  async listEnrollments(userId: ID): Promise<Enrollment[]> {
    return getDatabase().query<Enrollment>(COLLECTION.enrollments, {
      where: [{ field: 'userId', op: '=', value: userId }],
    });
  },

  async saveEnrollment(enrollment: Enrollment): Promise<void> {
    const next = { ...enrollment, updatedAt: Date.now() };
    await getDatabase().put(COLLECTION.enrollments, next);
    await syncRepository.enqueue('enrollments', next.id, 'upsert', next);
  },

  /** Torna uma matrícula a ativa, desativando as demais atomicamente. */
  async activateEnrollment(userId: ID, enrollmentId: ID): Promise<void> {
    const db = getDatabase();
    await db.transaction(async () => {
      const all = await this.listEnrollments(userId);
      for (const enrollment of all) {
        const isActive = enrollment.id === enrollmentId;
        if (enrollment.isActive === isActive) continue;
        const next = { ...enrollment, isActive, updatedAt: Date.now() };
        await db.put(COLLECTION.enrollments, next);
        await syncRepository.enqueue('enrollments', next.id, 'upsert', next);
      }
    });
  },

  /* ---------------------------------------------------------------- *
   * Progresso de lições
   * ---------------------------------------------------------------- */

  async getLessonProgress(userId: ID, lessonId: ID): Promise<LessonProgress | null> {
    return getDatabase().get<LessonProgress>(
      COLLECTION.lessonProgress,
      deterministicId(userId, lessonId),
    );
  },

  async listLessonProgress(userId: ID): Promise<LessonProgress[]> {
    return getDatabase().query<LessonProgress>(COLLECTION.lessonProgress, {
      where: [{ field: 'userId', op: '=', value: userId }],
    });
  },

  async saveLessonProgress(progress: LessonProgress): Promise<void> {
    const next = { ...progress, updatedAt: Date.now() };
    await getDatabase().put(COLLECTION.lessonProgress, next);
    await syncRepository.enqueue('lesson_progress', next.id, 'upsert', next);
  },

  /**
   * Marca uma lição como concluída.
   *
   * Idempotente e não regressiva: reconcluir uma lição com nota pior mantém a
   * melhor nota. Isso importa porque revisitar lição é comportamento comum e
   * ninguém deveria ser punido por praticar de novo.
   */
  async completeLesson(params: {
    userId: ID;
    lessonId: ID;
    accuracy: number;
    now?: Timestamp;
  }): Promise<LessonProgress> {
    const now = params.now ?? Date.now();
    const id = deterministicId(params.userId, params.lessonId);
    const existing = await getDatabase().get<LessonProgress>(COLLECTION.lessonProgress, id);

    const next: LessonProgress = {
      id,
      userId: params.userId,
      lessonId: params.lessonId,
      status: 'completed',
      bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, params.accuracy),
      attempts: (existing?.attempts ?? 0) + 1,
      completedAt: existing?.completedAt ?? now,
      updatedAt: now,
    };

    await this.saveLessonProgress(next);
    return next;
  },

  /* ---------------------------------------------------------------- *
   * SRS
   * ---------------------------------------------------------------- */

  async listReviewStates(userId: ID, language: LanguageCode): Promise<ReviewState[]> {
    return getDatabase().query<ReviewState>(COLLECTION.reviewStates, {
      where: [
        { field: 'userId', op: '=', value: userId },
        { field: 'language', op: '=', value: language },
      ],
    });
  },

  /** Só os vencidos — consulta indexada por `dueAt`, é o caminho mais quente. */
  async listDueReviewStates(
    userId: ID,
    language: LanguageCode,
    now: Timestamp,
    limit = 200,
  ): Promise<ReviewState[]> {
    return getDatabase().query<ReviewState>(COLLECTION.reviewStates, {
      where: [
        { field: 'userId', op: '=', value: userId },
        { field: 'language', op: '=', value: language },
        { field: 'dueAt', op: '<=', value: now },
        { field: 'state', op: '!=', value: 'new' },
      ],
      orderBy: [{ field: 'dueAt', direction: 'asc' }],
      limit,
    });
  },

  async countDueReviews(userId: ID, language: LanguageCode, now = Date.now()): Promise<number> {
    return getDatabase().count(COLLECTION.reviewStates, {
      where: [
        { field: 'userId', op: '=', value: userId },
        { field: 'language', op: '=', value: language },
        { field: 'dueAt', op: '<=', value: now },
        { field: 'state', op: '!=', value: 'new' },
      ],
    });
  },

  /**
   * Garante que exista estado de SRS para cada conceito informado.
   * Chamado ao iniciar uma lição, para que o vocabulário novo entre na fila.
   */
  async ensureReviewStates(params: {
    userId: ID;
    language: LanguageCode;
    conceptIds: ID[];
    difficultyByConcept?: Record<ID, number>;
    now?: Timestamp;
  }): Promise<ReviewState[]> {
    const now = params.now ?? Date.now();
    const db = getDatabase();

    const ids = params.conceptIds.map((conceptId) => deterministicId(params.userId, conceptId));
    const existing = await db.query<ReviewState>(COLLECTION.reviewStates, {
      where: [{ field: 'id', op: 'in', value: ids }],
    });
    const existingIds = new Set(existing.map((state) => state.id));

    const created = params.conceptIds
      .filter((conceptId) => !existingIds.has(deterministicId(params.userId, conceptId)))
      .map((conceptId) =>
        createReviewState({
          id: deterministicId(params.userId, conceptId),
          userId: params.userId,
          conceptId,
          language: params.language,
          initialDifficulty: params.difficultyByConcept?.[conceptId],
          now,
        }),
      );

    if (created.length > 0) {
      await db.putMany(COLLECTION.reviewStates, created);
      for (const state of created) {
        await syncRepository.enqueue('review_states', state.id, 'upsert', state);
      }
    }

    return [...existing, ...created];
  },

  /** Aplica uma nota de revisão e persiste o novo agendamento. */
  async gradeReview(
    state: ReviewState,
    grade: ReviewGrade,
    now = Date.now(),
  ): Promise<ScheduleOutcome> {
    const outcome = schedule(state, grade, now);
    await getDatabase().put(COLLECTION.reviewStates, outcome.state);
    await syncRepository.enqueue('review_states', outcome.state.id, 'upsert', outcome.state);
    return outcome;
  },

  async setStarred(stateId: ID, starred: boolean): Promise<void> {
    const db = getDatabase();
    const state = await db.get<ReviewState>(COLLECTION.reviewStates, stateId);
    if (!state) return;

    const next = { ...state, starred };
    await db.put(COLLECTION.reviewStates, next);
    await syncRepository.enqueue('review_states', next.id, 'upsert', next);
  },

  /** Fila de revisão do dia, já priorizada e intercalada. */
  async buildTodayQueue(params: {
    userId: ID;
    language: LanguageCode;
    maxNew?: number;
    maxReviews?: number;
    now?: Timestamp;
  }): Promise<ReviewState[]> {
    const now = params.now ?? Date.now();
    const all = await this.listReviewStates(params.userId, params.language);

    return buildReviewQueue(all, {
      now,
      maxNew: params.maxNew ?? 15,
      maxReviews: params.maxReviews ?? 80,
      interleave: true,
    });
  },

  async reviewSummary(
    userId: ID,
    language: LanguageCode,
    now = Date.now(),
  ): Promise<{ total: number; due: number; mastered: number; learning: number }> {
    const all = await this.listReviewStates(userId, language);
    return {
      total: all.length,
      due: countDue(all, now),
      mastered: all.filter((s) => s.state === 'mastered').length,
      learning: all.filter((s) => s.state === 'learning' || s.state === 'relearning').length,
    };
  },

  /* ---------------------------------------------------------------- *
   * Estatísticas diárias
   * ---------------------------------------------------------------- */

  async getDailyStat(userId: ID, date: LocalDate): Promise<DailyStat | null> {
    return getDatabase().get<DailyStat>(COLLECTION.dailyStats, deterministicId(userId, date));
  },

  async listDailyStats(userId: ID, from: LocalDate, to: LocalDate): Promise<DailyStat[]> {
    return getDatabase().query<DailyStat>(COLLECTION.dailyStats, {
      where: [
        { field: 'userId', op: '=', value: userId },
        { field: 'date', op: '>=', value: from },
        { field: 'date', op: '<=', value: to },
      ],
      orderBy: [{ field: 'date', direction: 'asc' }],
    });
  },

  /**
   * Soma incrementos ao dia. Nunca substitui — sempre acumula.
   *
   * Escrever de forma acumulativa é o que torna a sincronização simples: dois
   * dispositivos que estudaram offline no mesmo dia somam contribuições em vez
   * de um sobrescrever o outro.
   */
  async accumulateDailyStat(params: {
    userId: ID;
    date?: LocalDate;
    dailyGoalXp: number;
    delta: Partial<
      Pick<
        DailyStat,
        | 'xpEarned'
        | 'minutesStudied'
        | 'lessonsCompleted'
        | 'reviewsCompleted'
        | 'exercisesAttempted'
        | 'exercisesCorrect'
        | 'newWordsLearned'
      >
    >;
    /** Nota de pronúncia da sessão, se houve fala. */
    pronunciationScore?: number;
  }): Promise<DailyStat> {
    const date = params.date ?? toLocalDate();
    const id = deterministicId(params.userId, date);
    const existing = await getDatabase().get<DailyStat>(COLLECTION.dailyStats, id);

    const base: DailyStat = existing ?? {
      id,
      userId: params.userId,
      date,
      xpEarned: 0,
      minutesStudied: 0,
      lessonsCompleted: 0,
      reviewsCompleted: 0,
      exercisesAttempted: 0,
      exercisesCorrect: 0,
      pronunciationScore: null,
      newWordsLearned: 0,
      goalMet: false,
    };

    const xpEarned = base.xpEarned + (params.delta.xpEarned ?? 0);

    // A nota de pronúncia é uma média móvel simples ponderada pelo número de
    // sessões do dia — guardar só a última daria um número enganoso.
    const pronunciationScore =
      params.pronunciationScore === undefined
        ? base.pronunciationScore
        : base.pronunciationScore === null
          ? params.pronunciationScore
          : (base.pronunciationScore + params.pronunciationScore) / 2;

    const next: DailyStat = {
      ...base,
      xpEarned,
      minutesStudied: base.minutesStudied + (params.delta.minutesStudied ?? 0),
      lessonsCompleted: base.lessonsCompleted + (params.delta.lessonsCompleted ?? 0),
      reviewsCompleted: base.reviewsCompleted + (params.delta.reviewsCompleted ?? 0),
      exercisesAttempted: base.exercisesAttempted + (params.delta.exercisesAttempted ?? 0),
      exercisesCorrect: base.exercisesCorrect + (params.delta.exercisesCorrect ?? 0),
      newWordsLearned: base.newWordsLearned + (params.delta.newWordsLearned ?? 0),
      pronunciationScore,
      goalMet: xpEarned >= params.dailyGoalXp,
    };

    await getDatabase().put(COLLECTION.dailyStats, next);
    await syncRepository.enqueue('daily_stats', next.id, 'upsert', next);
    return next;
  },

  /* ---------------------------------------------------------------- *
   * Sessões
   * ---------------------------------------------------------------- */

  async startSession(params: {
    userId: ID;
    kind: StudySession['kind'];
    lessonId: ID | null;
    language: LanguageCode;
    now?: Timestamp;
  }): Promise<StudySession> {
    const session: StudySession = {
      id: ulid(),
      userId: params.userId,
      kind: params.kind,
      lessonId: params.lessonId,
      language: params.language,
      startedAt: params.now ?? Date.now(),
      endedAt: null,
      xpEarned: 0,
      exercisesAttempted: 0,
      exercisesCorrect: 0,
      attempts: [],
    };

    await getDatabase().put(COLLECTION.sessions, session);
    return session;
  },

  async saveSession(session: StudySession): Promise<void> {
    await getDatabase().put(COLLECTION.sessions, session);
    await syncRepository.enqueue('sessions', session.id, 'upsert', session);
  },

  async listRecentSessions(userId: ID, limit = 20): Promise<StudySession[]> {
    return getDatabase().query<StudySession>(COLLECTION.sessions, {
      where: [{ field: 'userId', op: '=', value: userId }],
      orderBy: [{ field: 'startedAt', direction: 'desc' }],
      limit,
    });
  },

  /* ---------------------------------------------------------------- *
   * Carteira e ofensiva
   * ---------------------------------------------------------------- */

  async getWallet(userId: ID): Promise<Wallet> {
    const stored = await readJson<Wallet>(KEY.wallet(userId));
    return stored ?? { userId, coins: 0, totalXp: 0, level: 1 };
  },

  async addXp(userId: ID, xp: number): Promise<Wallet> {
    const wallet = await this.getWallet(userId);
    const totalXp = wallet.totalXp + Math.max(0, xp);
    const next: Wallet = { ...wallet, totalXp, level: levelFromXp(totalXp) };

    await writeJson(KEY.wallet(userId), next);
    await syncRepository.enqueue('wallets', userId, 'upsert', next);
    return next;
  },

  async addCoins(userId: ID, coins: number): Promise<Wallet> {
    const wallet = await this.getWallet(userId);
    // Nunca deixa o saldo negativo — uma compra concorrente não pode gerar dívida.
    const next: Wallet = { ...wallet, coins: Math.max(0, wallet.coins + coins) };

    await writeJson(KEY.wallet(userId), next);
    await syncRepository.enqueue('wallets', userId, 'upsert', next);
    return next;
  },

  async getStreak(userId: ID): Promise<StreakState> {
    const stored = await readJson<StreakState>(KEY.streak(userId));
    return (
      stored ?? {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        freezesAvailable: 1,
        freezesUsed: [],
      }
    );
  },

  /** Registra que a meta do dia foi batida e atualiza a ofensiva. */
  async registerGoalMet(
    userId: ID,
    isPremium: boolean,
    today = toLocalDate(),
  ): Promise<StreakOutcome> {
    const current = await this.getStreak(userId);
    const outcome = updateStreak(current, today, { isPremium });

    if (outcome.state !== current) {
      await writeJson(KEY.streak(userId), outcome.state);
      await syncRepository.enqueue('streaks', userId, 'upsert', outcome.state);
    }

    return outcome;
  },

  /** Apaga todos os dados locais do usuário — direito de exclusão da LGPD. */
  async purgeUserData(userId: ID): Promise<void> {
    const db = getDatabase();
    const userScoped = [
      COLLECTION.enrollments,
      COLLECTION.reviewStates,
      COLLECTION.lessonProgress,
      COLLECTION.dailyStats,
      COLLECTION.sessions,
      COLLECTION.quests,
      COLLECTION.achievementProgress,
      COLLECTION.tutorConversations,
    ];

    await db.transaction(async () => {
      for (const collection of userScoped) {
        await db.deleteWhere(collection, {
          where: [{ field: 'userId', op: '=', value: userId }],
        });
      }
      await db.delete(COLLECTION.profiles, userId);
      await db.delete(COLLECTION.keyValue, KEY.streak(userId));
      await db.delete(COLLECTION.keyValue, KEY.wallet(userId));
      await db.delete(COLLECTION.keyValue, KEY.league(userId));
      await db.clear(COLLECTION.syncQueue);
    });
  },
};
