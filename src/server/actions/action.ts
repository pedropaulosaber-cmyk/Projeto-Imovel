import 'server-only';

import { headers } from 'next/headers';
import { z } from 'zod';

import { isAppError, publicMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { fieldErrorsFrom } from '@/lib/validation';

/**
 * Server Actions — contrato comum
 * ===============================
 *
 * ## O formato de retorno
 *
 * Toda ação devolve `{ ok: true, data }` ou `{ ok: false, message, fieldErrors }`.
 * Uniforme de propósito: o formulário renderiza o erro do mesmo jeito em toda
 * tela, e ninguém precisa lembrar qual ação lança e qual devolve.
 *
 * ## Erro esperado nunca vira 500
 *
 * `AppError` (senha errada, permissão negada, limite de taxa) é fluxo normal e
 * vira `{ ok: false }` com a mensagem escrita para quem lê. Qualquer outro
 * erro é falha de verdade: vai para o log com pilha e devolve mensagem
 * genérica, porque a mensagem de um erro de driver de banco contém nome de
 * tabela e trecho de query.
 *
 * ## Por que não `throw` direto na ação
 *
 * Uma exceção não tratada numa Server Action leva o usuário ao `error.tsx`, o
 * que joga fora o que ele digitou. Para erro de validação isso é inaceitável —
 * a pessoa preencheu dez campos e perde tudo por um e-mail malformado.
 */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export const actionOk = <T>(data: T): ActionResult<T> => ({ ok: true, data });

/**
 * Envolve o corpo da ação com validação e tratamento de erro.
 *
 * O schema roda **aqui**, no servidor, sempre. A validação equivalente no
 * cliente é conveniência de interface; esta é a que protege.
 */
export async function runAction<TSchema extends z.ZodTypeAny, TResult>(
  schema: TSchema,
  input: unknown,
  handler: (data: z.infer<TSchema>) => Promise<TResult>,
): Promise<ActionResult<TResult>> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Confira os campos destacados.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    return actionOk(await handler(parsed.data));
  } catch (error) {
    if (isAppError(error)) {
      return {
        ok: false,
        message: error.message,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      };
    }

    logger.error('Falha inesperada em Server Action', error);
    return { ok: false, message: publicMessage(error) };
  }
}

/**
 * Converte `FormData` em objeto simples.
 *
 * Campos repetidos (checkbox, múltipla escolha) viram array; o resto vira
 * string. Sem isto, `Object.fromEntries` mantém só o último valor de cada
 * campo repetido — e o defeito aparece como "só a última tag foi salva".
 *
 * Arquivo é descartado: upload passa por URL assinada, não pelo corpo da ação.
 */
export function formToObject(formData: FormData): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;

    const existing = output[key];
    if (existing === undefined) output[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else output[key] = [existing, value];
  }

  return output;
}

/**
 * Lista a partir de um campo de texto separado por vírgula.
 *
 * As tags do formulário chegam como "n8n, OpenAI, HubSpot". Normalizar num
 * lugar só evita que metade das telas grave `" OpenAI"` com espaço à esquerda.
 */
export function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== 'string') return [];

  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

/** Dados da requisição para limite de taxa e registro de sessão. */
export async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const headerList = await headers();

  return {
    // Atrás de um proxy confiável (Vercel, Cloudflare) este header é
    // reescrito e confiável. Fora disso, o cliente controla — por isso serve
    // para limitar e correlacionar, nunca para autorizar.
    ip: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: headerList.get('user-agent'),
  };
}
