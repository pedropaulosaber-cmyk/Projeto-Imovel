/**
 * Testes do plano de estudos adaptativo.
 *
 * A regra que mais importa aqui: o plano precisa **caber no tempo prometido**
 * e **priorizar a dívida de revisão**. As duas coisas juntas são o que impede
 * o abandono depois do terceiro mês.
 */

import {
  blendGoalWeights,
  buildStudyPlan,
  dailyGoalXp,
  projectOutcome,
  resolveStartingLevel,
  weeksToNextLevel,
} from '../plan';
import { createReviewState } from '../srs';
import type { DailyStat, OnboardingAnswers, ReviewState } from '../types';

const NOW = Date.UTC(2026, 2, 10, 9, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

function dueStates(count: number): ReviewState[] {
  return Array.from({ length: count }, (_, i) => ({
    ...createReviewState({
      id: `s${i}`,
      userId: 'u',
      conceptId: `c${i}`,
      language: 'en',
      now: NOW,
    }),
    state: 'review' as const,
    dueAt: NOW - DAY,
    lastReviewedAt: NOW - 5 * DAY,
    stability: 4,
  }));
}

const baseInput = {
  userId: 'u',
  language: 'en' as const,
  date: '2026-03-10',
  level: 'A1' as const,
  goals: ['travel' as const],
  studyDays: [1, 2, 3, 4, 5],
  recentStats: [] as DailyStat[],
  nextLesson: { id: 'l1', title: 'Olá e tchau', estimatedMinutes: 5, xpReward: 25 },
  now: NOW,
};

describe('dailyGoalXp', () => {
  it('cresce com o tempo comprometido', () => {
    expect(dailyGoalXp(5)).toBeLessThan(dailyGoalXp(30));
  });

  it('devolve metas redondas', () => {
    for (const minutes of [5, 10, 15, 20, 30, 60] as const) {
      expect(dailyGoalXp(minutes) % 10).toBe(0);
    }
  });
});

describe('blendGoalWeights', () => {
  it('os pesos somam ~1 para um objetivo isolado', () => {
    const weights = blendGoalWeights(['travel']);
    const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('a média de vários objetivos também soma ~1', () => {
    const weights = blendGoalWeights(['travel', 'exam', 'business']);
    const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('"conversação" prioriza fala; "provas" prioriza leitura e escrita', () => {
    const conversation = blendGoalWeights(['conversation']);
    const exam = blendGoalWeights(['exam']);

    expect(conversation.speaking).toBeGreaterThan(exam.speaking);
    expect(exam.reading + exam.writing).toBeGreaterThan(
      conversation.reading + conversation.writing,
    );
  });

  it('cai num padrão sensato sem objetivos', () => {
    const weights = blendGoalWeights([]);
    expect(Object.values(weights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 5);
  });
});

describe('resolveStartingLevel', () => {
  const answers: OnboardingAnswers = {
    targetLanguage: 'en',
    uiLanguage: 'pt',
    goals: ['travel'],
    selfAssessedLevel: 'zero',
    dailyMinutes: 10,
    studyDays: [1, 2, 3],
    reminderMinute: null,
  };

  it('"do zero" sempre começa em A1', () => {
    expect(resolveStartingLevel(answers)).toBe('A1');
  });

  it('sem teste, respeita o auto-relato', () => {
    expect(resolveStartingLevel({ ...answers, selfAssessedLevel: 'B1' })).toBe('B1');
  });

  it('o teste tem mais peso que o auto-relato', () => {
    // Diz que é C2, mas foi mal no teste: começa bem abaixo.
    const level = resolveStartingLevel({
      ...answers,
      selfAssessedLevel: 'C2',
      placementScore: 0.2,
    });
    expect(['A1', 'A2', 'B1']).toContain(level);
  });

  it('nunca devolve nível fora da escala', () => {
    for (const score of [0, 0.3, 0.5, 0.8, 1]) {
      const level = resolveStartingLevel({
        ...answers,
        selfAssessedLevel: 'B2',
        placementScore: score,
      });
      expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).toContain(level);
    }
  });
});

describe('weeksToNextLevel', () => {
  it('quem estuda mais chega mais rápido', () => {
    expect(weeksToNextLevel('A1', 30, 7)).toBeLessThan(weeksToNextLevel('A1', 5, 2));
  });

  it('níveis avançados demoram mais', () => {
    expect(weeksToNextLevel('C1', 20, 5)).toBeGreaterThan(weeksToNextLevel('A1', 20, 5));
  });

  it('não divide por zero sem dias de estudo', () => {
    expect(Number.isFinite(weeksToNextLevel('A1', 20, 0))).toBe(true);
  });
});

describe('buildStudyPlan', () => {
  it('coloca a revisão vencida em primeiro lugar', () => {
    const plan = buildStudyPlan({
      ...baseInput,
      dailyMinutes: 20,
      reviewStates: dueStates(30),
    });

    expect(plan.blocks[0]?.kind).toBe('review');
  });

  it('no modo Essencial o dia tem no máximo dois blocos', () => {
    const plan = buildStudyPlan({
      ...baseInput,
      dailyMinutes: 60,
      reviewStates: dueStates(30),
      learningMode: 'essential',
    });

    expect(plan.blocks.length).toBeLessThanOrEqual(2);
    // O corte tira os blocos menos prioritários — nunca a dívida de revisão.
    expect(plan.blocks[0]?.kind).toBe('review');
  });

  it('não gera bloco de revisão quando não há dívida', () => {
    const plan = buildStudyPlan({ ...baseInput, dailyMinutes: 20, reviewStates: [] });
    expect(
      plan.blocks.some((block) => block.kind === 'review' && block.route === '/review'),
    ).toBe(false);
  });

  it('o plano cabe no tempo comprometido', () => {
    for (const minutes of [5, 10, 15, 20, 30, 60] as const) {
      const plan = buildStudyPlan({
        ...baseInput,
        dailyMinutes: minutes,
        reviewStates: dueStates(50),
      });

      const total = plan.blocks.reduce((sum, block) => sum + block.estimatedMinutes, 0);
      expect(total).toBeLessThanOrEqual(minutes);
    }
  });

  it('a revisão não engole mais de 60% do dia', () => {
    const plan = buildStudyPlan({
      ...baseInput,
      dailyMinutes: 20,
      reviewStates: dueStates(200),
    });

    const review = plan.blocks.find((block) => block.route === '/review');
    expect(review!.estimatedMinutes).toBeLessThanOrEqual(12);
    // Ainda sobra espaço para conteúdo novo — sensação de avanço preservada.
    expect(plan.blocks.length).toBeGreaterThan(1);
  });

  it('inclui a próxima lição da trilha quando há tempo', () => {
    const plan = buildStudyPlan({ ...baseInput, dailyMinutes: 20, reviewStates: [] });
    expect(plan.blocks.some((block) => block.route === '/lesson/l1')).toBe(true);
  });

  it('funciona sem próxima lição (curso concluído)', () => {
    const plan = buildStudyPlan({
      ...baseInput,
      dailyMinutes: 20,
      reviewStates: [],
      nextLesson: null,
    });
    expect(plan.blocks.length).toBeGreaterThan(0);
  });

  it('devolve os blocos ordenados por prioridade', () => {
    const plan = buildStudyPlan({
      ...baseInput,
      dailyMinutes: 30,
      reviewStates: dueStates(10),
    });

    const priorities = plan.blocks.map((block) => block.priority);
    expect([...priorities].sort((a, b) => b - a)).toEqual(priorities);
  });

  it('sugere fala quando o objetivo valoriza fala e não houve prática', () => {
    const plan = buildStudyPlan({
      ...baseInput,
      goals: ['conversation'],
      dailyMinutes: 30,
      reviewStates: [],
      recentStats: [
        {
          id: 'd1',
          userId: 'u',
          date: '2026-03-09',
          xpEarned: 100,
          minutesStudied: 12,
          lessonsCompleted: 1,
          reviewsCompleted: 10,
          exercisesAttempted: 30,
          exercisesCorrect: 25,
          pronunciationScore: null,
          newWordsLearned: 5,
          goalMet: true,
        },
      ],
    });

    expect(plan.blocks.some((block) => block.kind === 'speaking')).toBe(true);
  });

  it('define a meta de XP do dia a partir do compromisso', () => {
    const plan = buildStudyPlan({ ...baseInput, dailyMinutes: 15, reviewStates: [] });
    expect(plan.dailyGoalXp).toBe(dailyGoalXp(15));
  });
});

describe('projectOutcome', () => {
  const answers: OnboardingAnswers = {
    targetLanguage: 'en',
    uiLanguage: 'pt',
    goals: ['travel'],
    selfAssessedLevel: 'zero',
    dailyMinutes: 15,
    studyDays: [1, 2, 3, 4, 5],
    reminderMinute: null,
  };

  it('projeta mais palavras em 90 dias que em 30', () => {
    const projection = projectOutcome(answers);
    expect(projection.wordsIn90Days).toBeGreaterThan(projection.wordsIn30Days);
  });

  it('quem estuda mais tem projeção maior', () => {
    const light = projectOutcome({ ...answers, dailyMinutes: 5 });
    const heavy = projectOutcome({ ...answers, dailyMinutes: 60 });

    expect(heavy.wordsIn30Days).toBeGreaterThan(light.wordsIn30Days);
    expect(heavy.weeksToNextLevel).toBeLessThan(light.weeksToNextLevel);
  });

  it('mantém a projeção conservadora — nada de promessa impossível', () => {
    // 15 min × 5 dias = 75 min/semana. Prometer 1.000 palavras em 30 dias
    // seria irreal e destruiria a retenção quando não acontecesse.
    const projection = projectOutcome(answers);
    expect(projection.wordsIn30Days).toBeLessThan(600);
    expect(projection.minutesPerWeek).toBe(75);
  });
});
