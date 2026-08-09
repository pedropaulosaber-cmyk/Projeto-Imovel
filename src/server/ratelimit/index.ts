import 'server-only';

import { createHash } from 'node:crypto';

import { env } from '@/config/env';
import { rateLimited } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/server/db/prisma';

/**
 * Limite de taxa
 * ==============
 *
 * ## Por que no Postgres e não em memória
 *
 * Contador em memória de processo não limita nada em ambiente com mais de uma
 * instância: cada réplica tem o próprio contador, e um atacante que distribui
 * as tentativas entre elas multiplica o limite pelo número de réplicas. Em
 * serverless, onde instâncias nascem e morrem, é ainda pior — o contador
 * zera sozinho.
 *
 * Redis seria a escolha sob carga alta (contador atômico em memória, sem I/O
 * de disco). O Postgres já está aqui, é consistente entre réplicas e aguenta
 * folgado o volume de um marketplace em crescimento. A interface abaixo é a
 * mesma nos dois casos, então a troca é de implementação, não de chamadas.
 *
 * ## Janela deslizante, não fixa
 *
 * Janela fixa ("100 por hora, zera às cheias") permite 200 requisições em dois
 * minutos na virada da hora. A deslizante conta as últimas N unidades de tempo
 * a partir de agora, e não tem essa borda.
 */

export type RateLimitRule = {
  /** Quantas ações são permitidas na janela. */
  limit: number;
  /** Tamanho da janela, em segundos. */
  windowSeconds: number;
};

/**
 * Regras por operação.
 *
 * Os números não são arbitrários: cada um é o ponto em que o uso legítimo
 * ainda passa com folga e o abuso deixa de compensar.
 */
export const RULES = {
  /** Login: 5 tentativas em 15 min por identidade. Erro de digitação cabe. */
  login: { limit: 5, windowSeconds: 900 },
  /** Cadastro por IP: barra criação de contas em massa. */
  register: { limit: 3, windowSeconds: 3600 },
  /** Checkout: protege o provedor de pagamento de virar alvo por tabela. */
  checkout: { limit: 10, windowSeconds: 600 },
  /** Download: um comprador legítimo não baixa 60 vezes por hora. */
  download: { limit: 60, windowSeconds: 3600 },
  /** Escrita em geral (produto, proposta, avaliação, mensagem). */
  write: { limit: 60, windowSeconds: 600 },
  /** Busca: cara para o banco, barata para o atacante. */
  search: { limit: 120, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RuleName = keyof typeof RULES;

/**
 * Chave do balde.
 *
 * O identificador é hasheado: o balde de login usa e-mail, e guardar e-mail em
 * claro numa tabela de contadores seria espalhar dado pessoal por um lugar que
 * não precisa dele.
 */
function bucketKey(rule: RuleName, identifier: string): string {
  const digest = createHash('sha256').update(`${rule}:${identifier}${env.AUTH_SECRET}`).digest('hex');
  return `${rule}:${digest.slice(0, 32)}`;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Consome uma unidade do balde.
 *
 * Registra a tentativa **antes** de decidir, de propósito: assim uma rajada
 * concorrente não passa toda pela brecha entre a contagem e a inserção.
 */
export async function consume(rule: RuleName, identifier: string): Promise<RateLimitResult> {
  const { limit, windowSeconds } = RULES[rule];
  const bucket = bucketKey(rule, identifier);
  const since = new Date(Date.now() - windowSeconds * 1000);

  try {
    const [, count] = await prisma.$transaction([
      prisma.rateLimitHit.create({ data: { bucket } }),
      prisma.rateLimitHit.count({ where: { bucket, createdAt: { gte: since } } }),
    ]);

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: count <= limit ? 0 : windowSeconds,
    };
  } catch (error) {
    // Banco indisponível não pode transformar o limitador em porta trancada:
    // isso derrubaria o login inteiro por causa do contador. Falha aberta,
    // com registro — a alternativa é uma indisponibilidade auto-infligida.
    logger.error('Falha ao consultar o limite de taxa; liberando a requisição', error, { rule });
    return { allowed: true, remaining: 0, retryAfterSeconds: 0 };
  }
}

/** Consome e lança quando estourou. Atalho para quem só quer barrar. */
export async function enforce(rule: RuleName, identifier: string): Promise<void> {
  const result = await consume(rule, identifier);
  if (result.allowed) return;

  logger.warn('Limite de taxa atingido', { rule });
  throw rateLimited(
    `Muitas tentativas. Tente de novo em ${Math.ceil(result.retryAfterSeconds / 60)} minutos.`,
  );
}

/**
 * Remove contadores vencidos.
 *
 * Feito para rodar num cron. Sem isto a tabela cresce para sempre — e uma
 * tabela de contadores com cem milhões de linhas mortas deixa o próprio
 * limitador lento, que é a ironia de sempre.
 */
export async function pruneExpired(): Promise<number> {
  const longestWindow = Math.max(...Object.values(RULES).map((rule) => rule.windowSeconds));
  const cutoff = new Date(Date.now() - longestWindow * 1000);
  const { count } = await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return count;
}
