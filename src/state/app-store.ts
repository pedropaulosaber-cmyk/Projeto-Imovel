/**
 * Estado global do app.
 *
 * Zustand em vez de Context + useReducer por dois motivos concretos:
 *  1. Seletores granulares — a barra de XP re-renderiza quando o XP muda, e a
 *     lista de lições não. Com Context, todo consumidor re-renderiza junto.
 *  2. Leitura fora de componente (`useAppStore.getState()`), necessária para o
 *     motor de sincronização e para handlers de background.
 *
 * O estado aqui é **derivado do banco local**, nunca a fonte de verdade. O
 * disco manda; a store é um cache reativo em memória. Isso mantém a promessa
 * offline-first: fechar o app não perde nada.
 */

import { create } from 'zustand';

import { seedContentIfNeeded } from '@/content/seed';
import { openDatabase } from '@/db';
import { contentRepository } from '@/db/repositories/content';
import { learnerRepository } from '@/db/repositories/learner';
import { syncRepository } from '@/db/repositories/sync';
import { levelProgress } from '@/domain/gamification';
import { buildStudyPlan, dailyGoalXp } from '@/domain/plan';
import type {
  DailyStat,
  Enrollment,
  LanguageCode,
  Lesson,
  LessonProgress,
  StreakState,
  StudyPlan,
  SyncStatus,
  UserProfile,
  Wallet,
} from '@/domain/types';
import { lastNDates, toLocalDate } from '@/lib/date';
import { ulid } from '@/lib/id';

export type AppStatus = 'idle' | 'loading' | 'ready' | 'error';

type AppState = {
  status: AppStatus;
  error: string | null;

  profile: UserProfile | null;
  enrollment: Enrollment | null;
  wallet: Wallet | null;
  streak: StreakState | null;
  plan: StudyPlan | null;

  /** Estatísticas dos últimos 30 dias, para o dashboard. */
  recentStats: DailyStat[];
  todayStat: DailyStat | null;

  lessons: Lesson[];
  lessonProgress: Record<string, LessonProgress>;
  dueReviewCount: number;

  syncStatus: SyncStatus;

  /* Ações */
  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;
  completeOnboarding: (params: OnboardingResult) => Promise<void>;
  switchLanguage: (language: LanguageCode) => Promise<void>;
  setSyncStatus: (status: SyncStatus) => void;
};

export type OnboardingResult = {
  displayName: string;
  language: LanguageCode;
  goals: Enrollment['goals'];
  level: Enrollment['currentLevel'];
  dailyMinutes: Enrollment['dailyMinutes'];
  studyDays: number[];
  reminderMinute: number | null;
};

const INITIAL_SYNC_STATUS: SyncStatus = {
  lastSyncAt: null,
  pendingOperations: 0,
  syncing: false,
  online: false,
  lastError: null,
};

export const useAppStore = create<AppState>((set, get) => ({
  status: 'idle',
  error: null,
  profile: null,
  enrollment: null,
  wallet: null,
  streak: null,
  plan: null,
  recentStats: [],
  todayStat: null,
  lessons: [],
  lessonProgress: {},
  dueReviewCount: 0,
  syncStatus: INITIAL_SYNC_STATUS,

  /**
   * Inicialização do app.
   *
   * Ordem deliberada: abrir banco → semear conteúdo → carregar usuário. Cada
   * etapa depende da anterior, e nenhuma depende de rede — é por isso que o
   * app abre igual de rápido no metrô e no wi-fi.
   */
  async bootstrap() {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });

    try {
      await openDatabase();
      await seedContentIfNeeded();

      const userId = await learnerRepository.getCurrentUserId();
      if (!userId) {
        // Sem usuário: o app vai para o onboarding.
        set({ status: 'ready', profile: null });
        return;
      }

      const profile = await learnerRepository.getProfile(userId);
      set({ profile });
      await get().refresh();
      set({ status: 'ready' });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Falha ao iniciar o aplicativo',
      });
    }
  },

  /** Recarrega tudo que a interface consome. Barato: é só leitura de disco. */
  async refresh() {
    const { profile } = get();
    if (!profile) return;

    const enrollment = await learnerRepository.getActiveEnrollment(profile.id);
    if (!enrollment) {
      set({ enrollment: null, plan: null, lessons: [] });
      return;
    }

    const today = toLocalDate();
    const window = lastNDates(30);

    const [wallet, streak, recentStats, reviewStates, courses, progressList, pending] =
      await Promise.all([
        learnerRepository.getWallet(profile.id),
        learnerRepository.getStreak(profile.id),
        learnerRepository.listDailyStats(profile.id, window[0] ?? today, today),
        learnerRepository.listReviewStates(profile.id, enrollment.language),
        contentRepository.listCourses(enrollment.language),
        learnerRepository.listLessonProgress(profile.id),
        syncRepository.pendingCount(),
      ]);

    const course = courses[0];
    const lessons = course ? await contentRepository.listLessonsForCourse(course.id) : [];

    const progressByLesson: Record<string, LessonProgress> = {};
    for (const progress of progressList) {
      progressByLesson[progress.lessonId] = progress;
    }

    const nextLesson = lessons.find(
      (lesson) => progressByLesson[lesson.id]?.status !== 'completed',
    );

    const now = Date.now();
    const plan = buildStudyPlan({
      userId: profile.id,
      language: enrollment.language,
      date: today,
      level: enrollment.currentLevel,
      goals: enrollment.goals,
      dailyMinutes: enrollment.dailyMinutes,
      studyDays: enrollment.studyDays,
      reviewStates,
      recentStats,
      nextLesson: nextLesson
        ? {
            id: nextLesson.id,
            title: nextLesson.title,
            estimatedMinutes: nextLesson.estimatedMinutes,
            xpReward: nextLesson.xpReward,
          }
        : null,
      now,
    });

    set({
      enrollment,
      wallet,
      streak,
      recentStats,
      todayStat: recentStats.find((stat) => stat.date === today) ?? null,
      lessons,
      lessonProgress: progressByLesson,
      dueReviewCount: reviewStates.filter((s) => s.state !== 'new' && s.dueAt <= now).length,
      plan,
      syncStatus: { ...get().syncStatus, pendingOperations: pending },
    });
  },

  /**
   * Conclui o onboarding criando o perfil local.
   *
   * Repare que **não há chamada de rede aqui**. A conta nasce local e é
   * reivindicada por e-mail depois, quando (e se) o usuário quiser sincronizar.
   * Exigir cadastro antes de experimentar o produto é o maior ponto de perda de
   * funil em apps de educação.
   */
  async completeOnboarding(params) {
    const now = Date.now();
    const userId = ulid();

    const profile: UserProfile = {
      id: userId,
      displayName: params.displayName || 'Estudante',
      email: null,
      avatarUrl: null,
      bio: null,
      uiLanguage: 'pt',
      nativeLanguage: 'pt-BR',
      plan: 'free',
      planExpiresAt: null,
      createdAt: now,
      updatedAt: now,
      onboardingCompleted: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'America/Sao_Paulo',
    };

    const enrollment: Enrollment = {
      id: ulid(),
      userId,
      language: params.language,
      goals: params.goals,
      currentLevel: params.level,
      dailyGoalXp: dailyGoalXp(params.dailyMinutes),
      dailyMinutes: params.dailyMinutes,
      studyDays: params.studyDays,
      reminderMinute: params.reminderMinute,
      startedAt: now,
      isActive: true,
      updatedAt: now,
    };

    await learnerRepository.saveProfile(profile);
    await learnerRepository.saveEnrollment(enrollment);
    await learnerRepository.setCurrentUserId(userId);

    set({ profile, enrollment });
    await get().refresh();
  },

  /** Troca o idioma ativo, criando a matrícula se ainda não existir. */
  async switchLanguage(language) {
    const { profile, enrollment } = get();
    if (!profile) return;

    const enrollments = await learnerRepository.listEnrollments(profile.id);
    const existing = enrollments.find((item) => item.language === language);

    if (existing) {
      await learnerRepository.activateEnrollment(profile.id, existing.id);
    } else {
      const now = Date.now();
      const created: Enrollment = {
        id: ulid(),
        userId: profile.id,
        language,
        goals: enrollment?.goals ?? ['conversation'],
        currentLevel: 'A1',
        dailyGoalXp: enrollment?.dailyGoalXp ?? dailyGoalXp(10),
        dailyMinutes: enrollment?.dailyMinutes ?? 10,
        studyDays: enrollment?.studyDays ?? [1, 2, 3, 4, 5],
        reminderMinute: enrollment?.reminderMinute ?? null,
        startedAt: now,
        isActive: true,
        updatedAt: now,
      };
      await learnerRepository.saveEnrollment(created);
      await learnerRepository.activateEnrollment(profile.id, created.id);
    }

    await get().refresh();
  },

  setSyncStatus(status) {
    set({ syncStatus: status });
  },
}));

/* ------------------------------------------------------------------ *
 * Seletores derivados
 * ------------------------------------------------------------------ */

/**
 * Seletores exportados como funções nomeadas para que o Zustand possa comparar
 * por referência e evitar re-render. Arrow function inline no `useAppStore()`
 * cria uma referência nova a cada render e anula a otimização.
 */
export const selectLevelProgress = (state: AppState) =>
  levelProgress(state.wallet?.totalXp ?? 0);

export const selectTodayXp = (state: AppState) => state.todayStat?.xpEarned ?? 0;

export const selectGoalRatio = (state: AppState) => {
  const goal = state.enrollment?.dailyGoalXp ?? 1;
  return Math.min(1, (state.todayStat?.xpEarned ?? 0) / Math.max(1, goal));
};

export const selectGoalMet = (state: AppState) =>
  (state.todayStat?.xpEarned ?? 0) >=
  (state.enrollment?.dailyGoalXp ?? Number.POSITIVE_INFINITY);

/** Precisão média dos últimos 30 dias, 0–1. */
export const selectAccuracy = (state: AppState) => {
  const attempted = state.recentStats.reduce((sum, stat) => sum + stat.exercisesAttempted, 0);
  const correct = state.recentStats.reduce((sum, stat) => sum + stat.exercisesCorrect, 0);
  return attempted === 0 ? 0 : correct / attempted;
};

export const selectTotalMinutes = (state: AppState) =>
  state.recentStats.reduce((sum, stat) => sum + stat.minutesStudied, 0);

export const selectWordsLearned = (state: AppState) =>
  state.recentStats.reduce((sum, stat) => sum + stat.newWordsLearned, 0);

/** Média de pronúncia dos dias em que houve prática de fala. */
export const selectPronunciation = (state: AppState) => {
  const scored = state.recentStats.filter((stat) => stat.pronunciationScore !== null);
  if (scored.length === 0) return null;
  return scored.reduce((sum, stat) => sum + (stat.pronunciationScore ?? 0), 0) / scored.length;
};

export const selectIsPremium = (state: AppState) =>
  state.profile?.plan !== undefined && state.profile.plan !== 'free';
