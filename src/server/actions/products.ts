'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { cuidSchema, moderationSchema, productInputSchema } from '@/lib/validation';
import { requireAdmin, requireRole } from '@/server/auth/authorize';
import { enforce } from '@/server/ratelimit';
import {
  archiveProduct,
  createProduct,
  moderateProduct,
  submitForReview,
  updateProduct,
} from '@/server/services/products';
import { type ActionResult, formToObject, parseList, runAction } from './action';

/**
 * Ações de produto.
 *
 * Publicar exige o papel `CREATOR`; moderar exige `ADMIN`. As duas checagens
 * ficam na primeira linha de cada ação, antes de qualquer leitura — barrar
 * cedo evita gastar consulta com quem não deveria estar aqui.
 *
 * A conversão de reais para centavos acontece aqui, no servidor, pelo mesmo
 * motivo do formulário de demanda: a unidade do domínio não pode depender de o
 * JavaScript do cliente ter rodado.
 */

function reaisToCents(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN;
}

export async function createProductAction(
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  const user = await requireRole('CREATOR');
  const raw = formToObject(formData);

  const result = await runAction(
    productInputSchema,
    {
      ...raw,
      priceCents: reaisToCents(raw.priceReais),
      requiredTools: parseList(raw.requiredTools),
      integrations: parseList(raw.integrations),
      tags: parseList(raw.tags),
    },
    async (data) => {
      await enforce('write', user.id);
      return createProduct(user, data);
    },
  );

  if (!result.ok) return result;

  revalidatePath('/dashboard/products');
  redirect('/dashboard/products');
}

export async function updateProductAction(
  productId: string,
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  const user = await requireRole('CREATOR');
  const raw = formToObject(formData);

  const result = await runAction(
    productInputSchema,
    {
      ...raw,
      priceCents: reaisToCents(raw.priceReais),
      requiredTools: parseList(raw.requiredTools),
      integrations: parseList(raw.integrations),
      tags: parseList(raw.tags),
    },
    async (data) => {
      await enforce('write', user.id);
      // `updateProduct` confere ownership lendo o autor do banco — o
      // `productId` vindo do cliente não autoriza nada sozinho.
      await updateProduct(user, productId, data);
    },
  );

  revalidatePath('/dashboard/products');
  return result as ActionResult<never>;
}

export async function submitForReviewAction(productId: string): Promise<ActionResult<null>> {
  const user = await requireRole('CREATOR');

  return runAction(z.object({ productId: cuidSchema }), { productId }, async (data) => {
    await submitForReview(user, data.productId);
    revalidatePath('/dashboard/products');
    return null;
  });
}

export async function archiveProductAction(productId: string): Promise<ActionResult<null>> {
  const user = await requireRole('CREATOR');

  return runAction(z.object({ productId: cuidSchema }), { productId }, async (data) => {
    await archiveProduct(user, data.productId);
    revalidatePath('/dashboard/products');
    return null;
  });
}

/** Decisão de moderação. Só administrador. */
export async function moderateProductAction(
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  const admin = await requireAdmin();

  const result = await runAction(moderationSchema, formToObject(formData), async (data) => {
    await moderateProduct(admin, data);
    revalidatePath('/admin');
    revalidatePath('/products');
  });

  return result as ActionResult<never>;
}
