import { describe, expect, it } from 'vitest';

import { formatBRL, parseBRLToCents, splitPayment } from '../money';

/**
 * Dinheiro é o único lugar do sistema onde um bug de arredondamento vira
 * divergência contábil que alguém precisa explicar. Estes testes existem para
 * a invariante que sustenta o repasse: `fee + net === total`, sempre.
 */
describe('splitPayment', () => {
  it('a soma das partes é sempre igual ao total', () => {
    // Valores escolhidos para forçar arredondamento: 15% de 1999 é 299,85
    // centavos, que não é inteiro. É exatamente onde um cálculo ingênuo
    // perde ou inventa um centavo.
    for (const total of [0, 1, 7, 99, 1999, 2_999, 18_900, 189_000, 1_234_567]) {
      const split = splitPayment(total, 1500);
      expect(split.feeCents + split.netCents).toBe(total);
    }
  });

  it('arredonda a comissão para baixo, favorecendo o vendedor', () => {
    // 15% de 1999 = 299,85 → a plataforma leva 299, o vendedor fica com o resto.
    const split = splitPayment(1999, 1500);
    expect(split.feeCents).toBe(299);
    expect(split.netCents).toBe(1700);
  });

  it('comissão zero devolve tudo ao vendedor', () => {
    expect(splitPayment(50_000, 0)).toEqual({
      totalCents: 50_000,
      feeCents: 0,
      netCents: 50_000,
    });
  });

  it('recusa valor não inteiro, negativo ou comissão fora da faixa', () => {
    expect(() => splitPayment(10.5)).toThrow();
    expect(() => splitPayment(-1)).toThrow();
    expect(() => splitPayment(100, 10_001)).toThrow();
    expect(() => splitPayment(100, -1)).toThrow();
  });
});

describe('parseBRLToCents', () => {
  it('entende os dois formatos que gente digita', () => {
    expect(parseBRLToCents('1.999,90')).toBe(199_990);
    expect(parseBRLToCents('1999.90')).toBe(199_990);
    expect(parseBRLToCents('R$ 1.890,00')).toBe(189_000);
    expect(parseBRLToCents('1890')).toBe(189_000);
  });

  it('devolve null em vez de NaN para entrada inválida', () => {
    // `NaN` atravessaria a validação em silêncio e viraria preço zero no
    // banco; `null` é rejeitado explicitamente.
    expect(parseBRLToCents('')).toBeNull();
    expect(parseBRLToCents('abc')).toBeNull();
    expect(parseBRLToCents('-50')).toBeNull();
  });
});

describe('formatBRL', () => {
  it('formata no padrão brasileiro', () => {
    // O espaço entre "R$" e o número é NBSP no `Intl` — normalizado para que o
    // teste não dependa do caractere invisível.
    expect(formatBRL(189_000).replace(/ /g, ' ')).toBe('R$ 1.890,00');
    expect(formatBRL(0).replace(/ /g, ' ')).toBe('R$ 0,00');
  });
});
