/**
 * Testes de gamificação.
 *
 * Foco nas regras que o usuário percebe imediatamente e que geram suporte
 * quando erradas: XP não pode ser "farmável", nível não pode regredir e a
 * ofensiva não pode quebrar por causa de fuso, sincronização ou reprocessamento.
 */

import {
  LEAGUE_CONFIG,
  STREAK_CONFIG,
  XP_CONFIG,
  leagueOutcome,
  levelFromXp,
  levelProgress,
  streakAtRisk,
  updateStreak,
  xpForAttempt,
  xpForLesson,
  xpRequiredForLevel,
} from '../gamification';
import type { ExerciseAttempt, StreakState } from '../types';

function attempt(overrides: Partial<ExerciseAttempt> = {}): ExerciseAttempt {
  return {
    exerciseId: 'ex-1',
    type: 'multiple_choice',
    correct: true,
    score: 1,
    responseMs: 4000,
    usedHint: false,
    answeredAt: 0,
    ...overrides,
  };
}

describe('xpForAttempt', () => {
  it('dá mais XP para exercícios mais difíceis', () => {
    const easy = xpForAttempt(attempt(), 0);
    const hard = xpForAttempt(attempt(), 1);

    expect(hard).toBeGreaterThan(easy);
    expect(hard / easy).toBeCloseTo(XP_CONFIG.maxDifficultyMultiplier, 1);
  });

  it('reduz o XP pela metade quando a dica é usada', () => {
    const clean = xpForAttempt(attempt(), 0.5);
    const hinted = xpForAttempt(attempt({ usedHint: true }), 0.5);

    expect(hinted).toBeLessThan(clean);
  });

  it('ainda concede algum XP ao errar — tentar também ensina', () => {
    const wrong = xpForAttempt(attempt({ correct: false, score: 0 }), 0.5);
    expect(wrong).toBeGreaterThan(0);
  });

  it('errar vale bem menos que acertar', () => {
    const right = xpForAttempt(attempt(), 0.5);
    const wrong = xpForAttempt(attempt({ correct: false, score: 0 }), 0.5);

    expect(wrong).toBeLessThan(right * 0.5);
  });

  it('exercícios de nota contínua rendem proporcionalmente à qualidade', () => {
    const perfect = xpForAttempt(attempt({ type: 'speak', score: 1 }), 0.5);
    const partial = xpForAttempt(attempt({ type: 'speak', score: 0.6 }), 0.5);

    expect(partial).toBeLessThan(perfect);
  });
});

describe('xpForLesson', () => {
  const difficulties = { 'ex-1': 0.5, 'ex-2': 0.5 };

  it('soma bônus de lição perfeita quando não há erros', () => {
    const perfect = xpForLesson({
      attempts: [attempt(), attempt({ exerciseId: 'ex-2' })],
      difficulties,
      lessonXpReward: 25,
      streakDays: 0,
    });

    expect(perfect.breakdown.some((item) => item.label === 'Sem erros')).toBe(true);
  });

  it('não dá bônus de perfeição quando houve erro', () => {
    const imperfect = xpForLesson({
      attempts: [attempt(), attempt({ exerciseId: 'ex-2', correct: false, score: 0 })],
      difficulties,
      lessonXpReward: 25,
      streakDays: 0,
    });

    expect(imperfect.breakdown.some((item) => item.label === 'Sem erros')).toBe(false);
  });

  it('só aplica bônus de ofensiva a partir de 3 dias', () => {
    const base = { attempts: [attempt()], difficulties, lessonXpReward: 25 };

    const noStreak = xpForLesson({ ...base, streakDays: 2 });
    const withStreak = xpForLesson({ ...base, streakDays: 3 });

    expect(noStreak.breakdown.some((item) => item.label.includes('Ofensiva'))).toBe(false);
    expect(withStreak.total).toBeGreaterThan(noStreak.total);
  });

  it('respeita o teto de XP por sessão — trava anti-farm', () => {
    const huge = xpForLesson({
      attempts: Array.from({ length: 500 }, (_, i) => attempt({ exerciseId: `ex-${i}` })),
      difficulties: Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`ex-${i}`, 1])),
      lessonXpReward: 25,
      streakDays: 50,
    });

    expect(huge.total).toBeLessThanOrEqual(XP_CONFIG.sessionCap);
  });
});

describe('níveis', () => {
  it('o nível 1 começa em 0 XP', () => {
    expect(xpRequiredForLevel(1)).toBe(0);
    expect(levelFromXp(0)).toBe(1);
  });

  it('a curva é monotônica crescente', () => {
    for (let level = 1; level < 60; level += 1) {
      expect(xpRequiredForLevel(level + 1)).toBeGreaterThan(xpRequiredForLevel(level));
    }
  });

  it('cada nível custa mais que o anterior', () => {
    for (let level = 2; level < 40; level += 1) {
      const previousCost = xpRequiredForLevel(level) - xpRequiredForLevel(level - 1);
      const cost = xpRequiredForLevel(level + 1) - xpRequiredForLevel(level);
      expect(cost).toBeGreaterThan(previousCost);
    }
  });

  it('levelFromXp é consistente com xpRequiredForLevel', () => {
    for (let level = 1; level < 30; level += 1) {
      expect(levelFromXp(xpRequiredForLevel(level))).toBe(level);
      expect(levelFromXp(xpRequiredForLevel(level + 1) - 1)).toBe(level);
    }
  });

  it('levelProgress devolve razão entre 0 e 1', () => {
    for (const xp of [0, 1, 250, 5_000, 120_000]) {
      const progress = levelProgress(xp);
      expect(progress.ratio).toBeGreaterThanOrEqual(0);
      expect(progress.ratio).toBeLessThanOrEqual(1);
      expect(progress.xpToNextLevel).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('updateStreak', () => {
  const base: StreakState = {
    userId: 'u',
    currentStreak: 5,
    longestStreak: 9,
    lastActiveDate: '2026-03-10',
    freezesAvailable: 1,
    freezesUsed: [],
  };

  it('estende a ofensiva no dia seguinte', () => {
    const outcome = updateStreak(base, '2026-03-11', { isPremium: false });

    expect(outcome.extended).toBe(true);
    expect(outcome.state.currentStreak).toBe(6);
    expect(outcome.broken).toBe(false);
  });

  it('é idempotente no mesmo dia', () => {
    const once = updateStreak(base, '2026-03-10', { isPremium: false });
    expect(once.state.currentStreak).toBe(5);
    expect(once.extended).toBe(false);

    // Reprocessar o mesmo dia (o que a sincronização faz) não pode inflar nada.
    const twice = updateStreak(once.state, '2026-03-10', { isPremium: false });
    expect(twice.state.currentStreak).toBe(5);
  });

  it('gasta um congelamento quando exatamente um dia foi perdido', () => {
    const outcome = updateStreak(base, '2026-03-12', { isPremium: false });

    expect(outcome.freezeUsed).toBe(true);
    expect(outcome.broken).toBe(false);
    expect(outcome.state.currentStreak).toBe(6);
    expect(outcome.state.freezesAvailable).toBe(0);
    expect(outcome.state.freezesUsed).toContain('2026-03-11');
  });

  it('quebra quando falta congelamento', () => {
    const outcome = updateStreak({ ...base, freezesAvailable: 0 }, '2026-03-12', {
      isPremium: false,
    });

    expect(outcome.broken).toBe(true);
    expect(outcome.state.currentStreak).toBe(1);
  });

  it('quebra quando mais de um dia foi perdido, mesmo com congelamento', () => {
    const outcome = updateStreak(base, '2026-03-20', { isPremium: false });

    expect(outcome.broken).toBe(true);
    expect(outcome.state.currentStreak).toBe(1);
    expect(outcome.state.freezesAvailable).toBe(1);
  });

  it('preserva o recorde ao quebrar', () => {
    const outcome = updateStreak({ ...base, freezesAvailable: 0 }, '2026-04-01', {
      isPremium: false,
    });
    expect(outcome.state.longestStreak).toBe(9);
  });

  it('atualiza o recorde ao superá-lo', () => {
    const outcome = updateStreak(
      { ...base, currentStreak: 9, longestStreak: 9 },
      '2026-03-11',
      { isPremium: false },
    );
    expect(outcome.state.longestStreak).toBe(10);
  });

  it('inicia em 1 quando nunca houve atividade', () => {
    const outcome = updateStreak(
      { ...base, currentStreak: 0, longestStreak: 0, lastActiveDate: null },
      '2026-03-11',
      { isPremium: false },
    );
    expect(outcome.state.currentStreak).toBe(1);
  });

  it('ignora datas anteriores à última atividade (relógio atrasado)', () => {
    const outcome = updateStreak(base, '2026-03-01', { isPremium: false });

    expect(outcome.state.currentStreak).toBe(5);
    expect(outcome.broken).toBe(false);
  });

  it('concede congelamento a cada N dias, respeitando o teto do plano', () => {
    const outcome = updateStreak(
      { ...base, currentStreak: STREAK_CONFIG.freezeEarnedEveryDays - 1, freezesAvailable: 0 },
      '2026-03-11',
      { isPremium: false },
    );

    expect(outcome.freezeEarned).toBe(true);
    expect(outcome.state.freezesAvailable).toBe(1);
  });

  it('assinantes acumulam mais congelamentos que o plano gratuito', () => {
    const atFreeCap = {
      ...base,
      currentStreak: STREAK_CONFIG.freezeEarnedEveryDays - 1,
      freezesAvailable: STREAK_CONFIG.maxFreezesFree,
    };

    const free = updateStreak(atFreeCap, '2026-03-11', { isPremium: false });
    const premium = updateStreak(atFreeCap, '2026-03-11', { isPremium: true });

    expect(free.freezeEarned).toBe(false);
    expect(premium.freezeEarned).toBe(true);
  });
});

describe('streakAtRisk', () => {
  const state: StreakState = {
    userId: 'u',
    currentStreak: 4,
    longestStreak: 4,
    lastActiveDate: '2026-03-10',
    freezesAvailable: 1,
    freezesUsed: [],
  };

  it('está em risco no dia seguinte sem estudo', () => {
    expect(streakAtRisk(state, '2026-03-11')).toBe(true);
  });

  it('não está em risco se já estudou hoje', () => {
    expect(streakAtRisk(state, '2026-03-10')).toBe(false);
  });

  it('não está em risco se já foi perdida', () => {
    expect(streakAtRisk(state, '2026-03-15')).toBe(false);
  });

  it('não está em risco sem ofensiva ativa', () => {
    expect(streakAtRisk({ ...state, currentStreak: 0 }, '2026-03-11')).toBe(false);
  });
});

describe('leagueOutcome', () => {
  it('promove quem fica nas primeiras posições', () => {
    const outcome = leagueOutcome(1, 'bronze');
    expect(outcome.result).toBe('promoted');
    expect(outcome.nextTier).toBe('silver');
  });

  it('rebaixa quem fica no fim', () => {
    const outcome = leagueOutcome(LEAGUE_CONFIG.groupSize, 'gold');
    expect(outcome.result).toBe('relegated');
    expect(outcome.nextTier).toBe('silver');
  });

  it('mantém quem fica no meio', () => {
    expect(leagueOutcome(15, 'gold').result).toBe('stayed');
  });

  it('não promove além do topo nem rebaixa abaixo do fundo', () => {
    expect(leagueOutcome(1, 'diamond').result).toBe('stayed');
    expect(leagueOutcome(LEAGUE_CONFIG.groupSize, 'bronze').result).toBe('stayed');
  });
});
