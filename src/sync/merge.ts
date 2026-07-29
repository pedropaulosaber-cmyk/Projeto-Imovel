/**
 * Lumo — Políticas de resolução de conflito
 * ==========================================
 *
 * Funções **puras**, sem nenhuma dependência de infraestrutura. Essa separação
 * é deliberada: as regras de merge são a parte da sincronização em que um bug
 * apaga estudo real do usuário, e elas precisam ser testáveis em isolamento,
 * sem banco, sem rede e sem React Native.
 *
 * ## As três políticas
 *
 * Não existe uma regra única que sirva para todos os dados, e fingir que existe
 * é onde a maioria dos apps offline erra:
 *
 *  - **`lww` (last-write-wins)** — perfil, matrícula, configurações. São
 *    intenções declarativas do usuário; a mais recente ganha e ninguém sente
 *    falta da anterior.
 *
 *  - **`additive`** — estatísticas diárias, XP, contadores. São acúmulos, não
 *    estados pontuais. Sobrescrever aqui apagaria estudo que o usuário fez de
 *    verdade, que é o pior erro possível neste app.
 *
 *  - **`monotonic`** — progresso de lição, SRS, ofensiva, conquistas. Só podem
 *    avançar. O merge escolhe o estado *mais avançado* dos dois lados, o que
 *    torna a sincronização convergente sem coordenação central: qualquer ordem
 *    de aplicação chega ao mesmo resultado.
 *
 * As três juntas eliminam a necessidade de um resolvedor manual — o usuário
 * nunca vê uma tela de "qual versão você quer manter?".
 */

import type { DailyStat, LessonProgress, ReviewState, StreakState } from '@/domain/types';

export type MergePolicy = 'lww' | 'additive' | 'monotonic';

export const ENTITY_POLICY: Record<string, MergePolicy> = {
  profiles: 'lww',
  enrollments: 'lww',
  settings: 'lww',
  daily_stats: 'additive',
  wallets: 'additive',
  sessions: 'lww',
  lesson_progress: 'monotonic',
  review_states: 'monotonic',
  streaks: 'monotonic',
  achievement_progress: 'monotonic',
  quests: 'monotonic',
};

/** Merge de estatística diária: soma as contribuições dos dois lados. */
export function mergeDailyStat(local: DailyStat, remote: DailyStat): DailyStat {
  const xpEarned = Math.max(local.xpEarned, remote.xpEarned);

  return {
    ...local,
    // Contadores usam o máximo, não a soma: os dois lados podem já conter a
    // contribuição do outro por uma sincronização anterior, e somar de novo
    // inflaria o número a cada ciclo.
    xpEarned,
    minutesStudied: Math.max(local.minutesStudied, remote.minutesStudied),
    lessonsCompleted: Math.max(local.lessonsCompleted, remote.lessonsCompleted),
    reviewsCompleted: Math.max(local.reviewsCompleted, remote.reviewsCompleted),
    exercisesAttempted: Math.max(local.exercisesAttempted, remote.exercisesAttempted),
    exercisesCorrect: Math.max(local.exercisesCorrect, remote.exercisesCorrect),
    newWordsLearned: Math.max(local.newWordsLearned, remote.newWordsLearned),
    pronunciationScore:
      local.pronunciationScore === null
        ? remote.pronunciationScore
        : remote.pronunciationScore === null
          ? local.pronunciationScore
          : (local.pronunciationScore + remote.pronunciationScore) / 2,
    goalMet: local.goalMet || remote.goalMet,
  };
}

/** Merge de progresso de lição: mantém o estado mais avançado. */
export function mergeLessonProgress(
  local: LessonProgress,
  remote: LessonProgress,
): LessonProgress {
  const rank: Record<LessonProgress['status'], number> = {
    locked: 0,
    available: 1,
    in_progress: 2,
    completed: 3,
  };

  const status = rank[local.status] >= rank[remote.status] ? local.status : remote.status;

  return {
    ...local,
    status,
    bestAccuracy: Math.max(local.bestAccuracy, remote.bestAccuracy),
    attempts: Math.max(local.attempts, remote.attempts),
    // Preserva a data original de conclusão — é o que aparece no histórico.
    completedAt:
      local.completedAt === null
        ? remote.completedAt
        : remote.completedAt === null
          ? local.completedAt
          : Math.min(local.completedAt, remote.completedAt),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  };
}

/**
 * Merge de estado de SRS: vence a revisão mais recente.
 *
 * Diferente dos demais, aqui não dá para pegar o "máximo" campo a campo: o
 * estado de memória é coerente internamente (intervalo, estabilidade e
 * facilidade foram calculados juntos). Misturá-los produziria um agendamento
 * que nenhum dos dois lados calculou.
 */
export function mergeReviewState(local: ReviewState, remote: ReviewState): ReviewState {
  const localTime = local.lastReviewedAt ?? 0;
  const remoteTime = remote.lastReviewedAt ?? 0;

  const winner = localTime >= remoteTime ? local : remote;

  return {
    ...winner,
    // Estes três são cumulativos e sobrevivem à escolha do vencedor.
    totalReviews: Math.max(local.totalReviews, remote.totalReviews),
    lapses: Math.max(local.lapses, remote.lapses),
    starred: local.starred || remote.starred,
  };
}

/** Merge de ofensiva: a maior ganha, congelamentos somam o consumo. */
export function mergeStreak(local: StreakState, remote: StreakState): StreakState {
  const usedSet = new Set([...local.freezesUsed, ...remote.freezesUsed]);

  return {
    ...local,
    currentStreak: Math.max(local.currentStreak, remote.currentStreak),
    longestStreak: Math.max(local.longestStreak, remote.longestStreak),
    lastActiveDate:
      (local.lastActiveDate ?? '') >= (remote.lastActiveDate ?? '')
        ? local.lastActiveDate
        : remote.lastActiveDate,
    // O menor saldo é o correto: os dois lados podem ter gasto o mesmo
    // congelamento, e conceder o maior daria congelamento de graça.
    freezesAvailable: Math.min(local.freezesAvailable, remote.freezesAvailable),
    freezesUsed: [...usedSet].sort(),
  };
}
