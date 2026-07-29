/**
 * Testes da regra de aprovação nas provas de nível.
 *
 * A regra é curta, mas é a que decide se alguém "passou" — e uma nota errada
 * numa prova destrói a confiança no curso inteiro de um jeito que um exercício
 * errado não destrói.
 */

import { EXAM_PASS_THRESHOLD, examOutcome } from '../types';

describe('examOutcome', () => {
  it('calcula a nota como acertos sobre total', () => {
    expect(examOutcome(7, 10).score).toBeCloseTo(0.7);
    expect(examOutcome(3, 4).score).toBeCloseTo(0.75);
  });

  it('aprova exatamente na nota mínima', () => {
    // O limite é inclusivo: 70% passa. Reprovar quem tirou exatamente a nota
    // mínima é o tipo de detalhe que gera reclamação justificada.
    expect(examOutcome(7, 10).passed).toBe(true);
  });

  it('reprova logo abaixo da nota mínima', () => {
    expect(examOutcome(6, 10).passed).toBe(false);
  });

  it('não produz NaN quando a prova foi abandonada sem responder nada', () => {
    // Uma divisão por zero aqui atravessaria silenciosamente até a tela e
    // apareceria como "NaN%" para o usuário.
    const outcome = examOutcome(0, 0);

    expect(Number.isNaN(outcome.score)).toBe(false);
    expect(outcome.score).toBe(0);
    expect(outcome.passed).toBe(false);
  });

  it('aprova a prova perfeita', () => {
    expect(examOutcome(9, 9)).toEqual({ score: 1, passed: true });
  });

  it('mantém o limite documentado em 70%', () => {
    expect(EXAM_PASS_THRESHOLD).toBe(0.7);
  });
});
