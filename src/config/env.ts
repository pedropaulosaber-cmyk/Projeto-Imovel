import 'server-only';

import { z } from 'zod';

/**
 * Variáveis de ambiente — validação na inicialização
 * ==================================================
 *
 * Este módulo existe para transformar uma classe inteira de incidente de
 * produção em erro de boot.
 *
 * Sem ele, uma variável ausente não aparece no deploy: aparece três horas
 * depois, quando o primeiro usuário chega no checkout e `undefined` viaja até
 * a chamada da API de pagamento. O processo sobe verde, o monitoramento fica
 * verde, e o defeito só existe no caminho que ninguém testou.
 *
 * Com ele, o processo **não sobe**. Falhar no boot é ruidoso, imediato e
 * acontece antes de qualquer usuário — é a hora barata de descobrir.
 *
 * ## `server-only`
 *
 * O import no topo faz o build quebrar se este arquivo for puxado por um
 * Client Component. Não é zelo excessivo: `STRIPE_SECRET_KEY` num bundle de
 * navegador é uma chave publicada, e a única defesa confiável contra isso é
 * mecânica, não disciplina.
 */

/** Integração externa desligada por falta de credencial, e não por falha. */
const optionalSecret = z.string().min(1).optional();

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().url('DATABASE_URL precisa ser uma URL de conexão Postgres.'),

  /**
   * Segredo de assinatura da aplicação.
   *
   * Usado para derivar o hash dos tokens de sessão. 32 bytes é o piso: abaixo
   * disso a força bruta offline deixa de ser teórica. Não tem valor padrão de
   * propósito — um padrão em código é um segredo publicado, e todo mundo que
   * clonar o repositório teria o mesmo.
   */
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET precisa de ao menos 32 caracteres.'),

  /** Origem canônica. Serve para links absolutos, SEO e checagem de CSRF. */
  APP_URL: z.string().url().default('http://localhost:3000'),

  // ---- Pagamentos (Stripe) ----------------------------------------------
  // Ausentes, a plataforma funciona inteira menos comprar: o checkout devolve
  // um erro explícito em vez de fingir uma compra que não aconteceu.
  STRIPE_SECRET_KEY: optionalSecret,
  STRIPE_WEBHOOK_SECRET: optionalSecret,
  /** Comissão da plataforma, em pontos-base. 1500 = 15%, como anunciado. */
  PLATFORM_FEE_BPS: z.coerce.number().int().min(0).max(10_000).default(1500),

  // ---- Storage (S3-compatível) ------------------------------------------
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: optionalSecret,
  S3_SECRET_ACCESS_KEY: optionalSecret,
  /** Validade da URL assinada de download, em segundos. */
  S3_SIGNED_URL_TTL: z.coerce.number().int().min(30).max(3600).default(300),

  /** `debug` polui; `warn` esconde. `info` é o padrão que se lê de verdade. */
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Variáveis públicas.
 *
 * Ficam num objeto separado com prefixo `NEXT_PUBLIC_` porque tudo aqui vai
 * para o navegador. A separação é o que torna a regra "não vaze segredo"
 * verificável de relance, em vez de depender de alguém lembrar.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('AUTOMATIZE'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

function parseOrExit<T extends z.ZodTypeAny>(schema: T, source: unknown, label: string): z.infer<T> {
  const result = schema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  · ${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Configuração inválida em ${label}:\n${issues}\n\n` +
        'Compare o seu .env com o .env.example na raiz do projeto.',
    );
  }

  return result.data;
}

export const env = parseOrExit(serverSchema, process.env, 'variáveis de servidor');

export const publicEnv = parseOrExit(
  clientSchema,
  {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  'variáveis públicas',
);

/**
 * Integrações disponíveis neste ambiente.
 *
 * A aplicação consulta isto em vez de checar `process.env` espalhado. O ganho é
 * a interface poder dizer a verdade ("pagamento indisponível neste ambiente")
 * em vez de deixar o usuário descobrir com um erro no meio do checkout.
 */
export const integrations = {
  payments: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
  storage: Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY),
} as const;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
