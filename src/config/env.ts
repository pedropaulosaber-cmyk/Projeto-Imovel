import 'server-only';

import { z } from 'zod';

/**
 * Variáveis de servidor. Nenhuma é obrigatória para o site subir: sem CRM
 * configurado o lead é gravado no log de auditoria e o formulário responde
 * normalmente ao visitante — perder o lead porque um segredo não foi
 * preenchido seria pior que entregar sem integração.
 *
 * O que **não** pode acontecer é uma variável existir malformada: aí o parse
 * falha no boot, e não no primeiro lead que chega do Meta Ads.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /** Endpoint do Método CRM que recebe o lead. */
  CRM_WEBHOOK_URL: z.url().optional(),
  /** Segredo do HMAC-SHA256 do corpo enviado ao CRM. Rotacionável. */
  LEAD_WEBHOOK_SECRET: z.string().min(32).optional(),

  /** Meta CAPI — mesmo par usado no Método CRM, para atribuição consistente. */
  META_PIXEL_ID: z.string().min(1).optional(),
  META_CAPI_TOKEN: z.string().min(1).optional(),
  META_TEST_EVENT_CODE: z.string().min(1).optional(),

  /** Supabase (projeto próprio deste site). Ver supabase/migrations/. */
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  /** Teto de leads por IP por janela, no middleware. */
  RATE_LIMIT_LEADS_POR_MINUTO: z.coerce.number().int().positive().default(5),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Variáveis de ambiente inválidas:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;

export const crmConfigurado = Boolean(env.CRM_WEBHOOK_URL && env.LEAD_WEBHOOK_SECRET);
export const capiConfigurada = Boolean(env.META_PIXEL_ID && env.META_CAPI_TOKEN);
export const supabaseConfigurado = Boolean(
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
);
