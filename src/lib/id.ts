/**
 * Geração de identificadores.
 *
 * Usamos ULID em vez de UUIDv4 por uma razão concreta de banco: o ULID começa
 * com o timestamp em base32, então os ids são **monotonicamente ordenáveis**.
 * Num índice B-tree do SQLite, isso significa inserções sempre no fim da
 * árvore em vez de espalhadas — menos páginas tocadas, menos I/O, menos
 * bateria. Com UUIDv4 aleatório, cada inserção suja uma página diferente.
 *
 * Bônus: dá para ordenar por criação sem uma coluna extra.
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32
const ENCODING_LENGTH = ENCODING.length;
const TIME_LENGTH = 10;
const RANDOM_LENGTH = 16;

/** Último timestamp usado, para garantir monotonicidade dentro do mesmo ms. */
let lastTime = 0;
let lastRandom: number[] = [];

function randomChar(): number {
  return Math.floor(Math.random() * ENCODING_LENGTH);
}

function encodeTime(time: number): string {
  let output = '';
  let remaining = time;

  for (let i = TIME_LENGTH - 1; i >= 0; i -= 1) {
    const mod = remaining % ENCODING_LENGTH;
    output = ENCODING[mod] + output;
    remaining = (remaining - mod) / ENCODING_LENGTH;
  }
  return output;
}

/** Incrementa o componente aleatório — mantém a ordem dentro do mesmo ms. */
function incrementRandom(random: number[]): number[] {
  const next = [...random];
  for (let i = next.length - 1; i >= 0; i -= 1) {
    if ((next[i] ?? 0) < ENCODING_LENGTH - 1) {
      next[i] = (next[i] ?? 0) + 1;
      return next;
    }
    next[i] = 0;
  }
  // Estouro (2^80 ids no mesmo milissegundo): sorteia de novo.
  return Array.from({ length: RANDOM_LENGTH }, randomChar);
}

/** Gera um ULID de 26 caracteres. */
export function ulid(now = Date.now()): string {
  if (now === lastTime) {
    lastRandom = incrementRandom(lastRandom);
  } else {
    lastTime = now;
    lastRandom = Array.from({ length: RANDOM_LENGTH }, randomChar);
  }

  const randomPart = lastRandom.map((value) => ENCODING[value]).join('');
  return encodeTime(now) + randomPart;
}

/**
 * Id determinístico a partir de partes estáveis.
 *
 * Usado onde o mesmo registro lógico precisa ter sempre o mesmo id em qualquer
 * dispositivo — progresso de lição, estatística do dia, estado de SRS. É o que
 * torna a sincronização convergente sem servidor de coordenação: dois
 * aparelhos offline criando "o progresso da lição X do usuário Y" geram o
 * mesmo id e o merge vira um upsert, não um duplicado.
 */
export function deterministicId(...parts: string[]): string {
  return parts.map((part) => part.replace(/[^A-Za-z0-9_-]/g, '')).join(':');
}
