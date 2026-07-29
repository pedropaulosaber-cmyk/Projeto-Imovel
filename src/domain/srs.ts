/**
 * Lumo — Motor de Repetição Espaçada
 * ===================================
 *
 * Implementação de um SM-2 estendido com os dois conceitos que o FSRS trouxe
 * e que mais impactam retenção na prática:
 *
 *  1. **Estabilidade** — quantos dias a memória sobrevive até cair para ~90%
 *     de chance de recordação. Guardada explicitamente, em vez de inferida do
 *     intervalo. Isso permite calcular retenção prevista a qualquer momento e
 *     mostrar "força da memória" ao usuário.
 *
 *  2. **Dificuldade por item** — cada palavra tem uma dificuldade própria que
 *     é aprendida com o histórico. O SM-2 puro só tem o fator de facilidade,
 *     que reage devagar demais a itens realmente difíceis.
 *
 * Por que não FSRS completo? O FSRS depende de 17 pesos otimizados sobre o
 * histórico agregado de milhões de revisões. Sem essa base de dados, os pesos
 * padrão não superam um SM-2 bem afinado, e o custo é um modelo que não dá
 * para explicar ao usuário nem depurar. A arquitetura aqui deixa a troca
 * pronta: `schedule()` é a única função que precisa mudar.
 *
 * Todas as funções são **puras** — recebem `now` como parâmetro em vez de ler
 * o relógio. Isso torna o agendamento inteiramente testável e determinístico.
 */

import type { LocalDate, ReviewGrade, ReviewState, Timestamp } from './types';

/* ------------------------------------------------------------------ *
 * Constantes de configuração
 * ------------------------------------------------------------------ */

export const SRS_CONFIG = {
  /** Piso do fator de facilidade. Abaixo disso os intervalos não crescem. */
  minEaseFactor: 1.3,
  maxEaseFactor: 2.8,
  initialEaseFactor: 2.5,

  /**
   * Passos de aprendizado, em minutos, antes do item entrar em revisão longa.
   * Dois passos no mesmo dia consolidam o item sem inflar a fila de amanhã.
   */
  learningStepsMinutes: [1, 10] as const,
  /** Passos de reaprendizado após um lapso. */
  relearningStepsMinutes: [10] as const,

  /** Intervalo do primeiro acerto após sair do aprendizado. */
  graduatingIntervalDays: 1,
  /** Intervalo quando o usuário marca "fácil" e pula os passos. */
  easyIntervalDays: 4,

  /** Teto de intervalo. Um ano é suficiente; além disso o item é "dominado". */
  maxIntervalDays: 365,
  /** Intervalo a partir do qual consideramos o item dominado. */
  masteryIntervalDays: 180,

  /** Multiplicador aplicado ao intervalo em caso de lapso. */
  lapseIntervalMultiplier: 0.5,
  /** Penalidade no fator de facilidade a cada lapso. */
  lapseEasePenalty: 0.2,

  /**
   * Aleatoriedade aplicada ao intervalo (±5%).
   * Sem isso, itens aprendidos no mesmo dia voltam sempre juntos e criam
   * picos de revisão que fazem o usuário desistir.
   */
  intervalFuzzRatio: 0.05,

  /** Retenção-alvo usada no cálculo de recordação prevista. */
  targetRetention: 0.9,

  /** Teto de itens novos por dia — protege contra sobrecarga. */
  defaultNewPerDay: 15,
  /** Teto de revisões por dia. */
  defaultReviewsPerDay: 80,
} as const;

/** Peso numérico de cada nota, usado nos ajustes de dificuldade/facilidade. */
const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 0,
  hard: 0.4,
  good: 0.75,
  easy: 1,
};

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Aplica dispersão determinística ao intervalo.
 *
 * A dispersão é derivada do id do item (hash simples) em vez de `Math.random`,
 * para que reagendar o mesmo item duas vezes dê o mesmo resultado — essencial
 * para que dois dispositivos offline convirjam sem conflito.
 */
export function fuzzInterval(intervalDays: number, seed: string): number {
  if (intervalDays < 2) return intervalDays;

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  // `hash` é inteiro com sinal, e o `%` do JavaScript preserva o sinal do
  // dividendo — sem o `Math.abs` o valor normalizado cairia em [-3, 1] e a
  // dispersão chegaria a -15%, encurtando intervalos de forma silenciosa.
  const bucket = Math.abs(hash % 1000) / 1000;
  // Normaliza para [-1, 1].
  const normalized = bucket * 2 - 1;
  const delta = intervalDays * SRS_CONFIG.intervalFuzzRatio * normalized;
  return Math.max(1, intervalDays + delta);
}

/**
 * Probabilidade de recordar o item agora, pela curva de esquecimento
 * exponencial: R = exp(-t / S), com t em dias e S = estabilidade.
 *
 * Usada para (a) ordenar a fila priorizando o que está prestes a ser esquecido
 * e (b) mostrar "força da memória" no vocabulário.
 */
export function predictedRecall(state: ReviewState, now: Timestamp): number {
  if (!state.lastReviewedAt || state.stability <= 0) return 0;
  const elapsedDays = (now - state.lastReviewedAt) / DAY_MS;
  if (elapsedDays <= 0) return 1;
  return clamp(Math.exp(-elapsedDays / state.stability), 0, 1);
}

/**
 * Atualiza a estabilidade da memória.
 *
 * Acertar multiplica a estabilidade por um fator que cresce com a facilidade e
 * encolhe com a dificuldade do item; errar a derruba (mas não zera — parte da
 * memória sobrevive a um lapso, e tratá-la como zero faz o item voltar cedo
 * demais para sempre).
 */
function nextStability(state: ReviewState, grade: ReviewGrade, elapsedDays: number): number {
  const quality = GRADE_QUALITY[grade];

  if (grade === 'again') {
    return Math.max(0.5, state.stability * 0.35);
  }

  // Recordar um item já "esquecido" reforça mais do que recordar um item
  // fresco — é o efeito de espaçamento. Por isso o bônus cresce com o tempo
  // decorrido em relação à estabilidade atual.
  const spacingBonus = state.stability > 0 ? clamp(elapsedDays / state.stability, 0, 2) : 0;
  const difficultyPenalty = 1 - state.difficulty * 0.4;
  const growth = 1 + (1.2 + quality * 1.6) * difficultyPenalty * (0.6 + spacingBonus * 0.4);

  const base = state.stability > 0 ? state.stability : 1;
  return Math.min(SRS_CONFIG.maxIntervalDays, base * growth);
}

/** Dificuldade do item, ajustada suavemente a cada revisão (média móvel). */
function nextDifficulty(current: number, grade: ReviewGrade): number {
  const target = 1 - GRADE_QUALITY[grade];
  // Peso baixo (0.2) para que uma revisão ruim isolada não marque o item para
  // sempre — só um padrão consistente move a dificuldade.
  return clamp(current + (target - current) * 0.2, 0, 1);
}

/** Fator de facilidade no estilo SM-2. */
function nextEaseFactor(current: number, grade: ReviewGrade): number {
  const delta: Record<ReviewGrade, number> = {
    again: -SRS_CONFIG.lapseEasePenalty,
    hard: -0.15,
    good: 0,
    easy: 0.15,
  };
  return clamp(current + delta[grade], SRS_CONFIG.minEaseFactor, SRS_CONFIG.maxEaseFactor);
}

/* ------------------------------------------------------------------ *
 * Criação
 * ------------------------------------------------------------------ */

/** Cria o estado inicial de um conceito nunca estudado. */
export function createReviewState(params: {
  id: string;
  userId: string;
  conceptId: string;
  language: ReviewState['language'];
  /** Dificuldade a priori (0–1), normalmente vinda do rank de frequência. */
  initialDifficulty?: number;
  now: Timestamp;
}): ReviewState {
  return {
    id: params.id,
    userId: params.userId,
    conceptId: params.conceptId,
    language: params.language,
    easeFactor: SRS_CONFIG.initialEaseFactor,
    intervalDays: 0,
    repetitions: 0,
    dueAt: params.now,
    lastReviewedAt: null,
    stability: 0,
    difficulty: clamp(params.initialDifficulty ?? 0.3, 0, 1),
    lapses: 0,
    totalReviews: 0,
    state: 'new',
    starred: false,
  };
}

/* ------------------------------------------------------------------ *
 * Agendamento
 * ------------------------------------------------------------------ */

export type ScheduleOutcome = {
  state: ReviewState;
  /** Intervalo aplicado, em dias (fracionário durante o aprendizado). */
  intervalDays: number;
  /** Verdadeiro quando o item saiu do aprendizado nesta revisão. */
  graduated: boolean;
  /** Verdadeiro quando um item em revisão foi esquecido. */
  lapsed: boolean;
};

/**
 * Calcula o próximo agendamento de um item.
 *
 * Função pura: dado o mesmo estado, nota e `now`, sempre devolve o mesmo
 * resultado — inclusive a dispersão, que é derivada do id.
 */
export function schedule(
  state: ReviewState,
  grade: ReviewGrade,
  now: Timestamp,
): ScheduleOutcome {
  const elapsedDays = state.lastReviewedAt ? (now - state.lastReviewedAt) / DAY_MS : 0;

  const easeFactor = nextEaseFactor(state.easeFactor, grade);
  const difficulty = nextDifficulty(state.difficulty, grade);
  const stability = nextStability(state, grade, elapsedDays);

  const isLearning = state.state === 'new' || state.state === 'learning';
  const isRelearning = state.state === 'relearning';

  let intervalDays: number;
  let nextState: ReviewState['state'];
  let repetitions: number;
  let lapses = state.lapses;
  let graduated = false;
  let lapsed = false;

  if (grade === 'again') {
    // Lapso: volta para reaprendizado, mantendo parte do intervalo conquistado.
    if (!isLearning) {
      lapses += 1;
      lapsed = true;
    }
    repetitions = 0;
    nextState = isLearning ? 'learning' : 'relearning';
    const stepMinutes = isLearning
      ? SRS_CONFIG.learningStepsMinutes[0]!
      : SRS_CONFIG.relearningStepsMinutes[0]!;
    intervalDays = stepMinutes / (24 * 60);
  } else if (isLearning || isRelearning) {
    const steps = isRelearning
      ? SRS_CONFIG.relearningStepsMinutes
      : SRS_CONFIG.learningStepsMinutes;
    const nextStep = state.repetitions;

    if (grade === 'easy' || nextStep >= steps.length) {
      // Graduou: entra no ciclo de revisão de dias.
      graduated = true;
      repetitions = 1;
      nextState = 'review';
      intervalDays =
        grade === 'easy' ? SRS_CONFIG.easyIntervalDays : SRS_CONFIG.graduatingIntervalDays;
      intervalDays = fuzzInterval(intervalDays, state.id);
    } else {
      // Ainda em passos curtos, no mesmo dia.
      repetitions = nextStep + 1;
      nextState = isRelearning ? 'relearning' : 'learning';
      intervalDays = steps[nextStep]! / (24 * 60);
    }
  } else {
    // Item maduro em revisão normal.
    repetitions = state.repetitions + 1;
    const gradeMultiplier: Record<Exclude<ReviewGrade, 'again'>, number> = {
      hard: 1.2,
      good: easeFactor,
      easy: easeFactor * 1.3,
    };
    const base = Math.max(state.intervalDays, 1);
    intervalDays = clamp(base * gradeMultiplier[grade], 1, SRS_CONFIG.maxIntervalDays);
    intervalDays = fuzzInterval(intervalDays, state.id);
    nextState = intervalDays >= SRS_CONFIG.masteryIntervalDays ? 'mastered' : 'review';
  }

  intervalDays = Math.min(intervalDays, SRS_CONFIG.maxIntervalDays);

  return {
    state: {
      ...state,
      easeFactor,
      difficulty,
      stability,
      intervalDays,
      repetitions,
      lapses,
      totalReviews: state.totalReviews + 1,
      lastReviewedAt: now,
      dueAt: now + Math.round(intervalDays * DAY_MS),
      state: nextState,
    },
    intervalDays,
    graduated,
    lapsed,
  };
}

/**
 * Converte uma resposta de exercício em nota de SRS.
 *
 * A grande vantagem do Lumo sobre um app de flashcards puro: o usuário não
 * precisa auto-avaliar. A nota sai do que ele *fez* — se acertou, quanto
 * demorou e se pediu dica. Auto-avaliação é onde a maioria dos usuários erra
 * e onde o SRS silenciosamente para de funcionar.
 *
 * @param correct        Se a resposta foi aceita.
 * @param responseMs     Tempo até responder.
 * @param usedHint       Se revelou a dica.
 * @param expectedMs     Tempo de referência para uma resposta fluente.
 */
export function gradeFromPerformance(
  correct: boolean,
  responseMs: number,
  usedHint: boolean,
  expectedMs = 6000,
): ReviewGrade {
  if (!correct) return 'again';
  if (usedHint) return 'hard';
  // Resposta bem rápida indica recuperação automática, não esforço.
  if (responseMs <= expectedMs * 0.5) return 'easy';
  // Resposta muito lenta indica recuperação com esforço — deve voltar antes.
  if (responseMs >= expectedMs * 1.8) return 'hard';
  return 'good';
}

/* ------------------------------------------------------------------ *
 * Montagem da fila do dia
 * ------------------------------------------------------------------ */

export type QueueOptions = {
  now: Timestamp;
  maxNew: number;
  maxReviews: number;
  /**
   * Intercala itens novos entre as revisões em vez de agrupá-los.
   * Prática intercalada tem retenção comprovadamente maior que prática em
   * bloco, mesmo parecendo mais difícil durante a sessão.
   */
  interleave: boolean;
};

/**
 * Seleciona e ordena os itens da sessão de revisão.
 *
 * Ordem de prioridade dentro das revisões vencidas: menor recordação prevista
 * primeiro. Ou seja, o que está mais perto de ser esquecido é revisado antes —
 * é onde uma revisão rende mais memória por minuto gasto.
 */
export function buildReviewQueue(states: ReviewState[], options: QueueOptions): ReviewState[] {
  const { now, maxNew, maxReviews, interleave } = options;

  const due = states
    .filter((s) => s.state !== 'new' && s.dueAt <= now)
    .sort((a, b) => predictedRecall(a, now) - predictedRecall(b, now))
    .slice(0, maxReviews);

  const fresh = states
    .filter((s) => s.state === 'new')
    // Itens mais fáceis primeiro dá uma sensação inicial de progresso,
    // que é o que sustenta a sessão até o fim.
    .sort((a, b) => a.difficulty - b.difficulty)
    .slice(0, maxNew);

  if (!interleave || fresh.length === 0) {
    return [...due, ...fresh];
  }

  // Distribui os novos uniformemente ao longo das revisões.
  const result: ReviewState[] = [];
  const step = fresh.length > 0 ? Math.max(1, Math.floor(due.length / fresh.length)) : 1;
  let freshIndex = 0;

  due.forEach((item, index) => {
    result.push(item);
    if (freshIndex < fresh.length && (index + 1) % step === 0) {
      result.push(fresh[freshIndex]!);
      freshIndex += 1;
    }
  });

  // Sobras.
  while (freshIndex < fresh.length) {
    result.push(fresh[freshIndex]!);
    freshIndex += 1;
  }

  return result;
}

/** Quantos itens estão vencidos agora. Usado nos badges e notificações. */
export function countDue(states: ReviewState[], now: Timestamp): number {
  return states.filter((s) => s.state !== 'new' && s.dueAt <= now).length;
}

/**
 * Previsão da carga de revisão dos próximos dias.
 *
 * Alimenta o gráfico "sua semana" — mostrar a carga futura reduz o abandono,
 * porque o usuário entende que a fila é finita e planejada, não infinita.
 */
export function forecastLoad(
  states: ReviewState[],
  now: Timestamp,
  days: number,
): { date: LocalDate; count: number }[] {
  const buckets = new Map<LocalDate, number>();

  for (let i = 0; i < days; i += 1) {
    const date = new Date(now + i * DAY_MS);
    buckets.set(toLocalDate(date), 0);
  }

  for (const state of states) {
    if (state.state === 'new') continue;
    const key = toLocalDate(new Date(Math.max(state.dueAt, now)));
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

/** Converte um Date para 'YYYY-MM-DD' no fuso local. */
export function toLocalDate(date: Date): LocalDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Retenção média prevista da coleção — o "índice de saúde" do vocabulário. */
export function averageRetention(states: ReviewState[], now: Timestamp): number {
  const tracked = states.filter((s) => s.state !== 'new' && s.lastReviewedAt !== null);
  if (tracked.length === 0) return 0;
  const sum = tracked.reduce((acc, s) => acc + predictedRecall(s, now), 0);
  return sum / tracked.length;
}

/** Minutos estimados para a sessão de revisão. */
export function estimateReviewMinutes(itemCount: number): number {
  // ~7s por item na média medida em apps de flashcard maduros.
  return Math.max(1, Math.round((itemCount * 7) / 60));
}
