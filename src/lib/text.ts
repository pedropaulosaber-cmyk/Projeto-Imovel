/**
 * Texto: slug, formatação e sanitização de exibição.
 */

/**
 * Slug a partir de um título.
 *
 * A normalização NFD separa o acento da letra, e o `replace` seguinte remove
 * só a marca — é assim que "Automação" vira "automacao" em vez de "automao".
 * O passo é fácil de esquecer e o sintoma é sutil: URLs que perdem letras.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Slug garantidamente único.
 *
 * Recebe a função que consulta a existência em vez de consultar o banco: o
 * módulo continua puro e testável, e a mesma lógica serve para produto e para
 * perfil profissional.
 */
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'item';
  if (!(await exists(root))) return root;

  // Sufixo numérico até 50; depois, sufixo aleatório. O laço tem teto porque
  // um laço sem teto contra o banco é uma indisponibilidade esperando acontecer.
  for (let suffix = 2; suffix <= 50; suffix += 1) {
    const candidate = `${root}-${suffix}`;
    if (!(await exists(candidate))) return candidate;
  }

  return `${root}-${Math.random().toString(36).slice(2, 8)}`;
}

const DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value: Date | string): string {
  return DATE.format(new Date(value));
}

export function formatDateTime(value: Date | string): string {
  return DATE_TIME.format(new Date(value));
}

/** "há 3 dias". Usa `Intl.RelativeTimeFormat`, então já sai localizado. */
export function formatRelative(value: Date | string): string {
  const target = new Date(value).getTime();
  const diffSeconds = Math.round((target - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 30],
    ['month', 12],
  ];

  let value_ = diffSeconds;
  for (const [unit, size] of steps) {
    if (Math.abs(value_) < size) return formatter.format(Math.round(value_), unit);
    value_ /= size;
  }

  return formatter.format(Math.round(value_), 'year');
}

/** Média de avaliação com uma casa: 4.7. Devolve `null` sem avaliações. */
export function averageRating(sum: number, count: number): number | null {
  if (count <= 0) return null;
  return Math.round((sum / count) * 10) / 10;
}

/** "1,2 mil" — para contadores em card, onde o número exato não importa. */
export function compactNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

/**
 * Corta o texto sem quebrar palavra no meio.
 *
 * Usado em prévia de descrição. Corte cru ("automatiza…" virando "automat…")
 * parece defeito de renderização.
 */
export function excerpt(input: string, maxChars = 160): string {
  const clean = input.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;

  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Neutraliza um termo de busca para uso em `ILIKE`.
 *
 * O Prisma parametriza a query, então **não** há risco de SQL injection aqui.
 * O que se escapa é outra coisa: `%` e `_` são curingas do `LIKE`, e uma busca
 * por "100%" sem escape vira "qualquer coisa que comece com 100" — resultado
 * errado, não vulnerabilidade.
 */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (match) => `\\${match}`);
}

/**
 * Converte texto de usuário em parágrafos para renderização.
 *
 * Devolve array de strings, nunca HTML. A ausência de `dangerouslySetInnerHTML`
 * em todo o projeto é o que torna XSS estruturalmente impossível: o React
 * escapa tudo que passa por `{}`, e nenhum caminho aqui produz markup.
 */
export function toParagraphs(input: string): string[] {
  return input
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}
