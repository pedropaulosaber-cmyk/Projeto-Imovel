'use server';

import { redirect } from 'next/navigation';

import { loginSchema, registerSchema } from '@/lib/validation';
import { authenticate, registerAccount } from '@/server/services/accounts';
import { destroySession } from '@/server/auth/session';
import { type ActionResult, formToObject, requestMeta, runAction } from './action';

/**
 * Ações de autenticação.
 *
 * ## O `next` é validado antes de virar redirecionamento
 *
 * O parâmetro que devolve a pessoa para onde ela tentava ir é um vetor de
 * *open redirect*: `?next=https://site-falso.com` faria a aplicação mandar o
 * usuário recém-logado para fora, num domínio que copia a nossa aparência e
 * pede a senha de novo.
 *
 * `safeRedirect` só aceita caminho interno começando por `/` e recusa `//`,
 * que o navegador interpreta como protocolo relativo e leva para outro host.
 */

function safeRedirect(next: unknown): string {
  if (typeof next !== 'string') return '/dashboard';
  if (!next.startsWith('/')) return '/dashboard';
  if (next.startsWith('//')) return '/dashboard';
  return next;
}

export async function loginAction(
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  const raw = formToObject(formData);

  const result = await runAction(loginSchema, raw, async (data) => {
    await authenticate(data, await requestMeta());
  });

  if (!result.ok) return result;

  // `redirect` lança internamente para interromper o render — por isso fica
  // **fora** do `runAction`, que capturaria essa exceção e a trataria como
  // falha, deixando o usuário logado mas parado na tela de login.
  redirect(safeRedirect(raw.next));
}

export async function registerAction(
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  const raw = formToObject(formData);

  const result = await runAction(registerSchema, raw, async (data) => {
    await registerAccount(data, await requestMeta());
  });

  if (!result.ok) return result;

  redirect(safeRedirect(raw.next));
}

export async function logoutAction(): Promise<never> {
  await destroySession();
  redirect('/');
}
