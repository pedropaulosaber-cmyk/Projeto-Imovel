'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { cuidSchema, messageInputSchema } from '@/lib/validation';
import { requireUser } from '@/server/auth/authorize';
import { enforce } from '@/server/ratelimit';
import { openDirectConversation, sendMessage } from '@/server/services/engagement';
import { type ActionResult, formToObject, runAction } from './action';

export async function sendMessageAction(
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  const user = await requireUser();

  const result = await runAction(messageInputSchema, formToObject(formData), async (data) => {
    await enforce('write', user.id);
    // `sendMessage` confere participação na conversa antes de escrever — um id
    // adivinhado não coloca mensagem na thread de outra pessoa.
    await sendMessage(user, data.conversationId, data.body);
    revalidatePath(`/messages/${data.conversationId}`);
  });

  return result as ActionResult<never>;
}

/**
 * Abre (ou reencontra) a conversa direta, envia a primeira mensagem e leva
 * para ela.
 *
 * Os dois passos ficam na mesma ação porque, do ponto de vista de quem clica,
 * são um só: "falar com esta pessoa". Separar produziria a conversa vazia que
 * ninguém abre de novo quando o segundo passo falha.
 */
export async function openConversationAction(
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  const user = await requireUser();

  const result = await runAction(
    z.object({
      to: cuidSchema,
      subject: z.string().trim().max(140).optional(),
      body: z.string().trim().max(5_000).optional(),
    }),
    formToObject(formData),
    async (data) => {
      await enforce('write', user.id);

      const conversationId = await openDirectConversation(
        user,
        data.to,
        data.subject || undefined,
      );

      if (data.body) await sendMessage(user, conversationId, data.body);

      return conversationId;
    },
  );

  if (!result.ok) return result;

  redirect(`/messages/${result.data}`);
}
