/**
 * Testes dos modos de aprendizado.
 *
 * O que precisa ser garantido aqui não é cosmético: o Essencial promete
 * sessões curtas e sem armadilha de mecânica, e o Completo promete não ser
 * tocado. Uma regressão em qualquer um dos dois quebra a promessa feita na
 * tela de escolha.
 */

import {
  ESSENTIAL_SESSION_SIZE,
  adaptExercisesToMode,
  heartsForMode,
  reviewBatchSize,
} from '../learning-mode';
import type { Exercise, ExerciseType } from '../types';

/**
 * Fábrica simples: o motor de adaptação só olha `type`, `order` e
 * `difficulty`, então um objeto com esses campos basta e evita montar as 16
 * variantes reais da união discriminada.
 */
function ex(order: number, type: ExerciseType, difficulty = 0.5): Exercise {
  return {
    id: `e${order}`,
    lessonId: 'l1',
    order,
    difficulty,
    conceptIds: [`c${order}`],
    type,
    prompt: 'p',
    choices: ['a', 'b'],
    correctIndex: 0,
  } as unknown as Exercise;
}

describe('adaptExercisesToMode', () => {
  it('não toca na lista no modo completo', () => {
    const list = [ex(1, 'speak'), ex(2, 'dictation'), ex(3, 'multiple_choice')];
    expect(adaptExercisesToMode(list, 'complete')).toBe(list);
  });

  it('remove os tipos que exigem microfone ou texto longo no Essencial', () => {
    const list = [
      ex(1, 'speak'),
      ex(2, 'multiple_choice'),
      ex(3, 'dictation'),
      ex(4, 'word_bank'),
      ex(5, 'reading_comprehension'),
    ];

    const types = adaptExercisesToMode(list, 'essential').map((item) => item.type);
    expect(types).toEqual(['multiple_choice', 'word_bank']);
  });

  it('corta a sessão em cinco itens, pegando os mais fáceis', () => {
    const list = Array.from({ length: 12 }, (_, i) =>
      ex(i + 1, 'multiple_choice', (i + 1) / 12),
    );

    const result = adaptExercisesToMode(list, 'essential');

    expect(result).toHaveLength(ESSENTIAL_SESSION_SIZE);
    // Os cinco menores `difficulty` são os de order 1..5.
    expect(result.map((item) => item.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('devolve os selecionados na ordem original da lição, não por dificuldade', () => {
    const list = [
      ex(1, 'multiple_choice', 0.9),
      ex(2, 'multiple_choice', 0.1),
      ex(3, 'multiple_choice', 0.5),
    ];

    expect(adaptExercisesToMode(list, 'essential').map((item) => item.order)).toEqual([
      1, 2, 3,
    ]);
  });

  it('nunca devolve sessão vazia quando a lição só tem tipos não permitidos', () => {
    const list = [ex(1, 'speak'), ex(2, 'shadowing')];
    const result = adaptExercisesToMode(list, 'essential');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toHaveLength(2);
  });
});

describe('heartsForMode', () => {
  it('dá vidas infinitas no Essencial, mesmo no plano gratuito', () => {
    expect(heartsForMode('essential', false)).toBe(Number.POSITIVE_INFINITY);
  });

  it('mantém as 5 vidas do gratuito no modo completo', () => {
    expect(heartsForMode('complete', false)).toBe(5);
  });

  it('assinante nunca perde vida, em qualquer modo', () => {
    expect(heartsForMode('complete', true)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('reviewBatchSize', () => {
  it('no completo revisa a fila inteira', () => {
    expect(reviewBatchSize('complete', 83)).toBe(83);
  });

  it('no Essencial corta em 10 para a dívida parecer pagável', () => {
    expect(reviewBatchSize('essential', 83)).toBe(10);
  });

  it('nunca infla uma fila menor que o corte', () => {
    expect(reviewBatchSize('essential', 3)).toBe(3);
  });
});
