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

import { useMemo } from 'react';
import { create } from 'zustand';

import { seedContentIfNeeded } from '@/content/seed';
import { openDatabase } from '@/db';
import { contentRepository } from '@/db/repositories/content';
import { learnerRepository } from '@/db/repositories/learner';
import { syncRepository } from '@/db/repositories/sync';
import { levelProgress } from '@/domain/gamification';
import { buildStudyPlan, dailyGoalXp } from '@/domain/plan';
import type {
  CefrLevel,
  DailyStat,
  Enrollment,
  LanguageCode,
  LearningMode,
  Lesson,
  LessonProgress,
  StreakState,
  StudyPlan,
  SyncStatus,
  UserProfile,
  Wallet,
} from '@/domain/types';
import { RETIRED_LANGUAGES } from '@/domain/types';
import { lastNDates, toLocalDate } from '@/lib/date';
import { ulid } from '@/lib/id';

export type AppStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * A matrícula aponta para um idioma que o app não oferece mais?
 *
 * Japonês, coreano e mandarim saíram do catálogo. Quem tinha matrícula neles
 * continua com o registro gravado no disco, e `listCourses` devolveria lista
 * vazia — a trilha ficaria em branco **sem erro nenhum**, que é o pior tipo de
 * defeito: silencioso. Aqui a matrícula obsoleta é tratada como "sem
 * matrícula", e a interface manda o aluno escolher um idioma de novo.
 */
function isRetiredLanguage(language: string): boolean {
  return (RETIRED_LANGUAGES as readonly string[]).includes(language);
}

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
  setLearningMode: (mode: LearningMode) => Promise<void>;
  setCurrentLevel: (level: CefrLevel) => Promise<void>;
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
    // Matrícula num idioma aposentado equivale a não ter matrícula: sem isso a
    // trilha renderiza vazia e o aluno não descobre por quê. Ver
    // `isRetiredLanguage`.
    if (!enrollment || isRetiredLanguage(enrollment.language)) {
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

    // Existem seis cursos por idioma (A1–C2). O aluno estuda o do **seu**
    // nível — pegar `courses[0]` mandaria todo mundo para o A1 e faria a troca
    // de nível não surtir efeito nenhum na trilha.
    //
    // O fallback para o primeiro curso cobre o caso de um nível sem conteúdo
    // gerado: melhor mostrar a trilha de A1 do que uma tela vazia.
    const course = courses.find((item) => item.level === enrollment.currentLevel) ?? courses[0];
    // Passa os objetivos: a trilha é reordenada para começar pelo que o aluno
    // disse que quer. Ver `content/goal-tracks.ts` — nenhum módulo é removido,
    // só reordenado, porque podar conteúdo por uma resposta de trinta segundos
    // cria buracos que só aparecem meses depois.
    const lessons = course
      ? await contentRepository.listLessonsForCourse(course.id, enrollment.goals)
      : [];

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
      learningMode: enrollment.learningMode,
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
      // Todo mundo começa no modo completo; trocar é um toque no perfil.
      learningMode: 'complete',
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
        // Herda o modo do idioma atual: quem escolheu o Essencial não quer
        // ser jogado no modo completo ao adicionar outro idioma.
        learningMode: enrollment?.learningMode ?? 'complete',
        updatedAt: now,
      };
      await learnerRepository.saveEnrollment(created);
      await learnerRepository.activateEnrollment(profile.id, created.id);
    }

    await get().refresh();
  },

  /**
   * Alterna entre o modo Completo e o Essencial.
   *
   * Só a matrícula ativa muda: o modo é uma escolha por idioma, não global.
   * Faz sentido estudar inglês a fundo e espanhol em cinco minutos por dia.
   */
  async setLearningMode(mode) {
    const { enrollment } = get();
    if (!enrollment || enrollment.learningMode === mode) return;

    await learnerRepository.saveEnrollment({ ...enrollment, learningMode: mode });
    await get().refresh();
  },

  /**
   * Muda o nível CEFR do curso em andamento.
   *
   * Nada de progresso é apagado. Lições concluídas continuam concluídas, o
   * banco de vocabulário fica inteiro e a fila de revisão não é tocada — o
   * nível define o **conteúdo daqui para frente** (dificuldade das lições,
   * corte das expressões, apostila em destaque), não um estado a ser zerado.
   *
   * Apagar o histórico ao trocar de nível é o erro clássico do gênero: torna a
   * correção de um nivelamento errado tão cara que o usuário prefere continuar
   * no lugar errado.
   */
  async setCurrentLevel(level) {
    const { enrollment } = get();
    if (!enrollment || enrollment.currentLevel === level) return;

    await learnerRepository.saveEnrollment({ ...enrollment, currentLevel: level });
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
 *
 * ## Regra inegociável: um seletor NUNCA pode criar objeto ou array
 *
 * O Zustand v5 compara o resultado do seletor com `Object.is`. Um seletor que
 * devolve `{...}` ou `[...]` produz uma referência nova a cada avaliação, o
 * store considera que o estado mudou, re-renderiza, avalia de novo — e o React
 * aborta com "Maximum update depth exceeded" (erro #185), derrubando a árvore
 * inteira com tela branca.
 *
 * Foi exatamente isso que quebrou a aba Progresso: um seletor devolvia o objeto
 * de `levelProgress()`. Sempre que precisar de um valor derivado composto,
 * selecione o **primitivo** e derive com `useMemo` no componente — como faz
 * `useLevelProgress()` abaixo.
 */

/** XP total acumulado. Primitivo — seguro como seletor. */
export const selectTotalXp = (state: AppState) => state.wallet?.totalXp ?? 0;

/**
 * Progresso de nível pronto para a UI.
 *
 * Hook em vez de seletor porque `levelProgress()` devolve um objeto: a
 * assinatura no store é feita sobre o XP (primitivo) e o objeto é derivado
 * depois, memorizado. Ver a regra acima.
 */
export function useLevelProgress() {
  const totalXp = useAppStore(selectTotalXp);
  return useMemo(() => levelProgress(totalXp), [totalXp]);
}

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
