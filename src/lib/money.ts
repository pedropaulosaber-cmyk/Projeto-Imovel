/**
 * Dinheiro
 * ========
 *
 * Todo valor monetário circula como **centavo inteiro**. Nenhum ponto do
 * sistema faz aritmética com reais fracionários, porque `0.1 + 0.2` em ponto
 * flutuante não é `0.3` e a diferença aparece exatamente onde dói: na soma do
 * repasse do vendedor no fim do mês.
 *
 * A conversão para texto acontece só na borda — na renderização. Se um valor
 * formatado ("R$ 199,00") volta para dentro do domínio, alguma camada está
 * fazendo o trabalho da outra.
 */

/** Comissão da plataforma em pontos-base. 1500 = 15%. */
export const DEFAULT_FEE_BPS = 1500;

export type Split = {
  /** O que o comprador paga. */
  totalCents: number;
  /** O que fica com a plataforma. */
  feeCents: number;
  /** O que vai para o vendedor. */
  netCents: number;
};

/**
 * Divide o valor entre plataforma e vendedor.
 *
 * O arredondamento da comissão é para baixo (`Math.floor`) e o líquido é o
 * **resto**, nunca um segundo cálculo. Assim `fee + net === total` por
 * construção, para qualquer entrada. Calcular os dois lados separadamente
 * produz o clássico centavo que some ou aparece — e, somado ao longo de um
 * mês de vendas, vira uma divergência que alguém precisa explicar.
 */
export function splitPayment(totalCents: number, feeBps: number = DEFAULT_FEE_BPS): Split {
  if (!Number.isInteger(totalCents) || totalCents < 0) {
    throw new Error(`Valor inválido: ${totalCents}. Use centavos inteiros e não negativos.`);
  }
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
    throw new Error(`Comissão inválida: ${feeBps} pontos-base.`);
  }

  const feeCents = Math.floor((totalCents * feeBps) / 10_000);
  return { totalCents, feeCents, netCents: totalCents - feeCents };
}

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

/** "R$ 199,00". Para exibição — nunca para voltar ao domínio. */
export function formatBRL(cents: number): string {
  return BRL.format(cents / 100);
}

/**
 * "R$ 199" quando não há centavos.
 *
 * Card de produto com dezenas de preços fica mais legível sem `,00` repetido.
 * Onde o valor exato importa (checkout, recibo, repasse), usa-se `formatBRL`.
 */
export function formatBRLCompact(cents: number): string {
  if (cents % 100 === 0) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }
  return BRL.format(cents / 100);
}

/** Faixa de orçamento de uma demanda: "R$ 5.000 – R$ 12.000". */
export function formatRange(minCents: number, maxCents: number): string {
  if (minCents === maxCents) return formatBRLCompact(minCents);
  return `${formatBRLCompact(minCents)} – ${formatBRLCompact(maxCents)}`;
}

/**
 * Converte texto digitado ("1.999,90", "R$ 1999.90") em centavos.
 *
 * Existe porque o campo de preço é digitado por gente, e gente digita das duas
 * formas. Devolve `null` em vez de `NaN`: `NaN` atravessa validação silencioso
 * e vira um preço zerado no banco.
 */
export function parseBRLToCents(input: string): number | null {
  const cleaned = input.replace(/[^\d,.-]/g, '').trim();
  if (!cleaned) return null;

  // "1.999,90" → separador decimal é a vírgula (padrão pt-BR).
  // "1999.90"  → separador decimal é o ponto.
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;

  return Math.round(value * 100);
}
