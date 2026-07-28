/**
 * Testes das políticas de merge da sincronização.
 *
 * Este é o código onde um bug **apaga estudo real do usuário** — o pior tipo de
 * falha que este app pode ter. Por isso os testes verificam a propriedade que
 * importa mais do que qualquer valor específico: **convergência**. Aplicar o
 * merge em qualquer ordem tem de dar o mesmo resultado, ou dois aparelhos
 * offline nunca chegam ao mesmo estado.
 */

import type { DailyStat, LessonProgress, ReviewState, StreakState } from '@/domain/types';
import {
  ENTITY_POLICY,
  mergeDailyStat,
  mergeLessonProgress,
  mergeReviewState,
  mergeStreak,
} from '../merge';

function stat(overrides: Partial<DailyStat> = {}): DailyStat {
  return {
    id: 'u:2026-03-10',
    userId: 'u',
    date: '2026-03-10',
    xpEarned: 0,
    minutesStudied: 0,
    lessonsCompleted: 0,
    reviewsCompleted: 0,
    exercisesAttempted: 0,
    exercisesCorrect: 0,
    pronunciationScore: null,
    newWordsLearned: 0,
    goalMet: false,
    ...overrides,
  };
}

function progress(overrides: Partial<LessonProgress> = {}): LessonProgress {
  return {
    id: 'u:l1',
    userId: 'u',
    lessonId: 'l1',
    status: 'available',
    bestAccuracy: 0,
    attempts: 0,
    completedAt: null,
    updatedAt: 0,
    ...overrides,
  };
}

function reviewState(overrides: Partial<ReviewState> = {}): ReviewState {
  return {
    id: 'u:c1',
    userId: 'u',
    conceptId: 'c1',
    language: 'en',
    easeFactor: 2.5,
    intervalDays: 1,
    repetitions: 1,
    dueAt: 1000,
    lastReviewedAt: 500,
    stability: 2,
    difficulty: 0.3,
    lapses: 0,
    totalReviews: 1,
    state: 'review',
    starred: false,
    ...overrides,
  };
}

function streak(overrides: Partial<StreakState> = {}): StreakState {
  return {
    userId: 'u',
    currentStreak: 3,
    longestStreak: 5,
    lastActiveDate: '2026-03-10',
    freezesAvailable: 2,
    freezesUsed: [],
    ...overrides,
  };
}

describe('ENTITY_POLICY', () => {
  it('classifica as entidades críticas nas políticas certas', () => {
    expect(ENTITY_POLICY.daily_stats).toBe('additive');
    expect(ENTITY_POLICY.lesson_progress).toBe('monotonic');
    expect(ENTITY_POLICY.review_states).toBe('monotonic');
    expect(ENTITY_POLICY.streaks).toBe('monotonic');
    expect(ENTITY_POLICY.profiles).toBe('lww');
  });
});

describe('mergeDailyStat', () => {
  it('mantém o maior valor de cada contador', () => {
    const local = stat({ xpEarned: 120, minutesStudied: 10, exercisesCorrect: 8 });
    const remote = stat({ xpEarned: 80, minutesStudied: 25, exercisesCorrect: 15 });

    const merged = mergeDailyStat(local, remote);

    expect(merged.xpEarned).toBe(120);
    expect(merged.minutesStudied).toBe(25);
    expect(merged.exercisesCorrect).toBe(15);
  });

  it('é idempotente — reaplicar não infla os números', () => {
    const local = stat({ xpEarned: 120, minutesStudied: 10 });
    const remote = stat({ xpEarned: 80, minutesStudied: 25 });

    const once = mergeDailyStat(local, remote);
    const twice = mergeDailyStat(once, remote);
    const thrice = mergeDailyStat(twice, remote);

    expect(twice).toEqual(once);
    expect(thrice).toEqual(once);
  });

  it('converge independentemente da ordem', () => {
    const a = stat({ xpEarned: 120, minutesStudied: 10, reviewsCompleted: 3 });
    const b = stat({ xpEarned: 80, minutesStudied: 25, reviewsCompleted: 9 });

    const ab = mergeDailyStat(a, b);
    const ba = mergeDailyStat(b, a);

    expect(ab.xpEarned).toBe(ba.xpEarned);
    expect(ab.minutesStudied).toBe(ba.minutesStudied);
    expect(ab.reviewsCompleted).toBe(ba.reviewsCompleted);
  });

  it('a meta batida em qualquer lado permanece batida', () => {
    expect(mergeDailyStat(stat({ goalMet: false }), stat({ goalMet: true })).goalMet).toBe(
      true,
    );
    expect(mergeDailyStat(stat({ goalMet: true }), stat({ goalMet: false })).goalMet).toBe(
      true,
    );
  });

  it('herda a nota de pronúncia quando um dos lados não tem', () => {
    expect(
      mergeDailyStat(stat({ pronunciationScore: null }), stat({ pronunciationScore: 0.8 }))
        .pronunciationScore,
    ).toBe(0.8);

    expect(
      mergeDailyStat(stat({ pronunciationScore: 0.6 }), stat({ pronunciationScore: null }))
        .pronunciationScore,
    ).toBe(0.6);
  });
});

describe('mergeLessonProgress', () => {
  it('mantém o status mais avançado', () => {
    const merged = mergeLessonProgress(
      progress({ status: 'in_progress' }),
      progress({ status: 'completed' }),
    );
    expect(merged.status).toBe('completed');
  });

  it('nunca regride de concluída para em andamento', () => {
    const merged = mergeLessonProgress(
      progress({ status: 'completed' }),
      progress({ status: 'available' }),
    );
    expect(merged.status).toBe('completed');
  });

  it('mantém a melhor precisão', () => {
    const merged = mergeLessonProgress(
      progress({ bestAccuracy: 0.9 }),
      progress({ bestAccuracy: 0.6 }),
    );
    expect(merged.bestAccuracy).toBe(0.9);
  });

  it('preserva a data original de conclusão', () => {
    const merged = mergeLessonProgress(
      progress({ status: 'completed', completedAt: 5000 }),
      progress({ status: 'completed', completedAt: 3000 }),
    );
    expect(merged.completedAt).toBe(3000);
  });

  it('converge independentemente da ordem', () => {
    const a = progress({
      status: 'completed',
      bestAccuracy: 0.9,
      attempts: 2,
      completedAt: 5000,
    });
    const b = progress({
      status: 'in_progress',
      bestAccuracy: 0.6,
      attempts: 5,
      completedAt: null,
    });

    const ab = mergeLessonProgress(a, b);
    const ba = mergeLessonProgress(b, a);

    expect(ab.status).toBe(ba.status);
    expect(ab.bestAccuracy).toBe(ba.bestAccuracy);
    expect(ab.attempts).toBe(ba.attempts);
    expect(ab.completedAt).toBe(ba.completedAt);
  });
});

describe('mergeReviewState', () => {
  it('vence o lado com a revisão mais recente', () => {
    const older = reviewState({ lastReviewedAt: 1000, intervalDays: 5 });
    const newer = reviewState({ lastReviewedAt: 9000, intervalDays: 30 });

    expect(mergeReviewState(older, newer).intervalDays).toBe(30);
    expect(mergeReviewState(newer, older).intervalDays).toBe(30);
  });

  it('mantém o estado de memória coerente — não mistura campos', () => {
    const older = reviewState({
      lastReviewedAt: 1000,
      intervalDays: 5,
      stability: 3,
      easeFactor: 2.1,
    });
    const newer = reviewState({
      lastReviewedAt: 9000,
      intervalDays: 30,
      stability: 40,
      easeFactor: 2.6,
    });

    const merged = mergeReviewState(older, newer);

    // Os três vieram do mesmo cálculo: nenhum é o máximo do outro lado.
    expect(merged.intervalDays).toBe(30);
    expect(merged.stability).toBe(40);
    expect(merged.easeFactor).toBe(2.6);
  });

  it('acumula contadores dos dois lados', () => {
    const merged = mergeReviewState(
      reviewState({ lastReviewedAt: 9000, totalReviews: 10, lapses: 2 }),
      reviewState({ lastReviewedAt: 1000, totalReviews: 14, lapses: 5 }),
    );

    expect(merged.totalReviews).toBe(14);
    expect(merged.lapses).toBe(5);
  });

  it('favorito marcado em qualquer aparelho permanece marcado', () => {
    expect(
      mergeReviewState(reviewState({ starred: true }), reviewState({ starred: false })).starred,
    ).toBe(true);
  });

  it('lida com item nunca revisado dos dois lados', () => {
    const merged = mergeReviewState(
      reviewState({ lastReviewedAt: null, state: 'new' }),
      reviewState({ lastReviewedAt: null, state: 'new' }),
    );
    expect(merged.state).toBe('new');
  });
});

describe('mergeStreak', () => {
  it('mantém a maior ofensiva e o maior recorde', () => {
    const merged = mergeStreak(
      streak({ currentStreak: 3, longestStreak: 5 }),
      streak({ currentStreak: 7, longestStreak: 4 }),
    );

    expect(merged.currentStreak).toBe(7);
    expect(merged.longestStreak).toBe(5);
  });

  it('mantém a data de atividade mais recente', () => {
    const merged = mergeStreak(
      streak({ lastActiveDate: '2026-03-10' }),
      streak({ lastActiveDate: '2026-03-14' }),
    );
    expect(merged.lastActiveDate).toBe('2026-03-14');
  });

  it('usa o menor saldo de congelamentos — não dá congelamento de graça', () => {
    const merged = mergeStreak(
      streak({ freezesAvailable: 2 }),
      streak({ freezesAvailable: 0 }),
    );
    expect(merged.freezesAvailable).toBe(0);
  });

  it('une os congelamentos gastos sem duplicar', () => {
    const merged = mergeStreak(
      streak({ freezesUsed: ['2026-03-01', '2026-03-05'] }),
      streak({ freezesUsed: ['2026-03-05', '2026-03-09'] }),
    );

    expect(merged.freezesUsed).toEqual(['2026-03-01', '2026-03-05', '2026-03-09']);
  });

  it('converge independentemente da ordem', () => {
    const a = streak({
      currentStreak: 3,
      longestStreak: 9,
      lastActiveDate: '2026-03-10',
      freezesAvailable: 2,
    });
    const b = streak({
      currentStreak: 7,
      longestStreak: 4,
      lastActiveDate: '2026-03-14',
      freezesAvailable: 1,
    });

    const ab = mergeStreak(a, b);
    const ba = mergeStreak(b, a);

    expect(ab.currentStreak).toBe(ba.currentStreak);
    expect(ab.longestStreak).toBe(ba.longestStreak);
    expect(ab.lastActiveDate).toBe(ba.lastActiveDate);
    expect(ab.freezesAvailable).toBe(ba.freezesAvailable);
    expect(ab.freezesUsed).toEqual(ba.freezesUsed);
  });
});
