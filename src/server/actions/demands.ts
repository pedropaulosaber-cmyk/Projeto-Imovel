'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { cuidSchema, demandInputSchema, proposalInputSchema } from '@/lib/validation';
import { requireRole, requireUser } from '@/server/auth/authorize';
import { enforce } from '@/server/ratelimit';
import { closeDemand, createDemand } from '@/server/services/demands';
import {
  acceptProposal,
  rejectProposal,
  submitProposal,
  withdrawProposal,
} from '@/server/services/proposals';
import { type ActionResult, formToObject, parseList, runAction } from './action';

/**
 * Ações de demandas e propostas.
 *
 * ## Papel exigido em cada ponta
 *
 * Publicar demanda é ação de comprador (qualquer conta tem o papel `BUYER`).
 * Enviar proposta exige `PROFESSIONAL` — e a checagem está aqui, no servidor,
 * porque esconder o botão no cliente não impede um POST direto.
 */

/**
 * Converte reais digitados em centavos inteiros.
 *
 * Acontece no servidor porque é onde a unidade do domínio é decidida. Devolve
 * `NaN` para entrada inválida em vez de `0`: zero passaria pelo schema como um
 * orçamento legítimo de R$ 0,00, e `NaN` é rejeitado com mensagem de campo.
 */
function reaisToCents(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN;
}

export async function createDemandAction(
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  const user = await requireUser();
  const raw = formToObject(formData);

  const result = await runAction(
    demandInputSchema,
    {
      ...raw,
      tools: parseList(raw.tools),
      budgetMinCents: reaisToCents(raw.budgetMinReais),
      budgetMaxCents: reaisToCents(raw.budgetMaxReais),
    },
    async (data) => {
      await enforce('write', user.id);
      return createDemand(user, data);
    },
  );

  if (!result.ok) return result;

  revalidatePath('/demands');
  redirect(`/demands/${result.data}`);
}

export async function submitProposalAction(
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  // `requireRole` já barra conta suspensa e conta sem o papel — as duas
  // condições que a interface esconde mas que um POST direto tentaria.
  const user = await requireRole('PROFESSIONAL');

  const raw = formToObject(formData);

  const result = await runAction(
    proposalInputSchema,
    { ...raw, amountCents: reaisToCents(raw.amountReais) },
    async (data) => {
      await enforce('write', user.id);
      await submitProposal(user, data);
      revalidatePath(`/demands/${data.demandId}`);
    },
  );

  return result as ActionResult<never>;
}

export async function acceptProposalAction(proposalId: string): Promise<ActionResult<{ conversationId: string }>> {
  const user = await requireUser();

  return runAction(z.object({ proposalId: cuidSchema }), { proposalId }, async (data) => {
    const conversationId = await acceptProposal(user, data.proposalId);
    revalidatePath('/demands');
    return { conversationId };
  });
}

export async function rejectProposalAction(proposalId: string): Promise<ActionResult<null>> {
  const user = await requireUser();

  return runAction(z.object({ proposalId: cuidSchema }), { proposalId }, async (data) => {
    await rejectProposal(user, data.proposalId);
    revalidatePath('/demands');
    return null;
  });
}

export async function withdrawProposalAction(proposalId: string): Promise<ActionResult<null>> {
  const user = await requireUser();

  return runAction(z.object({ proposalId: cuidSchema }), { proposalId }, async (data) => {
    await withdrawProposal(user, data.proposalId);
    revalidatePath('/dashboard/proposals');
    return null;
  });
}

export async function closeDemandAction(demandId: string): Promise<ActionResult<null>> {
  const user = await requireUser();

  return runAction(z.object({ demandId: cuidSchema }), { demandId }, async (data) => {
    await closeDemand(user, data.demandId);
    revalidatePath(`/demands/${data.demandId}`);
    return null;
  });
}
