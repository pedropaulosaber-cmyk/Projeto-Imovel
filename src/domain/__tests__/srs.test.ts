/**
 * Testes do motor de repetição espaçada.
 *
 * O SRS é a peça em que um bug é mais caro: um agendamento errado não quebra a
 * tela — ele silenciosamente destrói a memória do usuário ao longo de meses.
 * Por isso o foco aqui é em **invariantes** (o intervalo nunca encolhe ao
 * acertar, um lapso sempre reduz, o mesmo id gera sempre a mesma dispersão),
 * e não apenas em valores pontuais.
 */

import {
  SRS_CONFIG,
  averageRetention,
  buildReviewQueue,
  countDue,
  createReviewState,
  forecastLoad,
  fuzzInterval,
  gradeFromPerformance,
  predictedRecall,
  schedule,
} from '../srs';
import type { ReviewState } from '../types';

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

function makeState(overrides: Partial<ReviewState> = {}): ReviewState {
  return {
    ...createReviewState({
      id: 'state-1',
      userId: 'user-1',
      conceptId: 'concept-1',
      language: 'en',
      now: NOW,
    }),
    ...overrides,
  };
}

describe('createReviewState', () => {
  it('cria um item novo vencido imediatamente', () => {
    const state = makeState();

    expect(state.state).toBe('new');
    expect(state.repetitions).toBe(0);
    expect(state.dueAt).toBe(NOW);
    expect(state.easeFactor).toBe(SRS_CONFIG.initialEaseFactor);
  });

  it('limita a dificuldade inicial ao intervalo 0–1', () => {
    const low = createReviewState({
      id: 'a',
      userId: 'u',
      conceptId: 'c',
      language: 'en',
      initialDifficulty: -5,
      now: NOW,
    });
    const high = createReviewState({
      id: 'b',
      userId: 'u',
      conceptId: 'c',
      language: 'en',
      initialDifficulty: 9,
      now: NOW,
    });

    expect(low.difficulty).toBe(0);
    expect(high.difficulty).toBe(1);
  });
});

describe('schedule — aprendizado', () => {
  it('avança pelos passos curtos sem graduar no primeiro acerto', () => {
    const outcome = schedule(makeState(), 'good', NOW);

    expect(outcome.graduated).toBe(false);
    expect(outcome.state.state).toBe('learning');
    // Ainda dentro do mesmo dia.
    expect(outcome.intervalDays).toBeLessThan(1);
  });

  it('gradua ao completar todos os passos', () => {
    let state = makeState();
    for (let i = 0; i < SRS_CONFIG.learningStepsMinutes.length; i += 1) {
      state = schedule(state, 'good', NOW).state;
    }

    const outcome = schedule(state, 'good', NOW);
    expect(outcome.graduated).toBe(true);
    expect(outcome.state.state).toBe('review');
    expect(outcome.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it('"fácil" pula os passos e gradua na hora', () => {
    const outcome = schedule(makeState(), 'easy', NOW);

    expect(outcome.graduated).toBe(true);
    expect(outcome.state.state).toBe('review');
    expect(outcome.intervalDays).toBeGreaterThan(SRS_CONFIG.graduatingIntervalDays);
  });
});

describe('schedule — revisão madura', () => {
  const mature = (): ReviewState =>
    makeState({
      state: 'review',
      repetitions: 4,
      intervalDays: 10,
      stability: 12,
      lastReviewedAt: NOW - 10 * DAY,
      totalReviews: 4,
    });

  it('aumenta o intervalo ao acertar', () => {
    const outcome = schedule(mature(), 'good', NOW);
    expect(outcome.intervalDays).toBeGreaterThan(10);
    expect(outcome.lapsed).toBe(false);
  });

  it('"fácil" cresce mais que "bom", que cresce mais que "difícil"', () => {
    const hard = schedule(mature(), 'hard', NOW).intervalDays;
    const good = schedule(mature(), 'good', NOW).intervalDays;
    const easy = schedule(mature(), 'easy', NOW).intervalDays;

    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
  });

  it('registra lapso e volta ao reaprendizado ao errar', () => {
    const outcome = schedule(mature(), 'again', NOW);

    expect(outcome.lapsed).toBe(true);
    expect(outcome.state.state).toBe('relearning');
    expect(outcome.state.lapses).toBe(1);
    expect(outcome.state.repetitions).toBe(0);
    // Volta em minutos, não em dias.
    expect(outcome.intervalDays).toBeLessThan(1);
  });

  it('nunca ultrapassa o intervalo máximo', () => {
    const state = makeState({
      state: 'review',
      repetitions: 30,
      intervalDays: SRS_CONFIG.maxIntervalDays,
      stability: 400,
      lastReviewedAt: NOW - 300 * DAY,
    });

    expect(schedule(state, 'easy', NOW).intervalDays).toBeLessThanOrEqual(
      SRS_CONFIG.maxIntervalDays,
    );
  });

  it('marca como dominado quando o intervalo passa do limiar', () => {
    const state = makeState({
      state: 'review',
      repetitions: 10,
      intervalDays: SRS_CONFIG.masteryIntervalDays,
      stability: 200,
      lastReviewedAt: NOW - 180 * DAY,
    });

    expect(schedule(state, 'good', NOW).state.state).toBe('mastered');
  });

  it('o fator de facilidade respeita o piso mesmo após muitos erros', () => {
    let state = mature();
    for (let i = 0; i < 20; i += 1) {
      state = schedule(state, 'again', NOW).state;
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(SRS_CONFIG.minEaseFactor);
  });
});

describe('fuzzInterval', () => {
  it('é determinístico para o mesmo id', () => {
    expect(fuzzInterval(10, 'abc')).toBe(fuzzInterval(10, 'abc'));
  });

  it('difere entre ids distintos', () => {
    // Com dispersão, dois itens agendados no mesmo dia não voltam juntos.
    const values = ['a', 'b', 'c', 'd', 'e'].map((seed) => fuzzInterval(30, seed));
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it('mantém a dispersão dentro de ±5%', () => {
    for (const seed of ['x', 'y', 'zz', 'seed-4']) {
      const value = fuzzInterval(100, seed);
      expect(value).toBeGreaterThanOrEqual(95);
      expect(value).toBeLessThanOrEqual(105);
    }
  });

  it('não altera intervalos curtos', () => {
    expect(fuzzInterval(1, 'qualquer')).toBe(1);
  });
});

describe('predictedRecall', () => {
  it('vale 0 para item nunca revisado', () => {
    expect(predictedRecall(makeState(), NOW)).toBe(0);
  });

  it('decai com o tempo', () => {
    const state = makeState({ stability: 10, lastReviewedAt: NOW - 5 * DAY });
    const recent = predictedRecall(state, NOW);
    const later = predictedRecall(state, NOW + 20 * DAY);

    expect(recent).toBeGreaterThan(later);
    expect(recent).toBeLessThanOrEqual(1);
    expect(later).toBeGreaterThanOrEqual(0);
  });

  it('estabilidade maior significa retenção maior no mesmo prazo', () => {
    const weak = makeState({ stability: 2, lastReviewedAt: NOW - 5 * DAY });
    const strong = makeState({ stability: 60, lastReviewedAt: NOW - 5 * DAY });

    expect(predictedRecall(strong, NOW)).toBeGreaterThan(predictedRecall(weak, NOW));
  });
});

describe('gradeFromPerformance', () => {
  it('erro sempre vira "again"', () => {
    expect(gradeFromPerformance(false, 1000, false)).toBe('again');
    expect(gradeFromPerformance(false, 60_000, true)).toBe('again');
  });

  it('resposta rápida e sem dica vira "easy"', () => {
    expect(gradeFromPerformance(true, 1500, false, 6000)).toBe('easy');
  });

  it('uso de dica rebaixa para "hard"', () => {
    expect(gradeFromPerformance(true, 1500, true, 6000)).toBe('hard');
  });

  it('resposta muito lenta vira "hard"', () => {
    expect(gradeFromPerformance(true, 20_000, false, 6000)).toBe('hard');
  });

  it('resposta em ritmo normal vira "good"', () => {
    expect(gradeFromPerformance(true, 6000, false, 6000)).toBe('good');
  });
});

describe('buildReviewQueue', () => {
  const states: ReviewState[] = [
    makeState({
      id: 'due-1',
      state: 'review',
      dueAt: NOW - DAY,
      stability: 3,
      lastReviewedAt: NOW - 10 * DAY,
    }),
    makeState({
      id: 'due-2',
      state: 'review',
      dueAt: NOW - 2 * DAY,
      stability: 40,
      lastReviewedAt: NOW - 2 * DAY,
    }),
    makeState({ id: 'future', state: 'review', dueAt: NOW + 5 * DAY, lastReviewedAt: NOW }),
    makeState({ id: 'new-1', state: 'new', difficulty: 0.2 }),
    makeState({ id: 'new-2', state: 'new', difficulty: 0.8 }),
  ];

  it('exclui itens ainda não vencidos', () => {
    const queue = buildReviewQueue(states, {
      now: NOW,
      maxNew: 10,
      maxReviews: 10,
      interleave: false,
    });
    expect(queue.map((item) => item.id)).not.toContain('future');
  });

  it('prioriza o item com menor recordação prevista', () => {
    const queue = buildReviewQueue(states, {
      now: NOW,
      maxNew: 0,
      maxReviews: 10,
      interleave: false,
    });
    // 'due-1' tem estabilidade 3 e 10 dias sem revisão: quase esquecido.
    expect(queue[0]?.id).toBe('due-1');
  });

  it('respeita os limites diários', () => {
    const queue = buildReviewQueue(states, {
      now: NOW,
      maxNew: 1,
      maxReviews: 1,
      interleave: false,
    });
    expect(queue).toHaveLength(2);
  });

  it('intercalando, não agrupa todos os itens novos no fim', () => {
    const many = [
      ...Array.from({ length: 6 }, (_, i) =>
        makeState({
          id: `d${i}`,
          state: 'review',
          dueAt: NOW - DAY,
          lastReviewedAt: NOW - DAY,
          stability: 5,
        }),
      ),
      ...Array.from({ length: 3 }, (_, i) => makeState({ id: `n${i}`, state: 'new' })),
    ];

    const queue = buildReviewQueue(many, {
      now: NOW,
      maxNew: 3,
      maxReviews: 6,
      interleave: true,
    });

    expect(queue).toHaveLength(9);
    const firstNewIndex = queue.findIndex((item) => item.state === 'new');
    expect(firstNewIndex).toBeGreaterThan(0);
    expect(firstNewIndex).toBeLessThan(queue.length - 1);
  });

  it('não perde nem duplica itens ao intercalar', () => {
    const many = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeState({
          id: `d${i}`,
          state: 'review',
          dueAt: NOW - DAY,
          lastReviewedAt: NOW - DAY,
        }),
      ),
      ...Array.from({ length: 4 }, (_, i) => makeState({ id: `n${i}`, state: 'new' })),
    ];

    const queue = buildReviewQueue(many, {
      now: NOW,
      maxNew: 4,
      maxReviews: 5,
      interleave: true,
    });

    expect(new Set(queue.map((item) => item.id)).size).toBe(9);
  });
});

describe('countDue / forecastLoad / averageRetention', () => {
  it('conta apenas itens vencidos que já saíram do estado novo', () => {
    const states = [
      makeState({ id: '1', state: 'review', dueAt: NOW - 1 }),
      makeState({ id: '2', state: 'review', dueAt: NOW + DAY }),
      makeState({ id: '3', state: 'new', dueAt: NOW - DAY }),
    ];
    expect(countDue(states, NOW)).toBe(1);
  });

  it('projeta a carga para o número de dias pedido', () => {
    const forecast = forecastLoad(
      [makeState({ id: '1', state: 'review', dueAt: NOW + 2 * DAY })],
      NOW,
      7,
    );
    expect(forecast).toHaveLength(7);
    expect(forecast.reduce((sum, day) => sum + day.count, 0)).toBe(1);
  });

  it('retenção média é 0 quando nada foi estudado', () => {
    expect(averageRetention([makeState()], NOW)).toBe(0);
  });

  it('retenção média fica entre 0 e 1', () => {
    const states = [
      makeState({ id: '1', state: 'review', stability: 10, lastReviewedAt: NOW - DAY }),
      makeState({ id: '2', state: 'review', stability: 2, lastReviewedAt: NOW - 8 * DAY }),
    ];
    const retention = averageRetention(states, NOW);

    expect(retention).toBeGreaterThan(0);
    expect(retention).toBeLessThanOrEqual(1);
  });
});
