/**
 * Lumo — Modos de aprendizado
 * ============================
 *
 * O app oferece dois caminhos para o mesmo conteúdo. Não são níveis de
 * dificuldade nem planos de assinatura: são **ritmos** diferentes.
 *
 *  - **Completo** — a trilha inteira. Todos os tipos de exercício, sessões do
 *    tamanho do compromisso declarado, vidas no plano gratuito. É o modo de
 *    quem quer profundidade e aceita atrito em troca dela.
 *
 *  - **Essencial** — o caminho curto. Poucos tipos de exercício, sessões de 5
 *    itens, sem vidas, plano do dia com no máximo dois blocos. É o modo de quem
 *    tem cinco minutos no ônibus e quer aprender algo, não administrar um app.
 *
 * ## Por que isso existe
 *
 * O maior motivo de abandono em apps de idioma não é dificuldade do idioma — é
 * **carga de decisão e de interface**. Quando a sessão tem oito tipos de
 * exercício, cada um com sua mecânica própria, o usuário gasta atenção
 * aprendendo o app em vez do idioma. O Essencial elimina isso reduzindo o
 * repertório a quatro mecânicas que qualquer pessoa entende no primeiro toque.
 *
 * ## O que o Essencial NÃO faz
 *
 * Não reduz a exigência pedagógica: as respostas continuam sendo corrigidas do
 * mesmo jeito, o SRS continua registrando o desempenho real e a repetição
 * espaçada segue idêntica. Um item respondido no Essencial vale exatamente o
 * mesmo que no Completo na fila de revisão. Reduzir o rigor da correção seria
 * transformar o modo fácil em modo inútil.
 */

import type { Exercise, ExerciseType, LearningMode } from './types';

/* ------------------------------------------------------------------ *
 * Metadados para a interface
 * ------------------------------------------------------------------ */

export const LEARNING_MODE_META: Record<
  LearningMode,
  { title: string; tagline: string; description: string; icon: string; highlights: string[] }
> = {
  complete: {
    title: 'Completo',
    tagline: 'A trilha inteira',
    description:
      'Todos os tipos de exercício, sessões do tamanho da sua meta e o sistema de vidas. Mais profundidade, mais variedade.',
    icon: 'layers',
    highlights: [
      'Todos os 16 tipos de exercício',
      'Sessões do tamanho da sua meta diária',
      'Pronúncia, ditado, escrita e conversa',
      'Sistema de vidas',
    ],
  },
  essential: {
    title: 'Essencial',
    tagline: 'Direto ao ponto',
    description:
      'Quatro tipos de exercício, sessões de 5 itens e nada de vidas. Feito para caber em cinco minutos, sem menu para aprender.',
    icon: 'flash',
    highlights: [
      'Só as 4 mecânicas mais diretas',
      'Sessões curtas, de 5 exercícios',
      'Sem vidas — errar não interrompe',
      'Mesma revisão espaçada do modo completo',
    ],
  },
};

/* ------------------------------------------------------------------ *
 * Regras do modo
 * ------------------------------------------------------------------ */

/**
 * Tipos de exercício permitidos no Essencial.
 *
 * A escolha é por **custo de compreensão da mecânica**, não por dificuldade
 * linguística: são os quatro formatos que dispensam instrução. Ficam de fora
 * os que exigem microfone (`speak`, `shadowing`), texto livre longo
 * (`dictation`, `describe_image`) ou leitura de enunciado antes de responder
 * (`reading_comprehension`, `order_dialogue`, `correct_sentence`).
 */
export const ESSENTIAL_EXERCISE_TYPES: ExerciseType[] = [
  'multiple_choice',
  'word_bank',
  'listen_type',
  'flashcard',
];

/** Quantidade de exercícios por sessão no Essencial. */
export const ESSENTIAL_SESSION_SIZE = 5;

/** Blocos máximos no plano do dia, por modo. */
export const MAX_PLAN_BLOCKS: Record<LearningMode, number> = {
  complete: 4,
  essential: 2,
};

/** No Essencial não há vidas: errar nunca encerra a sessão. */
export function heartsForMode(mode: LearningMode, isPremium: boolean): number {
  if (mode === 'essential' || isPremium) return Number.POSITIVE_INFINITY;
  return 5;
}

/**
 * Adapta a lista de exercícios de uma lição ao modo escolhido.
 *
 * No Completo é identidade — devolve a lista como veio.
 *
 * No Essencial filtra pelos tipos permitidos e corta em cinco itens. O corte é
 * pelos **mais fáceis primeiro** (`difficulty` crescente) e não pela ordem
 * original: numa sessão de cinco itens, começar pelo mais difícil da lição é a
 * diferença entre terminar e desistir.
 *
 * O caso degenerado importa: se a lição não tiver nenhum exercício do tipo
 * permitido, devolvemos a lição original em vez de uma tela vazia. Um modo que
 * às vezes não tem conteúdo é pior que um modo que às vezes mostra um tipo a
 * mais.
 */
export function adaptExercisesToMode(exercises: Exercise[], mode: LearningMode): Exercise[] {
  if (mode === 'complete') return exercises;

  const allowed = exercises.filter((exercise) =>
    ESSENTIAL_EXERCISE_TYPES.includes(exercise.type),
  );

  const pool = allowed.length > 0 ? allowed : exercises;

  return (
    [...pool]
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(0, ESSENTIAL_SESSION_SIZE)
      // Restaura a ordem pedagógica original entre os selecionados: o autor da
      // lição sequenciou por construção de conceito, e isso continua valendo.
      .sort((a, b) => a.order - b.order)
  );
}

/** Quantos itens a sessão de revisão traz por vez, no modo escolhido. */
export function reviewBatchSize(mode: LearningMode, dueCount: number): number {
  if (mode === 'complete') return dueCount;
  // Fila cortada em 10: no Essencial, uma dívida de 80 revisões precisa parecer
  // resolvível hoje, ou o usuário simplesmente não abre a tela.
  return Math.min(dueCount, 10);
}
