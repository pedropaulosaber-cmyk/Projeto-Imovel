/**
 * Trilha adaptada ao objetivo do aluno
 * =====================================
 *
 * ## O problema
 *
 * O onboarding pergunta por que a pessoa quer aprender — viajar, trabalhar,
 * passar numa prova — e até agora essa resposta só ajustava o **plano diário**
 * (quanto de escuta, quanto de fala). A sequência de módulos era idêntica para
 * todo mundo.
 *
 * Isso é o pior dos dois mundos: o app pergunta e não usa. Quem quer inglês
 * para uma entrevista de emprego passava as primeiras semanas pedindo comida em
 * restaurante, e concluía — com razão — que o curso não é sobre ele.
 *
 * ## A solução, e o que ela deliberadamente **não** faz
 *
 * Cada objetivo declara três coisas:
 *
 *  - `priority` — os módulos que sobem para o começo da trilha.
 *  - `emphasis` — o tipo de lição que ganha peso extra dentro dos módulos.
 *  - `intro` — a frase que explica ao aluno o que mudou e por quê.
 *
 * O que **não** muda: nenhum módulo é removido. Reordenar é seguro — quem quer
 * viajar ainda vai precisar do passado em algum momento. Remover conteúdo com
 * base numa resposta de trinta segundos no onboarding cria buracos que o aluno
 * só descobre meses depois, quando já é caro voltar. Além disso, a pessoa pode
 * mudar de objetivo, e uma trilha podada não se recompõe.
 *
 * Ou seja: **a ordem serve ao objetivo, a cobertura serve ao idioma.**
 */

import type { LearningGoal, LessonKind } from '@/domain/types';

export type GoalTrack = {
  /** Trechos de chave de módulo que sobem na ordem, do mais para o menos urgente. */
  priority: string[];
  /** Tipos de lição que recebem peso extra dentro de cada módulo. */
  emphasis: LessonKind[];
  /** Explicação mostrada na trilha — o aluno precisa ver que foi ouvido. */
  intro: string;
};

export const GOAL_TRACKS: Record<LearningGoal, GoalTrack> = {
  travel: {
    priority: ['out-and-about', 'first-contact', 'health', 'neighbourhood'],
    emphasis: ['listening', 'speaking', 'conversation'],
    intro:
      'Sua trilha começa pelo que resolve o dia numa viagem: pedir, perguntar direção, comprar e se virar num imprevisto. Escuta e fala vêm antes de gramática detalhada — em viagem, entender e ser entendido é tudo.',
  },
  work: {
    priority: ['work', 'meeting', 'money', 'daily-life'],
    emphasis: ['writing', 'conversation', 'reading'],
    intro:
      'Sua trilha prioriza e-mail, reunião e negociação de prazo. A escrita vem cedo porque, no trabalho, a primeira impressão costuma ser um texto — e um e-mail com erro de registro custa mais caro que um tropeço na fala.',
  },
  exchange: {
    priority: ['neighbourhood', 'first-contact', 'health', 'money'],
    emphasis: ['conversation', 'listening', 'speaking'],
    intro:
      'Sua trilha começa por morar fora: bairro, serviços, saúde e burocracia do dia a dia. É o conteúdo que se usa na primeira semana e que quase nenhum curso ensina primeiro.',
  },
  conversation: {
    priority: ['first-contact', 'friends', 'opinion', 'story'],
    emphasis: ['conversation', 'speaking', 'listening'],
    intro:
      'Sua trilha é organizada em torno de falar. Conversa, opinião e narrativa vêm primeiro; leitura e escrita entram como apoio, não como centro.',
  },
  exam: {
    priority: ['academic', 'abstract', 'story', 'opinion'],
    emphasis: ['reading', 'writing', 'grammar'],
    intro:
      'Sua trilha segue o formato das provas: leitura densa, redação estruturada e precisão gramatical. As provas cobram produção escrita sob tempo, e é isso que a ordem enfatiza.',
  },
  business: {
    priority: ['professional', 'meeting', 'work', 'critique'],
    emphasis: ['conversation', 'writing', 'reading'],
    intro:
      'Sua trilha prioriza negociação, apresentação e discordância com quem tem mais poder que você. O ajuste de registro entra cedo — em negócios, o tom erra antes da gramática.',
  },
  culture: {
    priority: ['media', 'idiomatic', 'story', 'nuance'],
    emphasis: ['reading', 'listening', 'review'],
    intro:
      'Sua trilha começa por mídia, narrativa e expressão idiomática. O alvo é consumir conteúdo nativo sem legenda, então escuta e leitura dominam a ordem.',
  },
};

/**
 * Ordena os módulos conforme o objetivo.
 *
 * A chave de cada módulo carrega o tema (`a1-out-and-about`, `b1-work`), então
 * a correspondência é por trecho, não por igualdade — o que mantém a função
 * funcionando quando um nível novo reaproveitar um tema existente.
 *
 * Módulos sem correspondência **não somem**: vão para o fim, na ordem original.
 * É o que garante que priorizar nunca vire remover.
 */
export function sortModulesForGoals<T extends { key: string; order?: number }>(
  modules: T[],
  goals: LearningGoal[],
): T[] {
  if (goals.length === 0) return modules;

  // Peso acumulado: um módulo que interessa a dois objetivos do aluno sobe
  // mais do que um que interessa a apenas um.
  const weight = new Map<string, number>();

  for (const goal of goals) {
    const track = GOAL_TRACKS[goal];
    track.priority.forEach((fragment, position) => {
      for (const module of modules) {
        if (!module.key.includes(fragment)) continue;
        const bonus = track.priority.length - position;
        weight.set(module.key, (weight.get(module.key) ?? 0) + bonus);
      }
    });
  }

  return [...modules].sort((a, b) => {
    const difference = (weight.get(b.key) ?? 0) - (weight.get(a.key) ?? 0);
    // Empate mantém a ordem pedagógica original — dois módulos igualmente
    // relevantes ao objetivo continuam na sequência que o curso previu.
    return difference !== 0 ? difference : 0;
  });
}

/**
 * Tipos de lição enfatizados pelos objetivos escolhidos.
 *
 * Usado pelo motor de exercícios para dar um empurrão às lições que servem ao
 * objetivo, sem esconder as demais.
 */
export function emphasisFor(goals: LearningGoal[]): Set<LessonKind> {
  const kinds = new Set<LessonKind>();
  for (const goal of goals) {
    for (const kind of GOAL_TRACKS[goal].emphasis) kinds.add(kind);
  }
  return kinds;
}

/** Frase que explica ao aluno como a trilha dele foi montada. */
export function trackIntro(goals: LearningGoal[]): string {
  const first = goals[0];
  if (!first) return 'Sua trilha segue a ordem padrão do curso.';
  return GOAL_TRACKS[first].intro;
}
