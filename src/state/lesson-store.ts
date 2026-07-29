/**
 * Estado de uma sessão de lição.
 *
 * Vive separado da store global porque tem ciclo de vida próprio (nasce e
 * morre com a tela da lição) e porque uma sessão em andamento muda de estado
 * a cada segundo — misturar isso com o estado do app faria o dashboard
 * re-renderizar a cada tecla digitada num exercício.
 *
 * ## Sistema de vidas
 *
 * O plano gratuito tem 5 vidas por sessão. A decisão de produto por trás:
 * vidas criam consequência para o erro sem punir de verdade (elas voltam), e
 * são o gatilho de conversão mais eficaz do segmento. Assinantes têm vidas
 * infinitas — o que estão comprando é justamente não pensar nisso.
 */

import { create } from 'zustand';

import { contentRepository } from '@/db/repositories/content';
import { learnerRepository } from '@/db/repositories/learner';
import { hasFullAccess } from '@/domain/access';
import { xpForLesson } from '@/domain/gamification';
import { type UserAnswer, gradeExercise } from '@/domain/grading';
import { adaptExercisesToMode, heartsForMode } from '@/domain/learning-mode';
import { gradeFromPerformance } from '@/domain/srs';
import type {
  Exercise,
  ExerciseAttempt,
  ExerciseResult,
  Lesson,
  StudySession,
} from '@/domain/types';
import { toLocalDate } from '@/lib/date';

export const MAX_HEARTS = 5;

export type LessonPhase = 'loading' | 'active' | 'feedback' | 'complete' | 'failed' | 'error';

type LessonState = {
  phase: LessonPhase;
  lesson: Lesson | null;
  exercises: Exercise[];
  index: number;
  session: StudySession | null;

  hearts: number;
  attempts: ExerciseAttempt[];
  /** Resultado do exercício atual, enquanto a tela mostra o feedback. */
  lastResult: ExerciseResult | null;
  /** Exercícios errados, reinseridos no fim da fila. */
  retryQueue: Exercise[];

  hintUsed: boolean;
  startedAt: number;
  questionStartedAt: number;

  /** Resumo mostrado na tela de conclusão. */
  summary: {
    xp: number;
    breakdown: { label: string; xp: number }[];
    accuracy: number;
    durationMinutes: number;
    newWords: number;
    /** Presente só quando a lição era uma prova de nível. */
    exam: { score: number; passed: boolean; correctCount: number; totalCount: number } | null;
  } | null;

  /* Ações */
  start: (lessonId: string, isPremium: boolean) => Promise<void>;
  submit: (answer: UserAnswer) => Promise<void>;
  advance: () => Promise<void>;
  useHint: () => void;
  abandon: () => void;
};

export const useLessonStore = create<LessonState>((set, get) => ({
  phase: 'loading',
  lesson: null,
  exercises: [],
  index: 0,
  session: null,
  hearts: MAX_HEARTS,
  attempts: [],
  lastResult: null,
  retryQueue: [],
  hintUsed: false,
  startedAt: 0,
  questionStartedAt: 0,
  summary: null,

  async start(lessonId, isPremium) {
    set({ phase: 'loading' });

    try {
      const [lesson, exercises] = await Promise.all([
        contentRepository.getLesson(lessonId),
        contentRepository.listExercises(lessonId),
      ]);

      if (!lesson || exercises.length === 0) {
        set({ phase: 'error' });
        return;
      }

      const userId = await learnerRepository.getCurrentUserId();
      const enrollment = userId ? await learnerRepository.getActiveEnrollment(userId) : null;

      const session =
        userId && enrollment
          ? await learnerRepository.startSession({
              userId,
              kind: 'lesson',
              lessonId,
              language: enrollment.language,
            })
          : null;

      // O modo de aprendizado decide o repertório e o tamanho da sessão. Ver
      // `src/domain/learning-mode.ts` — a correção e o SRS não mudam, só a
      // quantidade e a variedade de mecânicas apresentadas.
      const mode = enrollment?.learningMode ?? 'complete';
      const queue = adaptExercisesToMode(exercises, mode);

      // Registra no SRS os conceitos da lição já na abertura. Assim, mesmo que
      // o usuário abandone no meio, o vocabulário visto entra na fila de
      // revisão — o contato já aconteceu e a memória já começou a decair.
      //
      // Usa a fila adaptada, não a lição inteira: no Essencial, criar estado de
      // revisão para conceitos que não vão aparecer geraria dívida de memória
      // sobre material nunca apresentado.
      if (userId && enrollment) {
        const conceptIds = [...new Set(queue.flatMap((exercise) => exercise.conceptIds))];
        await learnerRepository.ensureReviewStates({
          userId,
          language: enrollment.language,
          conceptIds,
        });
      }

      const now = Date.now();
      set({
        phase: 'active',
        lesson,
        exercises: queue,
        index: 0,
        session,
        hearts: heartsForMode(mode, isPremium),
        attempts: [],
        retryQueue: [],
        lastResult: null,
        hintUsed: false,
        startedAt: now,
        questionStartedAt: now,
        summary: null,
      });
    } catch {
      set({ phase: 'error' });
    }
  },

  /**
   * Corrige a resposta e registra a tentativa.
   *
   * A correção é **local e síncrona** — o feedback aparece no mesmo frame do
   * toque. Tudo o que exige I/O (gravar SRS, estatísticas) acontece depois,
   * sem bloquear a interface.
   */
  async submit(answer) {
    const state = get();
    const exercise = state.exercises[state.index];
    if (!exercise || state.phase !== 'active') return;

    const result = gradeExercise(exercise, answer);
    const responseMs = Date.now() - state.questionStartedAt;

    const attempt: ExerciseAttempt = {
      exerciseId: exercise.id,
      type: exercise.type,
      correct: result.correct,
      score: result.score,
      responseMs,
      usedHint: state.hintUsed,
      answeredAt: Date.now(),
    };

    const hearts = result.correct ? state.hearts : state.hearts - 1;

    set({
      phase: 'feedback',
      lastResult: result,
      attempts: [...state.attempts, attempt],
      hearts,
      // Errar reinsere o exercício no fim da fila. Repetir o item errado na
      // mesma sessão é a forma mais barata de recuperação ativa que existe.
      retryQueue: result.correct ? state.retryQueue : [...state.retryQueue, exercise],
    });

    // Atualiza o SRS em background — a nota vem do desempenho, não de
    // auto-avaliação (ver `gradeFromPerformance`).
    void (async () => {
      const userId = await learnerRepository.getCurrentUserId();
      const enrollment = userId ? await learnerRepository.getActiveEnrollment(userId) : null;
      if (!userId || !enrollment) return;

      const grade = gradeFromPerformance(result.correct, responseMs, state.hintUsed);
      const states = await learnerRepository.ensureReviewStates({
        userId,
        language: enrollment.language,
        conceptIds: exercise.conceptIds,
      });

      for (const reviewState of states) {
        await learnerRepository.gradeReview(reviewState, grade);
      }
    })();
  },

  /** Avança para o próximo exercício ou finaliza a lição. */
  async advance() {
    const state = get();

    if (state.hearts <= 0) {
      set({ phase: 'failed' });
      return;
    }

    const nextIndex = state.index + 1;

    if (nextIndex < state.exercises.length) {
      set({
        phase: 'active',
        index: nextIndex,
        lastResult: null,
        hintUsed: false,
        questionStartedAt: Date.now(),
      });
      return;
    }

    // Fila principal esgotada: reapresenta os que ainda não foram acertados.
    if (state.retryQueue.length > 0) {
      set({
        phase: 'active',
        exercises: [...state.exercises, ...state.retryQueue],
        retryQueue: [],
        index: nextIndex,
        lastResult: null,
        hintUsed: false,
        questionStartedAt: Date.now(),
      });
      return;
    }

    await finishLesson(set, get);
  },

  useHint() {
    set({ hintUsed: true });
  },

  abandon() {
    set({
      phase: 'loading',
      lesson: null,
      exercises: [],
      index: 0,
      attempts: [],
      retryQueue: [],
      lastResult: null,
      summary: null,
    });
  },
}));

/**
 * Fecha a lição: XP, progresso, estatísticas e ofensiva, tudo de uma vez.
 *
 * Extraída da store para manter as ações legíveis — esta é a parte com mais
 * efeitos colaterais do app inteiro e merece ficar isolada e comentada.
 */
async function finishLesson(
  set: (partial: Partial<LessonState>) => void,
  get: () => LessonState,
): Promise<void> {
  const state = get();
  const { lesson, attempts, session } = state;
  if (!lesson) return;

  const userId = await learnerRepository.getCurrentUserId();
  const enrollment = userId ? await learnerRepository.getActiveEnrollment(userId) : null;

  const correct = attempts.filter((attempt) => attempt.correct).length;
  const accuracy = attempts.length === 0 ? 0 : correct / attempts.length;
  const durationMinutes = Math.max(1, Math.round((Date.now() - state.startedAt) / 60_000));

  const difficulties: Record<string, number> = {};
  for (const exercise of state.exercises) {
    difficulties[exercise.id] = exercise.difficulty;
  }

  const streak = userId ? await learnerRepository.getStreak(userId) : null;

  let examResult: Awaited<ReturnType<typeof learnerRepository.recordExamResult>> | null = null;

  const { total: xp, breakdown } = xpForLesson({
    attempts,
    difficulties,
    lessonXpReward: lesson.xpReward,
    streakDays: streak?.currentStreak ?? 0,
  });

  const newWords = new Set(state.exercises.flatMap((exercise) => exercise.conceptIds)).size;

  if (userId && enrollment) {
    const speechAttempts = attempts.filter(
      (attempt) => attempt.type === 'speak' || attempt.type === 'shadowing',
    );
    const pronunciationScore =
      speechAttempts.length > 0
        ? speechAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
          speechAttempts.length
        : undefined;

    await learnerRepository.completeLesson({
      userId,
      lessonId: lesson.id,
      accuracy,
    });

    await learnerRepository.addXp(userId, xp);

    const stat = await learnerRepository.accumulateDailyStat({
      userId,
      dailyGoalXp: enrollment.dailyGoalXp,
      pronunciationScore,
      delta: {
        xpEarned: xp,
        minutesStudied: durationMinutes,
        lessonsCompleted: 1,
        exercisesAttempted: attempts.length,
        exercisesCorrect: correct,
        newWordsLearned: newWords,
      },
    });

    // A ofensiva só avança quando a meta do dia é batida — não a cada lição.
    // Amarrar a ofensiva ao *compromisso* declarado é o que a torna
    // significativa em vez de decorativa.
    if (stat.goalMet) {
      const profile = await learnerRepository.getProfile(userId);
      await learnerRepository.registerGoalMet(userId, hasFullAccess(profile), toLocalDate());
    }

    if (session) {
      await learnerRepository.saveSession({
        ...session,
        endedAt: Date.now(),
        xpEarned: xp,
        exercisesAttempted: attempts.length,
        exercisesCorrect: correct,
        attempts,
      });
    }

    // Prova de nível: registra a tentativa como avaliação, além do progresso.
    // São perguntas diferentes — o progresso diz "passou por aqui", a prova
    // diz "sabe isto" — e por isso moram em coleções separadas.
    if (lesson.kind === 'exam') {
      const module = await contentRepository.getModule(lesson.moduleId);
      const course = module ? await contentRepository.getCourse(module.courseId) : null;

      examResult = await learnerRepository.recordExamResult({
        userId,
        lessonId: lesson.id,
        moduleId: lesson.moduleId,
        language: enrollment.language,
        level: course?.level ?? enrollment.currentLevel,
        correctCount: correct,
        totalCount: attempts.length,
      });
    }
  }

  set({
    phase: 'complete',
    summary: {
      xp,
      breakdown,
      accuracy,
      durationMinutes,
      newWords,
      exam: examResult
        ? {
            score: examResult.score,
            passed: examResult.passed,
            correctCount: examResult.correctCount,
            totalCount: examResult.totalCount,
          }
        : null,
    },
  });
}
