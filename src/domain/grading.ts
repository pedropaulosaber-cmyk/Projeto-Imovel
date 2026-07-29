/**
 * Lumo — Correção de exercícios (offline)
 * ========================================
 *
 * Todo exercício é corrigido **localmente**, sem rede. A IA remota entra
 * depois, para enriquecer a explicação — nunca para decidir se está certo.
 *
 * Essa separação é o que permite o app funcionar 100% offline sem degradar a
 * experiência: a resposta aparece em milissegundos, e o comentário do tutor
 * chega quando (e se) houver conexão.
 *
 * A parte mais delicada é a tolerância. Um corretor rígido demais ("faltou o
 * acento") destrói a motivação; um corretor frouxo demais deixa passar erro
 * real. As regras abaixo foram escolhidas para punir só o que muda o
 * significado.
 */

import type { Exercise, ExerciseResult } from './types';

/* ------------------------------------------------------------------ *
 * Normalização de texto
 * ------------------------------------------------------------------ */

/**
 * Normaliza uma resposta para comparação.
 *
 * Remove acentos, pontuação, artigos redundantes de espaço e caixa. Mantém
 * apóstrofos internos (l'école, don't), que são parte da palavra.
 */
export function normalizeAnswer(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      // Decompõe e remove diacríticos: "café" → "cafe".
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      // Pontuação de borda e interna, exceto apóstrofo e hífen internos.
      .replace(/[.,!?;:¡¿"“”()[\]]/g, '')
      .replace(/’/g, "'")
      // Colapsa espaços.
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Distância de Levenshtein entre duas strings.
 *
 * Implementação com duas linhas (O(min(n,m)) de memória) porque isso roda em
 * loop na thread de UI durante o ditado, em aparelhos modestos.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1, // inserção
        (previous[j] ?? 0) + 1, // remoção
        (previous[j - 1] ?? 0) + cost, // substituição
      );
    }
    const swap = previous;
    previous = current;
    current = swap;
  }

  return previous[b.length] ?? 0;
}

/** Similaridade 0–1 derivada da distância de edição. */
export function similarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - levenshtein(a, b) / maxLength;
}

export type MatchVerdict = 'exact' | 'typo' | 'wrong';

/**
 * Compara a resposta do usuário com as respostas aceitas.
 *
 * Devolve `'typo'` quando a diferença é pequena o bastante para ser digitação
 * (1 caractere em palavras curtas, até ~15% em frases). Nesse caso o app
 * aceita a resposta, mas mostra a forma correta — o usuário aprende sem ser
 * punido por um dedo torto no celular.
 */
export function matchAnswer(
  userAnswer: string,
  acceptedAnswers: string[],
): { verdict: MatchVerdict; best: string; score: number } {
  const normalizedUser = normalizeAnswer(userAnswer);

  if (normalizedUser.length === 0) {
    return { verdict: 'wrong', best: acceptedAnswers[0] ?? '', score: 0 };
  }

  let bestScore = 0;
  let bestAnswer = acceptedAnswers[0] ?? '';

  for (const accepted of acceptedAnswers) {
    const normalizedAccepted = normalizeAnswer(accepted);

    if (normalizedUser === normalizedAccepted) {
      return { verdict: 'exact', best: accepted, score: 1 };
    }

    const score = similarity(normalizedUser, normalizedAccepted);
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = accepted;
    }
  }

  const normalizedBest = normalizeAnswer(bestAnswer);
  const distance = levenshtein(normalizedUser, normalizedBest);

  // Tolerância proporcional ao tamanho: 1 erro em palavras curtas,
  // até 15% do comprimento em frases longas.
  const allowedDistance =
    normalizedBest.length <= 6 ? 1 : Math.floor(normalizedBest.length * 0.15);

  if (distance > 0 && distance <= allowedDistance) {
    return { verdict: 'typo', best: bestAnswer, score: bestScore };
  }

  return { verdict: 'wrong', best: bestAnswer, score: bestScore };
}

/* ------------------------------------------------------------------ *
 * Pronúncia
 * ------------------------------------------------------------------ */

/**
 * Pontua a pronúncia comparando a transcrição do reconhecimento de voz com o
 * texto-alvo.
 *
 * Isto é uma aproximação deliberada. Avaliação fonética real (GOP sobre
 * alinhamento forçado) exige modelo acústico no dispositivo, o que está
 * planejado para a v2 (ver docs/15-melhorias-futuras.md). O que temos aqui já
 * distingue bem "falou errado" de "falou certo", que é o feedback que importa
 * para um iniciante, e roda 100% offline com o reconhecedor do sistema.
 *
 * @param transcript Texto reconhecido do áudio do usuário.
 * @param target     Texto que deveria ter sido dito.
 */
export function scorePronunciation(
  transcript: string,
  target: string,
): { score: number; wordScores: { word: string; correct: boolean }[] } {
  const targetWords = normalizeAnswer(target).split(' ').filter(Boolean);
  const spokenWords = normalizeAnswer(transcript).split(' ').filter(Boolean);

  if (targetWords.length === 0) {
    return { score: 0, wordScores: [] };
  }

  const wordScores = targetWords.map((word, index) => {
    // Procura a palavra numa janela ao redor da posição esperada, tolerando
    // pequenas inserções e omissões do reconhecedor.
    const windowStart = Math.max(0, index - 2);
    const windowEnd = Math.min(spokenWords.length, index + 3);
    const window = spokenWords.slice(windowStart, windowEnd);

    const correct = window.some((spoken) => similarity(spoken, word) >= 0.75);
    return { word, correct };
  });

  const correctCount = wordScores.filter((w) => w.correct).length;
  let score = correctCount / targetWords.length;

  // Penaliza fala muito mais longa que o alvo (o usuário divagou ou o
  // reconhecedor captou ruído).
  if (spokenWords.length > targetWords.length * 1.5) {
    score *= 0.85;
  }

  return { score: Math.min(1, Math.max(0, score)), wordScores };
}

/* ------------------------------------------------------------------ *
 * Correção por tipo de exercício
 * ------------------------------------------------------------------ */

/** Resposta do usuário, cuja forma depende do tipo de exercício. */
export type UserAnswer =
  | { kind: 'choice'; index: number }
  | { kind: 'text'; value: string }
  | { kind: 'tokens'; values: string[] }
  | { kind: 'order'; values: number[] }
  | { kind: 'pairs'; matches: { left: string; right: string }[] }
  | { kind: 'speech'; transcript: string }
  | { kind: 'choices'; indices: number[] }
  | { kind: 'skip' };

const PRAISE = ['Perfeito!', 'Isso!', 'Exatamente.', 'Muito bem!', 'Correto!'];
const ENCOURAGEMENT = ['Quase lá.', 'Não foi dessa vez.', 'Vamos revisar isso.'];

/** Escolha determinística de elogio a partir do id — evita repetir na mesma tela. */
function praiseFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PRAISE[Math.abs(hash) % PRAISE.length]!;
}

function encouragementFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return ENCOURAGEMENT[Math.abs(hash) % ENCOURAGEMENT.length]!;
}

/**
 * Corrige uma resposta. Função pura e exaustiva sobre `Exercise`.
 *
 * O `switch` sem `default` é intencional: adicionar um tipo novo de exercício
 * quebra a compilação aqui até que a correção seja implementada.
 */
export function gradeExercise(exercise: Exercise, answer: UserAnswer): ExerciseResult {
  if (answer.kind === 'skip') {
    return {
      correct: false,
      score: 0,
      feedback: 'Exercício pulado.',
      explanation: exercise.explanation,
    };
  }

  switch (exercise.type) {
    case 'multiple_choice':
    case 'listen_respond': {
      if (answer.kind !== 'choice') return invalidAnswer(exercise);
      const correct = answer.index === exercise.correctIndex;
      return {
        correct,
        score: correct ? 1 : 0,
        feedback: correct ? praiseFor(exercise.id) : encouragementFor(exercise.id),
        explanation: exercise.explanation,
        correctAnswer: exercise.choices[exercise.correctIndex],
      };
    }

    case 'translate':
    case 'listen_type':
    case 'dictation':
    case 'correct_sentence': {
      if (answer.kind !== 'text') return invalidAnswer(exercise);
      const accepted = exercise.acceptedAnswers;
      const { verdict, best, score } = matchAnswer(answer.value, accepted);

      if (verdict === 'exact') {
        return {
          correct: true,
          score: 1,
          feedback: praiseFor(exercise.id),
          explanation: exercise.explanation,
        };
      }
      if (verdict === 'typo') {
        return {
          correct: true,
          score: 0.85,
          feedback: 'Quase perfeito — atenção à grafia.',
          correctAnswer: best,
          explanation: exercise.explanation,
        };
      }
      return {
        correct: false,
        score,
        feedback: encouragementFor(exercise.id),
        correctAnswer: best,
        explanation: exercise.explanation,
      };
    }

    case 'fill_blank': {
      if (answer.kind === 'choice') {
        const chosen = exercise.choices?.[answer.index] ?? '';
        const { verdict, best } = matchAnswer(chosen, exercise.acceptedAnswers);
        const correct = verdict !== 'wrong';
        return {
          correct,
          score: correct ? 1 : 0,
          feedback: correct ? praiseFor(exercise.id) : encouragementFor(exercise.id),
          correctAnswer: best,
          explanation: exercise.explanation,
        };
      }
      if (answer.kind !== 'text') return invalidAnswer(exercise);
      const { verdict, best, score } = matchAnswer(answer.value, exercise.acceptedAnswers);
      const correct = verdict !== 'wrong';
      return {
        correct,
        score: verdict === 'exact' ? 1 : verdict === 'typo' ? 0.85 : score,
        feedback: correct ? praiseFor(exercise.id) : encouragementFor(exercise.id),
        correctAnswer: best,
        explanation: exercise.explanation,
      };
    }

    case 'word_bank': {
      if (answer.kind !== 'tokens') return invalidAnswer(exercise);
      const userSentence = normalizeAnswer(answer.values.join(' '));
      const solution = normalizeAnswer(exercise.solution.join(' '));
      const correct = userSentence === solution;
      return {
        correct,
        score: correct ? 1 : similarity(userSentence, solution),
        feedback: correct ? praiseFor(exercise.id) : 'A ordem não está certa.',
        correctAnswer: exercise.solution.join(' '),
        explanation: exercise.explanation,
      };
    }

    case 'match_pairs': {
      if (answer.kind !== 'pairs') return invalidAnswer(exercise);
      const expected = new Map(
        exercise.pairs.map((p) => [normalizeAnswer(p.left), normalizeAnswer(p.right)]),
      );
      const hits = answer.matches.filter(
        (m) => expected.get(normalizeAnswer(m.left)) === normalizeAnswer(m.right),
      ).length;
      const score = exercise.pairs.length === 0 ? 0 : hits / exercise.pairs.length;
      return {
        correct: score === 1,
        score,
        feedback:
          score === 1
            ? praiseFor(exercise.id)
            : `${hits} de ${exercise.pairs.length} pares corretos.`,
        explanation: exercise.explanation,
      };
    }

    case 'order_dialogue': {
      if (answer.kind !== 'order') return invalidAnswer(exercise);
      const correct =
        answer.values.length === exercise.solution.length &&
        answer.values.every((value, index) => value === exercise.solution[index]);
      const hits = answer.values.filter((v, i) => v === exercise.solution[i]).length;
      return {
        correct,
        score: exercise.solution.length === 0 ? 0 : hits / exercise.solution.length,
        feedback: correct ? praiseFor(exercise.id) : 'Alguma fala está fora de ordem.',
        explanation: exercise.explanation,
      };
    }

    case 'speak':
    case 'shadowing': {
      if (answer.kind !== 'speech') return invalidAnswer(exercise);
      const target = exercise.type === 'speak' ? exercise.targetText : exercise.audioText;
      const threshold = exercise.type === 'speak' ? exercise.passThreshold : 0.6;
      const { score } = scorePronunciation(answer.transcript, target);
      const correct = score >= threshold;

      return {
        correct,
        score,
        feedback: correct
          ? score >= 0.9
            ? 'Pronúncia excelente!'
            : 'Boa! Deu para entender bem.'
          : 'Vamos tentar de novo, mais devagar.',
        correctAnswer: target,
        explanation: exercise.explanation,
      };
    }

    case 'reading_comprehension': {
      if (answer.kind !== 'choices') return invalidAnswer(exercise);
      const hits = exercise.questions.filter(
        (question, index) => answer.indices[index] === question.correctIndex,
      ).length;
      const score = exercise.questions.length === 0 ? 0 : hits / exercise.questions.length;
      return {
        correct: score >= 0.6,
        score,
        feedback: `${hits} de ${exercise.questions.length} corretas.`,
        explanation: exercise.explanation,
      };
    }

    case 'describe_image': {
      if (answer.kind !== 'text') return invalidAnswer(exercise);
      const words = answer.value.trim().split(/\s+/).filter(Boolean);
      const normalized = normalizeAnswer(answer.value);
      const hits = exercise.expectedKeywords.filter((keyword) =>
        normalized.includes(normalizeAnswer(keyword)),
      ).length;

      const lengthOk = words.length >= exercise.minWords;
      const keywordRatio =
        exercise.expectedKeywords.length === 0 ? 1 : hits / exercise.expectedKeywords.length;
      const score = lengthOk ? Math.max(0.5, keywordRatio) : keywordRatio * 0.5;

      return {
        correct: lengthOk && keywordRatio >= 0.4,
        score,
        feedback: !lengthOk
          ? `Escreva pelo menos ${exercise.minWords} palavras.`
          : `Você usou ${hits} de ${exercise.expectedKeywords.length} ideias esperadas.`,
        explanation: exercise.explanation,
      };
    }

    case 'conversation': {
      // Conversa livre não tem gabarito: a nota vem da participação, e a
      // avaliação qualitativa fica com o tutor.
      const turns = answer.kind === 'text' ? Number(answer.value) || 0 : 0;
      const correct = turns >= exercise.minTurns;
      return {
        correct,
        score: Math.min(1, turns / Math.max(1, exercise.minTurns)),
        feedback: correct
          ? 'Boa conversa! Objetivos cumpridos.'
          : `Faltam ${exercise.minTurns - turns} interações.`,
        explanation: exercise.explanation,
      };
    }

    case 'flashcard': {
      // O flashcard é auto-avaliado; a nota real vem da escala do SRS.
      return {
        correct: true,
        score: 1,
        feedback: '',
        explanation: exercise.explanation,
      };
    }
  }
}

function invalidAnswer(exercise: Exercise): ExerciseResult {
  return {
    correct: false,
    score: 0,
    feedback: 'Resposta em formato inesperado.',
    explanation: exercise.explanation,
  };
}

/* ------------------------------------------------------------------ *
 * Análise de erros
 * ------------------------------------------------------------------ */

/**
 * Diferença palavra a palavra entre a resposta e o gabarito.
 *
 * Alimenta o feedback visual que destaca exatamente o que saiu errado, em vez
 * de só dizer "errado" — o que transforma o erro em aprendizado.
 */
export function diffWords(
  userAnswer: string,
  correctAnswer: string,
): { word: string; status: 'ok' | 'wrong' | 'missing' | 'extra' }[] {
  const userWords = normalizeAnswer(userAnswer).split(' ').filter(Boolean);
  const correctWords = normalizeAnswer(correctAnswer).split(' ').filter(Boolean);
  const result: { word: string; status: 'ok' | 'wrong' | 'missing' | 'extra' }[] = [];

  const max = Math.max(userWords.length, correctWords.length);
  for (let i = 0; i < max; i += 1) {
    const user = userWords[i];
    const correct = correctWords[i];

    if (user === undefined && correct !== undefined) {
      result.push({ word: correct, status: 'missing' });
    } else if (user !== undefined && correct === undefined) {
      result.push({ word: user, status: 'extra' });
    } else if (user !== undefined && correct !== undefined) {
      result.push({ word: user, status: user === correct ? 'ok' : 'wrong' });
    }
  }

  return result;
}
