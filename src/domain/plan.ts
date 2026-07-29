/**
 * Lumo — Plano de estudos adaptativo
 * ===================================
 *
 * Traduz as respostas do onboarding + o desempenho recente em um plano
 * concreto para *hoje*. Não é um cronograma estático: roda a cada abertura do
 * app e reordena os blocos conforme a fila de SRS, o tempo disponível e as
 * dificuldades detectadas.
 *
 * Duas decisões que diferenciam o Lumo:
 *
 *  1. **Revisão vencida sempre vem primeiro.** Conteúdo novo empilhado sobre
 *     memória que está evaporando é a razão nº 1 de estagnação depois de 3
 *     meses de uso. Se há dívida de revisão, o plano paga a dívida antes.
 *
 *  2. **O plano cabe no tempo declarado.** Se o usuário disse 10 minutos, o
 *     plano tem ~10 minutos. Planos que estouram o compromisso são abandonados
 *     inteiros, não parcialmente.
 */

import { MAX_PLAN_BLOCKS } from './learning-mode';
import { countDue, estimateReviewMinutes } from './srs';
import type {
  CefrLevel,
  DailyCommitment,
  DailyStat,
  LanguageCode,
  LearningGoal,
  LearningMode,
  LocalDate,
  OnboardingAnswers,
  PlanBlock,
  ReviewState,
  StudyPlan,
  Timestamp,
} from './types';
import { CEFR_LEVELS } from './types';

/* ------------------------------------------------------------------ *
 * Metas
 * ------------------------------------------------------------------ */

/**
 * XP-alvo por minuto comprometido.
 *
 * Calibrado para que um usuário focado bata a meta exatamente no tempo que
 * prometeu. Meta fácil demais não gera hábito; difícil demais gera culpa e
 * desinstalação.
 */
const XP_PER_MINUTE = 12;

export function dailyGoalXp(minutes: DailyCommitment): number {
  // Arredonda para múltiplos de 10 — metas "redondas" são mais motivadoras.
  return Math.round((minutes * XP_PER_MINUTE) / 10) * 10;
}

/** Rótulo humano do compromisso diário. */
export const COMMITMENT_LABEL: Record<DailyCommitment, string> = {
  5: 'Casual · 5 min',
  10: 'Leve · 10 min',
  15: 'Regular · 15 min',
  20: 'Sério · 20 min',
  30: 'Intenso · 30 min',
  60: 'Imersivo · 1 hora',
};

/* ------------------------------------------------------------------ *
 * Objetivos → ênfase de conteúdo
 * ------------------------------------------------------------------ */

/**
 * Peso de cada habilidade por objetivo declarado.
 *
 * Isto é o que faz o onboarding valer alguma coisa: quem escolhe "viajar"
 * recebe mais escuta e fala funcional; quem escolhe "provas" recebe mais
 * leitura e escrita. A soma de cada linha é 1.
 */
export const GOAL_SKILL_WEIGHTS: Record<
  LearningGoal,
  { speaking: number; listening: number; reading: number; writing: number; vocabulary: number }
> = {
  travel: { speaking: 0.3, listening: 0.3, reading: 0.1, writing: 0.05, vocabulary: 0.25 },
  work: { speaking: 0.25, listening: 0.2, reading: 0.2, writing: 0.2, vocabulary: 0.15 },
  exchange: { speaking: 0.3, listening: 0.25, reading: 0.15, writing: 0.1, vocabulary: 0.2 },
  conversation: {
    speaking: 0.4,
    listening: 0.3,
    reading: 0.05,
    writing: 0.05,
    vocabulary: 0.2,
  },
  exam: { speaking: 0.1, listening: 0.2, reading: 0.3, writing: 0.25, vocabulary: 0.15 },
  business: { speaking: 0.25, listening: 0.2, reading: 0.15, writing: 0.25, vocabulary: 0.15 },
  culture: { speaking: 0.15, listening: 0.3, reading: 0.3, writing: 0.05, vocabulary: 0.2 },
};

export const GOAL_LABEL: Record<
  LearningGoal,
  { title: string; description: string; icon: string }
> = {
  travel: {
    title: 'Viajar',
    description: 'Se virar em aeroporto, hotel, restaurante e rua.',
    icon: 'airplane',
  },
  work: {
    title: 'Trabalho',
    description: 'Reuniões, e-mails e o vocabulário da sua área.',
    icon: 'briefcase',
  },
  exchange: {
    title: 'Intercâmbio',
    description: 'Viver e estudar no exterior com autonomia.',
    icon: 'school',
  },
  conversation: {
    title: 'Conversação',
    description: 'Falar sem travar sobre o dia a dia.',
    icon: 'chatbubbles',
  },
  exam: {
    title: 'Provas',
    description: 'TOEFL, IELTS, DELE, DELF e vestibulares.',
    icon: 'document-text',
  },
  business: {
    title: 'Negócios',
    description: 'Negociar, apresentar e fechar acordos.',
    icon: 'trending-up',
  },
  culture: {
    title: 'Cultura',
    description: 'Filmes, música, livros e notícias sem legenda.',
    icon: 'film',
  },
};

/** Média ponderada das habilidades quando o usuário escolhe vários objetivos. */
export function blendGoalWeights(goals: LearningGoal[]) {
  const base = { speaking: 0, listening: 0, reading: 0, writing: 0, vocabulary: 0 };
  if (goals.length === 0) return GOAL_SKILL_WEIGHTS.conversation;

  for (const goal of goals) {
    const weights = GOAL_SKILL_WEIGHTS[goal];
    base.speaking += weights.speaking;
    base.listening += weights.listening;
    base.reading += weights.reading;
    base.writing += weights.writing;
    base.vocabulary += weights.vocabulary;
  }

  const count = goals.length;
  return {
    speaking: base.speaking / count,
    listening: base.listening / count,
    reading: base.reading / count,
    writing: base.writing / count,
    vocabulary: base.vocabulary / count,
  };
}

/* ------------------------------------------------------------------ *
 * Nivelamento
 * ------------------------------------------------------------------ */

/**
 * Converte o nível declarado + a pontuação do teste rápido em um nível CEFR.
 *
 * O auto-relato sozinho é notoriamente impreciso (as pessoas se subestimam ou
 * se superestimam em cheio), por isso o teste tem peso maior quando existe.
 */
export function resolveStartingLevel(answers: OnboardingAnswers): CefrLevel {
  if (answers.selfAssessedLevel === 'zero') return 'A1';

  const declared = answers.selfAssessedLevel;

  if (answers.placementScore === undefined) return declared;

  // Pontuação 0–1 mapeada na escala CEFR.
  const scoreLevel: CefrLevel =
    answers.placementScore >= 0.9
      ? 'C1'
      : answers.placementScore >= 0.75
        ? 'B2'
        : answers.placementScore >= 0.6
          ? 'B1'
          : answers.placementScore >= 0.4
            ? 'A2'
            : 'A1';

  const declaredIndex = CEFR_LEVELS.indexOf(declared);
  const scoreIndex = CEFR_LEVELS.indexOf(scoreLevel);

  // Peso 0.7 no teste, 0.3 no auto-relato, arredondando para baixo.
  // Começar um degrau abaixo é recuperável em uma sessão; começar acima
  // frustra e gera abandono.
  const blended = Math.floor(scoreIndex * 0.7 + declaredIndex * 0.3);
  return CEFR_LEVELS[Math.max(0, Math.min(CEFR_LEVELS.length - 1, blended))]!;
}

/**
 * Estimativa de semanas para o próximo nível CEFR.
 *
 * Baseada nas horas guiadas de referência do Conselho da Europa por nível
 * (~100h de A1 a A2, crescendo depois), ajustadas pelo ritmo real do usuário.
 * É uma estimativa honesta e recalculada — não uma promessa de marketing.
 */
const HOURS_TO_NEXT_LEVEL: Record<CefrLevel, number> = {
  A1: 80,
  A2: 100,
  B1: 150,
  B2: 200,
  C1: 250,
  C2: 300,
};

export function weeksToNextLevel(
  level: CefrLevel,
  dailyMinutes: number,
  studyDaysPerWeek: number,
): number {
  const hoursNeeded = HOURS_TO_NEXT_LEVEL[level];
  const weeklyHours = (dailyMinutes * Math.max(1, studyDaysPerWeek)) / 60;
  if (weeklyHours <= 0) return 999;
  return Math.ceil(hoursNeeded / weeklyHours);
}

/* ------------------------------------------------------------------ *
 * Geração do plano diário
 * ------------------------------------------------------------------ */

export type PlanInput = {
  userId: string;
  language: LanguageCode;
  date: LocalDate;
  level: CefrLevel;
  goals: LearningGoal[];
  dailyMinutes: DailyCommitment;
  studyDays: number[];
  /** Estados de SRS do idioma, para dimensionar a revisão. */
  reviewStates: ReviewState[];
  /** Estatísticas recentes, usadas para detectar habilidades negligenciadas. */
  recentStats: DailyStat[];
  /** Título da próxima lição da trilha, se houver. */
  nextLesson: { id: string; title: string; estimatedMinutes: number; xpReward: number } | null;
  /** Modo de aprendizado. Ausente equivale a `complete` (compatibilidade). */
  learningMode?: LearningMode;
  now: Timestamp;
};

/**
 * Monta o plano do dia.
 *
 * O algoritmo é intencionalmente simples e legível — um plano de estudo que
 * ninguém consegue explicar é um plano em que ninguém confia. A adaptação vem
 * da priorização, não de uma caixa-preta.
 */
export function buildStudyPlan(input: PlanInput): StudyPlan {
  const {
    userId,
    language,
    date,
    level,
    goals,
    dailyMinutes,
    studyDays,
    reviewStates,
    recentStats,
    nextLesson,
    learningMode = 'complete',
    now,
  } = input;

  const goalXp = dailyGoalXp(dailyMinutes);
  const weights = blendGoalWeights(goals);
  const blocks: PlanBlock[] = [];

  let remainingMinutes = dailyMinutes;

  /* 1. Dívida de revisão — prioridade máxima e absoluta. */
  const dueCount = countDue(reviewStates, now);
  if (dueCount > 0) {
    const reviewMinutes = Math.min(
      estimateReviewMinutes(dueCount),
      // A revisão nunca toma mais que 60% do dia: precisa sobrar espaço para
      // conteúdo novo, ou o usuário sente que parou de avançar.
      Math.max(2, Math.round(dailyMinutes * 0.6)),
    );
    blocks.push({
      kind: 'review',
      title: `Revisar ${dueCount} ${dueCount === 1 ? 'item' : 'itens'}`,
      description:
        dueCount > 40
          ? 'Sua fila acumulou. Vamos limpar o essencial hoje.'
          : 'Memórias prestes a enfraquecer. Melhor momento para revisar.',
      icon: 'repeat',
      estimatedMinutes: reviewMinutes,
      xpReward: dueCount * 4,
      route: '/review',
      priority: 1,
    });
    remainingMinutes -= reviewMinutes;
  }

  /* 2. Lição da trilha — o avanço propriamente dito. */
  if (nextLesson && remainingMinutes >= 3) {
    const lessonMinutes = Math.min(nextLesson.estimatedMinutes, remainingMinutes);
    blocks.push({
      kind: 'lesson',
      title: nextLesson.title,
      description: 'Próxima lição da sua trilha.',
      icon: 'play-circle',
      estimatedMinutes: lessonMinutes,
      xpReward: nextLesson.xpReward,
      route: `/lesson/${nextLesson.id}`,
      priority: 0.9,
    });
    remainingMinutes -= lessonMinutes;
  }

  /* 3. Habilidade negligenciada, escolhida pelos pesos do objetivo. */
  if (remainingMinutes >= 3) {
    const neglected = findNeglectedSkill(weights, recentStats);
    const skillBlock = SKILL_BLOCKS[neglected];
    const minutes = Math.min(skillBlock.minutes, remainingMinutes);
    blocks.push({
      ...skillBlock.block,
      estimatedMinutes: minutes,
      priority: 0.7,
    });
    remainingMinutes -= minutes;
  }

  /* 4. Conversa com o tutor — sempre que sobrar tempo e o objetivo pedir fala. */
  if (remainingMinutes >= 4 && weights.speaking >= 0.2) {
    blocks.push({
      kind: 'speaking',
      title: 'Conversa com o tutor',
      description: 'Cinco minutos de conversa livre sobre um tema do seu nível.',
      icon: 'chatbubble-ellipses',
      estimatedMinutes: Math.min(5, remainingMinutes),
      xpReward: 40,
      route: '/(tabs)/tutor',
      priority: 0.6,
    });
  }

  return {
    userId,
    language,
    date,
    dailyGoalXp: goalXp,
    targetMinutes: dailyMinutes,
    // No Essencial o plano é truncado depois da ordenação por prioridade, não
    // antes: o corte tira os blocos menos importantes, nunca a revisão vencida.
    // Uma tela com dois cards é o ponto do modo — três já viram uma lista.
    blocks: blocks
      .sort((a, b) => b.priority - a.priority)
      .slice(0, MAX_PLAN_BLOCKS[learningMode]),
    weeksToNextLevel: weeksToNextLevel(level, dailyMinutes, studyDays.length || 5),
  };
}

type SkillKey = 'speaking' | 'listening' | 'reading' | 'writing' | 'vocabulary';

const SKILL_BLOCKS: Record<
  SkillKey,
  { minutes: number; block: Omit<PlanBlock, 'estimatedMinutes' | 'priority'> }
> = {
  speaking: {
    minutes: 5,
    block: {
      kind: 'speaking',
      title: 'Treino de pronúncia',
      description: 'Shadowing de frases do seu nível com nota de pronúncia.',
      icon: 'mic',
      xpReward: 40,
      route: '/practice/speaking',
    },
  },
  listening: {
    minutes: 6,
    block: {
      kind: 'listening',
      title: 'Escuta ativa',
      description: 'Um diálogo curto com velocidade ajustável.',
      icon: 'headset',
      xpReward: 35,
      route: '/practice/listening',
    },
  },
  reading: {
    minutes: 7,
    block: {
      kind: 'reading',
      title: 'Leitura do dia',
      description: 'Um texto no seu nível com tradução ao toque.',
      icon: 'book',
      xpReward: 30,
      route: '/practice/reading',
    },
  },
  writing: {
    minutes: 8,
    block: {
      kind: 'writing',
      title: 'Escrita guiada',
      description: 'Escreva um parágrafo e receba correção detalhada.',
      icon: 'create',
      xpReward: 50,
      route: '/practice/writing',
    },
  },
  vocabulary: {
    minutes: 5,
    block: {
      kind: 'review',
      title: 'Palavras novas',
      description: 'Aprenda 5 palavras de alta frequência.',
      icon: 'sparkles',
      xpReward: 25,
      route: '/practice/vocabulary',
    },
  },
};

/**
 * Encontra a habilidade mais negligenciada em relação ao peso do objetivo.
 *
 * Compara o quanto *deveria* ter sido praticado com o quanto foi, e devolve a
 * maior lacuna. É o que impede o padrão clássico de só fazer múltipla escolha
 * e nunca abrir a boca.
 */
function findNeglectedSkill(
  weights: Record<SkillKey, number>,
  recentStats: DailyStat[],
): SkillKey {
  // Sem histórico, segue puramente o objetivo declarado.
  if (recentStats.length === 0) {
    return (Object.keys(weights) as SkillKey[]).reduce((best, key) =>
      weights[key] > weights[best] ? key : best,
    );
  }

  const totalExercises = recentStats.reduce((sum, s) => sum + s.exercisesAttempted, 0);
  const spokeRecently = recentStats.some((s) => s.pronunciationScore !== null);

  // Sinal mais forte que temos hoje sem instrumentar cada tipo de exercício:
  // se não houve fala nenhuma e o objetivo valoriza fala, essa é a lacuna.
  if (!spokeRecently && weights.speaking >= 0.2) return 'speaking';
  if (totalExercises < 10) return 'vocabulary';

  return (Object.keys(weights) as SkillKey[]).reduce((best, key) =>
    weights[key] > weights[best] ? key : best,
  );
}

/* ------------------------------------------------------------------ *
 * Resumo do plano para o onboarding
 * ------------------------------------------------------------------ */

/** Projeção mostrada na última tela do onboarding, para ancorar expectativa. */
export function projectOutcome(answers: OnboardingAnswers): {
  wordsIn30Days: number;
  wordsIn90Days: number;
  weeksToNextLevel: number;
  minutesPerWeek: number;
} {
  const daysPerWeek = answers.studyDays.length || 5;
  const minutesPerWeek = answers.dailyMinutes * daysPerWeek;

  // ~1.4 palavras retidas por minuto efetivo de estudo com SRS. Conservador
  // de propósito: a projeção precisa ser batível, não impressionante.
  const wordsPerWeek = Math.round(minutesPerWeek * 1.4);
  const level = resolveStartingLevel(answers);

  return {
    wordsIn30Days: Math.round((wordsPerWeek * 30) / 7),
    wordsIn90Days: Math.round((wordsPerWeek * 90) / 7),
    weeksToNextLevel: weeksToNextLevel(level, answers.dailyMinutes, daysPerWeek),
    minutesPerWeek,
  };
}
