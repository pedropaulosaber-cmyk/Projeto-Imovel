/**
 * Lumo — Gamificação
 * ===================
 *
 * Princípio que guia este módulo: **a gamificação serve ao aprendizado, não o
 * contrário.** Cada mecânica aqui existe porque resolve um problema real de
 * retenção, e nenhuma delas recompensa atalhos que não geram memória.
 *
 * Consequências concretas dessa regra no código abaixo:
 *  - XP é ponderado por dificuldade e por acerto, não por tempo de tela.
 *    Não dá para "farmar" XP repetindo a lição mais fácil.
 *  - A ofensiva perdoa um dia (congelamento). Perder 180 dias por uma viagem
 *    é o maior gerador de abandono definitivo em apps do gênero.
 *  - A liga é semanal e por faixa, para que o usuário compita com pares e não
 *    com quem estuda 4h por dia.
 */

import type {
  Achievement,
  AchievementProgress,
  DailyStat,
  ExerciseAttempt,
  ID,
  LeagueTier,
  LocalDate,
  Quest,
  StreakState,
  Timestamp,
} from './types';

/* ------------------------------------------------------------------ *
 * XP
 * ------------------------------------------------------------------ */

export const XP_CONFIG = {
  /** XP base por exercício correto. */
  perCorrectExercise: 10,
  /** Fração do XP concedida mesmo errando — errar tentando também ensina. */
  incorrectRatio: 0.2,
  /** Bônus por lição sem nenhum erro. */
  perfectLessonBonus: 20,
  /** Bônus por concluir uma lição. */
  lessonCompletionBonus: 15,
  /** XP por item de revisão SRS. */
  perReviewItem: 4,
  /** Multiplicador máximo por dificuldade do exercício. */
  maxDifficultyMultiplier: 1.6,
  /** Multiplicador por bater a meta diária. */
  goalStreakMultiplier: 1.15,
  /** Penalidade por usar dica. */
  hintPenalty: 0.5,
  /** Teto de XP por sessão — trava anti-farm. */
  sessionCap: 600,
} as const;

/**
 * XP de uma tentativa isolada.
 *
 * Exercícios difíceis valem mais, dicas valem menos e errar ainda vale algo.
 * Esse desenho mantém o usuário tentando exercícios acima do seu nível, que é
 * exatamente onde o aprendizado acontece.
 */
export function xpForAttempt(attempt: ExerciseAttempt, difficulty: number): number {
  const difficultyMultiplier =
    1 + Math.min(Math.max(difficulty, 0), 1) * (XP_CONFIG.maxDifficultyMultiplier - 1);

  const base = attempt.correct
    ? XP_CONFIG.perCorrectExercise
    : XP_CONFIG.perCorrectExercise * XP_CONFIG.incorrectRatio;

  const hintMultiplier = attempt.usedHint ? XP_CONFIG.hintPenalty : 1;

  // Em exercícios de nota contínua (fala, escrita) o XP acompanha a qualidade.
  const qualityMultiplier = attempt.correct ? 0.7 + attempt.score * 0.3 : 1;

  return Math.round(base * difficultyMultiplier * hintMultiplier * qualityMultiplier);
}

/** XP total de uma lição concluída, incluindo bônus. */
export function xpForLesson(params: {
  attempts: ExerciseAttempt[];
  difficulties: Record<ID, number>;
  lessonXpReward: number;
  streakDays: number;
}): { total: number; breakdown: { label: string; xp: number }[] } {
  const { attempts, difficulties, lessonXpReward, streakDays } = params;

  const exerciseXp = attempts.reduce(
    (sum, attempt) => sum + xpForAttempt(attempt, difficulties[attempt.exerciseId] ?? 0.3),
    0,
  );

  const breakdown: { label: string; xp: number }[] = [
    { label: 'Exercícios', xp: exerciseXp },
    { label: 'Lição concluída', xp: lessonXpReward + XP_CONFIG.lessonCompletionBonus },
  ];

  const allCorrect = attempts.length > 0 && attempts.every((a) => a.correct);
  if (allCorrect) {
    breakdown.push({ label: 'Sem erros', xp: XP_CONFIG.perfectLessonBonus });
  }

  let total = breakdown.reduce((sum, item) => sum + item.xp, 0);

  // O bônus de ofensiva só entra a partir de 3 dias: recompensa o hábito
  // formado, não a primeira sessão.
  if (streakDays >= 3) {
    const bonus = Math.round(total * (XP_CONFIG.goalStreakMultiplier - 1));
    breakdown.push({ label: `Ofensiva de ${streakDays} dias`, xp: bonus });
    total += bonus;
  }

  return { total: Math.min(total, XP_CONFIG.sessionCap), breakdown };
}

/* ------------------------------------------------------------------ *
 * Níveis
 * ------------------------------------------------------------------ */

/**
 * Curva de nível.
 *
 * Quadrática suave: cada nível custa progressivamente mais, mas nunca a ponto
 * de o progresso parecer parar. XP total até o nível n = 50·n·(n−1)/2 + 100·(n−1).
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  const n = level - 1;
  return Math.round(25 * n * (n - 1) + 100 * n);
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= totalXp && level < 200) {
    level += 1;
  }
  return level;
}

/** Dados prontos para a barra de nível do perfil. */
export function levelProgress(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  ratio: number;
} {
  const level = levelFromXp(totalXp);
  const currentLevelXp = xpRequiredForLevel(level);
  const nextLevelXp = xpRequiredForLevel(level + 1);
  const span = Math.max(1, nextLevelXp - currentLevelXp);
  const xpIntoLevel = totalXp - currentLevelXp;

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpToNextLevel: Math.max(0, nextLevelXp - totalXp),
    ratio: Math.min(1, Math.max(0, xpIntoLevel / span)),
  };
}

/* ------------------------------------------------------------------ *
 * Ofensiva (streak)
 * ------------------------------------------------------------------ */

export const STREAK_CONFIG = {
  /** Congelamentos que o plano gratuito acumula. */
  maxFreezesFree: 2,
  /** Congelamentos do plano premium. */
  maxFreezesPremium: 5,
  /** Dias de ofensiva necessários para ganhar um congelamento. */
  freezeEarnedEveryDays: 10,
} as const;

function dayDifference(from: LocalDate, to: LocalDate): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const fromUtc = Date.UTC(fy ?? 0, (fm ?? 1) - 1, fd ?? 1);
  const toUtc = Date.UTC(ty ?? 0, (tm ?? 1) - 1, td ?? 1);
  return Math.round((toUtc - fromUtc) / (24 * 60 * 60 * 1000));
}

export type StreakOutcome = {
  state: StreakState;
  /** A ofensiva aumentou nesta atualização. */
  extended: boolean;
  /** Um congelamento foi consumido para salvar a ofensiva. */
  freezeUsed: boolean;
  /** A ofensiva foi perdida. */
  broken: boolean;
  /** Um novo congelamento foi conquistado. */
  freezeEarned: boolean;
};

/**
 * Atualiza a ofensiva quando o usuário bate a meta do dia.
 *
 * Regras:
 *  - Mesmo dia: nada muda (idempotente — pode ser chamada várias vezes).
 *  - Dia seguinte: ofensiva +1.
 *  - Um dia pulado com congelamento disponível: gasta o congelamento e mantém.
 *  - Mais de um dia pulado, ou sem congelamento: reinicia em 1.
 *
 * A idempotência importa muito aqui: em offline-first esta função roda de novo
 * quando a sincronização reprocessa o dia.
 */
export function updateStreak(
  state: StreakState,
  today: LocalDate,
  options: { isPremium: boolean },
): StreakOutcome {
  const maxFreezes = options.isPremium
    ? STREAK_CONFIG.maxFreezesPremium
    : STREAK_CONFIG.maxFreezesFree;

  if (state.lastActiveDate === today) {
    return { state, extended: false, freezeUsed: false, broken: false, freezeEarned: false };
  }

  if (state.lastActiveDate === null) {
    return {
      state: {
        ...state,
        currentStreak: 1,
        longestStreak: Math.max(1, state.longestStreak),
        lastActiveDate: today,
      },
      extended: true,
      freezeUsed: false,
      broken: false,
      freezeEarned: false,
    };
  }

  const gap = dayDifference(state.lastActiveDate, today);

  // Data anterior à última atividade (relógio do dispositivo atrasado ou
  // sincronização fora de ordem): ignora em vez de corromper a ofensiva.
  if (gap <= 0) {
    return { state, extended: false, freezeUsed: false, broken: false, freezeEarned: false };
  }

  let currentStreak: number;
  let freezeUsed = false;
  let broken = false;
  let freezesAvailable = state.freezesAvailable;
  const freezesUsed = [...state.freezesUsed];

  if (gap === 1) {
    currentStreak = state.currentStreak + 1;
  } else if (gap === 2 && freezesAvailable > 0) {
    // Exatamente um dia perdido e há congelamento: a ofensiva sobrevive.
    currentStreak = state.currentStreak + 1;
    freezesAvailable -= 1;
    freezeUsed = true;
    const missed = new Date(Date.parse(`${today}T00:00:00Z`) - 24 * 60 * 60 * 1000);
    freezesUsed.push(missed.toISOString().slice(0, 10));
  } else {
    currentStreak = 1;
    broken = true;
  }

  // Conquista um congelamento a cada N dias de ofensiva, respeitando o teto.
  let freezeEarned = false;
  if (
    !broken &&
    currentStreak % STREAK_CONFIG.freezeEarnedEveryDays === 0 &&
    freezesAvailable < maxFreezes
  ) {
    freezesAvailable += 1;
    freezeEarned = true;
  }

  return {
    state: {
      ...state,
      currentStreak,
      longestStreak: Math.max(state.longestStreak, currentStreak),
      lastActiveDate: today,
      freezesAvailable,
      freezesUsed,
    },
    extended: !broken,
    freezeUsed,
    broken,
    freezeEarned,
  };
}

/**
 * A ofensiva está em risco? Verdadeiro quando o usuário ainda não estudou hoje
 * e tinha estudado ontem. É o gatilho da notificação mais eficaz do app.
 */
export function streakAtRisk(state: StreakState, today: LocalDate): boolean {
  if (state.currentStreak === 0 || state.lastActiveDate === null) return false;
  return dayDifference(state.lastActiveDate, today) === 1;
}

/* ------------------------------------------------------------------ *
 * Ligas
 * ------------------------------------------------------------------ */

export const LEAGUE_ORDER: LeagueTier[] = [
  'bronze',
  'silver',
  'gold',
  'sapphire',
  'ruby',
  'emerald',
  'diamond',
];

export const LEAGUE_LABEL: Record<LeagueTier, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  sapphire: 'Safira',
  ruby: 'Rubi',
  emerald: 'Esmeralda',
  diamond: 'Diamante',
};

export const LEAGUE_CONFIG = {
  /** Tamanho do grupo. Pequeno o bastante para o usuário se ver no topo. */
  groupSize: 30,
  /** Quantos sobem de divisão por semana. */
  promotionSlots: 7,
  /** Quantos caem. */
  relegationSlots: 5,
} as const;

export function leagueOutcome(
  rank: number,
  tier: LeagueTier,
): { result: 'promoted' | 'relegated' | 'stayed'; nextTier: LeagueTier } {
  const index = LEAGUE_ORDER.indexOf(tier);

  if (rank <= LEAGUE_CONFIG.promotionSlots && index < LEAGUE_ORDER.length - 1) {
    return { result: 'promoted', nextTier: LEAGUE_ORDER[index + 1]! };
  }
  if (rank > LEAGUE_CONFIG.groupSize - LEAGUE_CONFIG.relegationSlots && index > 0) {
    return { result: 'relegated', nextTier: LEAGUE_ORDER[index - 1]! };
  }
  return { result: 'stayed', nextTier: tier };
}

/* ------------------------------------------------------------------ *
 * Missões
 * ------------------------------------------------------------------ */

/** Modelos de missão. Sorteados diariamente para variar a rotina. */
export const QUEST_TEMPLATES: {
  code: string;
  title: string;
  description: string;
  icon: string;
  period: 'daily' | 'weekly';
  target: number;
  xpReward: number;
  coinReward: number;
  metric: keyof DailyStat | 'perfect_lessons' | 'speaking_exercises';
}[] = [
  {
    code: 'daily_xp',
    title: 'Ganhe 50 XP',
    description: 'Some 50 XP hoje em qualquer atividade.',
    icon: 'flash',
    period: 'daily',
    target: 50,
    xpReward: 20,
    coinReward: 10,
    metric: 'xpEarned',
  },
  {
    code: 'daily_reviews',
    title: 'Revise 20 cartões',
    description: 'Mantenha a memória em dia com 20 revisões.',
    icon: 'repeat',
    period: 'daily',
    target: 20,
    xpReward: 25,
    coinReward: 10,
    metric: 'reviewsCompleted',
  },
  {
    code: 'daily_speaking',
    title: 'Fale 5 frases',
    description: 'Pratique pronúncia em 5 exercícios de fala.',
    icon: 'mic',
    period: 'daily',
    target: 5,
    xpReward: 30,
    coinReward: 15,
    metric: 'speaking_exercises',
  },
  {
    code: 'daily_accuracy',
    title: 'Acerte 15 exercícios',
    description: 'Some 15 respostas corretas hoje.',
    icon: 'checkmark-done',
    period: 'daily',
    target: 15,
    xpReward: 20,
    coinReward: 10,
    metric: 'exercisesCorrect',
  },
  {
    code: 'weekly_streak',
    title: 'Estude 5 dias',
    description: 'Complete a meta diária em 5 dias desta semana.',
    icon: 'flame',
    period: 'weekly',
    target: 5,
    xpReward: 150,
    coinReward: 60,
    metric: 'goalMet',
  },
  {
    code: 'weekly_words',
    title: 'Aprenda 30 palavras',
    description: 'Adicione 30 palavras novas ao seu vocabulário.',
    icon: 'book',
    period: 'weekly',
    target: 30,
    xpReward: 200,
    coinReward: 80,
    metric: 'newWordsLearned',
  },
];

/** Progresso de uma missão a partir das estatísticas do período. */
export function questProgress(quest: Quest, stats: DailyStat[]): number {
  const template = QUEST_TEMPLATES.find((t) => t.code === quest.code);
  if (!template) return quest.progress;

  if (template.metric === 'goalMet') {
    return stats.filter((s) => s.goalMet).length;
  }
  if (template.metric === 'speaking_exercises' || template.metric === 'perfect_lessons') {
    // Métricas que não vivem em DailyStat são acumuladas pelo chamador.
    return quest.progress;
  }

  const key = template.metric;
  return stats.reduce((sum, stat) => {
    const value = stat[key];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

/* ------------------------------------------------------------------ *
 * Conquistas
 * ------------------------------------------------------------------ */

/** Catálogo de conquistas. Códigos são estáveis; títulos podem ser traduzidos. */
export const ACHIEVEMENTS: Omit<Achievement, 'id'>[] = [
  {
    code: 'streak_3',
    title: 'Primeiros passos',
    description: '3 dias seguidos de estudo.',
    icon: 'flame-outline',
    tier: 'bronze',
    target: 3,
    metric: 'streak_days',
    coinReward: 20,
  },
  {
    code: 'streak_7',
    title: 'Semana cheia',
    description: '7 dias seguidos de estudo.',
    icon: 'flame',
    tier: 'bronze',
    target: 7,
    metric: 'streak_days',
    coinReward: 50,
  },
  {
    code: 'streak_30',
    title: 'Hábito formado',
    description: '30 dias seguidos de estudo.',
    icon: 'flame',
    tier: 'silver',
    target: 30,
    metric: 'streak_days',
    coinReward: 150,
  },
  {
    code: 'streak_100',
    title: 'Inabalável',
    description: '100 dias seguidos de estudo.',
    icon: 'flame',
    tier: 'gold',
    target: 100,
    metric: 'streak_days',
    coinReward: 500,
  },
  {
    code: 'streak_365',
    title: 'Um ano de luz',
    description: '365 dias seguidos de estudo.',
    icon: 'trophy',
    tier: 'platinum',
    target: 365,
    metric: 'streak_days',
    coinReward: 2000,
  },

  {
    code: 'xp_1000',
    title: 'Mil pontos',
    description: 'Acumule 1.000 XP.',
    icon: 'flash-outline',
    tier: 'bronze',
    target: 1000,
    metric: 'total_xp',
    coinReward: 30,
  },
  {
    code: 'xp_10000',
    title: 'Dez mil',
    description: 'Acumule 10.000 XP.',
    icon: 'flash',
    tier: 'silver',
    target: 10000,
    metric: 'total_xp',
    coinReward: 200,
  },
  {
    code: 'xp_50000',
    title: 'Maratonista',
    description: 'Acumule 50.000 XP.',
    icon: 'flash',
    tier: 'gold',
    target: 50000,
    metric: 'total_xp',
    coinReward: 800,
  },

  {
    code: 'words_100',
    title: 'Cem palavras',
    description: 'Domine 100 palavras.',
    icon: 'book-outline',
    tier: 'bronze',
    target: 100,
    metric: 'words_mastered',
    coinReward: 50,
  },
  {
    code: 'words_1000',
    title: 'Vocabulário sólido',
    description: 'Domine 1.000 palavras.',
    icon: 'book',
    tier: 'gold',
    target: 1000,
    metric: 'words_mastered',
    coinReward: 600,
  },
  {
    code: 'words_3000',
    title: 'Fluência funcional',
    description: 'Domine 3.000 palavras — o suficiente para 95% da fala cotidiana.',
    icon: 'library',
    tier: 'platinum',
    target: 3000,
    metric: 'words_mastered',
    coinReward: 1500,
  },

  {
    code: 'perfect_10',
    title: 'Precisão cirúrgica',
    description: '10 lições sem nenhum erro.',
    icon: 'checkmark-done-circle',
    tier: 'silver',
    target: 10,
    metric: 'perfect_lessons',
    coinReward: 120,
  },
  {
    code: 'speak_60',
    title: 'Voz ativa',
    description: '60 minutos de prática de fala.',
    icon: 'mic',
    tier: 'silver',
    target: 60,
    metric: 'speaking_minutes',
    coinReward: 150,
  },
  {
    code: 'reviews_1000',
    title: 'Memória de elefante',
    description: '1.000 revisões concluídas.',
    icon: 'repeat',
    tier: 'gold',
    target: 1000,
    metric: 'reviews_completed',
    coinReward: 400,
  },
  {
    code: 'early_10',
    title: 'Madrugador',
    description: '10 sessões antes das 8h.',
    icon: 'sunny',
    tier: 'bronze',
    target: 10,
    metric: 'early_sessions',
    coinReward: 60,
  },
  {
    code: 'night_10',
    title: 'Coruja',
    description: '10 sessões depois das 22h.',
    icon: 'moon',
    tier: 'bronze',
    target: 10,
    metric: 'night_sessions',
    coinReward: 60,
  },
];

/** Avalia todas as conquistas contra as métricas atuais. */
export function evaluateAchievements(
  catalog: Achievement[],
  progressRecords: AchievementProgress[],
  metrics: Record<Achievement['metric'], number>,
  now: Timestamp,
): { updated: AchievementProgress[]; newlyUnlocked: Achievement[] } {
  const byAchievement = new Map(progressRecords.map((p) => [p.achievementId, p]));
  const updated: AchievementProgress[] = [];
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of catalog) {
    const value = metrics[achievement.metric] ?? 0;
    const existing = byAchievement.get(achievement.id);

    // Já desbloqueada: não reprocessa (mantém a data original de desbloqueio).
    if (existing?.unlockedAt) {
      updated.push(existing);
      continue;
    }

    const unlocked = value >= achievement.target;
    const record: AchievementProgress = {
      id: existing?.id ?? `${achievement.id}-progress`,
      userId: existing?.userId ?? '',
      achievementId: achievement.id,
      progress: Math.min(value, achievement.target),
      unlockedAt: unlocked ? now : null,
      seen: existing?.seen ?? false,
    };

    if (unlocked) newlyUnlocked.push(achievement);
    updated.push(record);
  }

  return { updated, newlyUnlocked };
}

/* ------------------------------------------------------------------ *
 * Loja
 * ------------------------------------------------------------------ */

export type ShopItem = {
  code: string;
  title: string;
  description: string;
  icon: string;
  price: number;
  category: 'utility' | 'cosmetic' | 'boost';
  /** Só aparece para assinantes. */
  premiumOnly?: boolean;
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    code: 'streak_freeze',
    title: 'Congelamento de ofensiva',
    description: 'Protege sua ofensiva por um dia perdido.',
    icon: 'snow',
    price: 200,
    category: 'utility',
  },
  {
    code: 'xp_boost_2x',
    title: 'Impulso 2x XP',
    description: 'Dobra o XP ganho por 15 minutos.',
    icon: 'rocket',
    price: 300,
    category: 'boost',
  },
  {
    code: 'heart_refill',
    title: 'Recarga de vidas',
    description: 'Restaura todas as vidas imediatamente.',
    icon: 'heart',
    price: 150,
    category: 'utility',
  },
  {
    code: 'avatar_pack_travel',
    title: 'Avatares — Viagem',
    description: 'Pacote com 12 avatares temáticos.',
    icon: 'airplane',
    price: 500,
    category: 'cosmetic',
  },
  {
    code: 'theme_midnight',
    title: 'Tema Meia-noite',
    description: 'Tema escuro exclusivo com acentos violeta.',
    icon: 'moon',
    price: 800,
    category: 'cosmetic',
    premiumOnly: true,
  },
];
