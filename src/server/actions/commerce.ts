'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { integrationUnavailable } from '@/lib/errors';
import { cuidSchema, reviewInputSchema } from '@/lib/validation';
import { createCheckoutSession, paymentsAvailable } from '@/server/payments/stripe';
import { requireUser } from '@/server/auth/authorize';
import { prisma } from '@/server/db/prisma';
import { enforce } from '@/server/ratelimit';
import { issueDownload } from '@/server/services/downloads';
import { toggleFavorite } from '@/server/services/engagement';
import { createDraftOrder } from '@/server/services/orders';
import { upsertReview } from '@/server/services/reviews';
import { type ActionResult, actionOk, formToObject, runAction } from './action';

/**
 * Ações de comércio: comprar, avaliar, favoritar, baixar.
 *
 * ## O que estas ações recebem do cliente
 *
 * Um id. Nada mais. Preço, comissão, direito de acesso e propriedade são
 * resolvidos no servidor a partir desse id — é a regra que separa um
 * marketplace de uma vitrine que qualquer um edita pelo DevTools.
 */

/**
 * Inicia o checkout de um produto.
 *
 * Cria o pedido pendente (com o preço lido do banco) e devolve a URL do
 * provedor. O acesso ao arquivo **não** é liberado aqui: quem libera é o
 * webhook, depois da confirmação do pagamento.
 */
export async function startCheckoutAction(
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  const user = await requireUser();

  const result = await runAction(
    z.object({ productId: cuidSchema }),
    formToObject(formData),
    async (data) => {
      await enforce('checkout', user.id);

      const order = await createDraftOrder(user, data.productId);

      if (!paymentsAvailable) {
        // Sem credencial, a ação falha com uma frase honesta. Nada aqui
        // pretende ter processado um pagamento que não existiu.
        throw integrationUnavailable('pagamentos');
      }

      const session = await createCheckoutSession({
        orderId: order.orderId,
        orderNumber: order.number,
        productName: order.productName,
        amountCents: order.totalCents,
        currency: 'BRL',
        buyerEmail: user.email,
      });

      return session.url;
    },
  );

  if (!result.ok) return result;

  redirect(result.data);
}

export async function toggleFavoriteAction(
  productId: string,
): Promise<ActionResult<{ favorited: boolean }>> {
  const user = await requireUser();

  return runAction(z.object({ productId: cuidSchema }), { productId }, async (data) => {
    const state = await toggleFavorite(user, { productId: data.productId });
    revalidatePath('/favorites');
    return state;
  });
}

export async function submitReviewAction(
  _previous: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never>> {
  const user = await requireUser();

  const result = await runAction(reviewInputSchema, formToObject(formData), async (data) => {
    await upsertReview(user, data);

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { slug: true },
    });

    // Revalida a página do produto para que a nota nova apareça sem esperar o
    // ciclo de cache — a pessoa acabou de escrever e espera ver.
    if (product) revalidatePath(`/products/${product.slug}`);
  });

  return result as ActionResult<never>;
}

/**
 * Gera o link de download.
 *
 * A URL assinada é devolvida à ação e usada imediatamente pelo cliente; ela
 * nunca é gravada nem colocada num atributo `href` renderizado no HTML, que
 * ficaria no cache do navegador e no histórico.
 */
export async function requestDownloadAction(fileId: string): Promise<ActionResult<{ url: string }>> {
  const user = await requireUser();

  return runAction(z.object({ fileId: cuidSchema }), { fileId }, async (data) => {
    const { url } = await issueDownload(user, data.fileId);
    return { url };
  });
}

/** Marca notificações como lidas. */
export async function markAllReadAction(): Promise<ActionResult<null>> {
  const user = await requireUser();
  const { markAllNotificationsRead } = await import('@/server/services/engagement');
  await markAllNotificationsRead(user);
  revalidatePath('/notifications');
  return actionOk(null);
}
