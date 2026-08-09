import 'server-only';

import { conflict, forbidden, notFound } from '@/lib/errors';
import { audit, target } from '@/server/audit';
import type { SessionUser } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';
import { hasPurchased } from './orders';
import { recomputeProductStats } from './products';

/**
 * Avaliações
 * ==========
 *
 * ## Só quem comprou avalia
 *
 * É a única regra que separa uma nota com significado de um número decorativo.
 * Sem ela, o marketplace ganha em poucas semanas duas patologias conhecidas:
 * concorrente derrubando produto alheio com nota 1, e vendedor inflando o
 * próprio com contas descartáveis.
 *
 * A verificação consulta o histórico de **pedidos pagos** — não um campo
 * "verificado" que alguém possa marcar, e não a sessão do usuário.
 *
 * ## Uma avaliação por pessoa
 *
 * Garantida pelo banco (`@@unique([productId, authorId])`), não pela aplicação.
 * Reavaliar edita a nota existente; a média se recalcula na mesma transação.
 */

type ReviewInput = { productId: string; rating: number; comment: string };

export async function upsertReview(user: SessionUser, input: ReviewInput): Promise<void> {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, deletedAt: null },
    select: { id: true, name: true, slug: true, authorId: true },
  });

  if (!product) throw notFound('Produto não encontrado.');

  if (product.authorId === user.id) {
    throw forbidden('Você não pode avaliar o próprio produto.');
  }

  const bought = await hasPurchased(user.id, product.id);
  if (!bought) {
    throw forbidden('Só quem comprou este produto pode avaliá-lo.');
  }

  const isNew = await prisma.$transaction(async (tx) => {
    const existing = await tx.review.findUnique({
      where: { productId_authorId: { productId: product.id, authorId: user.id } },
      select: { id: true },
    });

    if (existing) {
      await tx.review.update({
        where: { id: existing.id },
        data: { rating: input.rating, comment: input.comment },
      });
    } else {
      await tx.review.create({
        data: {
          productId: product.id,
          authorId: user.id,
          rating: input.rating,
          comment: input.comment,
        },
      });
    }

    // Dentro da mesma transação: a média desnormalizada nunca pode descrever
    // um conjunto de avaliações diferente do que está gravado.
    await recomputeProductStats(tx, product.id);

    return existing === null;
  });

  if (isNew) {
    await prisma.notification.create({
      data: {
        userId: product.authorId,
        type: 'REVIEW_RECEIVED',
        title: 'Nova avaliação',
        body: `${user.name} avaliou ${product.name} com ${input.rating} estrela${input.rating > 1 ? 's' : ''}.`,
        href: `/products/${product.slug}`,
      },
    });
  }
}

/** Resposta do criador a uma avaliação. Uma por avaliação. */
export async function respondToReview(
  user: SessionUser,
  reviewId: string,
  body: string,
): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, product: { select: { authorId: true } } },
  });

  if (!review) throw notFound('Avaliação não encontrada.');

  if (review.product.authorId !== user.id) {
    throw forbidden('Só o autor do produto pode responder à avaliação.');
  }

  await prisma.reviewResponse.upsert({
    where: { reviewId: review.id },
    create: { reviewId: review.id, authorId: user.id, body },
    update: { body },
  });
}

/** Avaliações de um produto, paginadas. */
export async function listProductReviews(productId: string, page = 1, pageSize = 10) {
  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: { productId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: { id: true, name: true, avatarUrl: true } },
        response: { select: { body: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.review.count({ where: { productId } }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/**
 * Distribuição das notas (quantas de 5, de 4…).
 *
 * `groupBy` no banco em vez de contar em JavaScript: são cinco linhas de
 * resultado independentemente de o produto ter dez ou dez mil avaliações.
 */
export async function ratingBreakdown(productId: string): Promise<Record<1 | 2 | 3 | 4 | 5, number>> {
  const rows = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId },
    _count: { _all: true },
  });

  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) {
    const key = row.rating as 1 | 2 | 3 | 4 | 5;
    if (key >= 1 && key <= 5) breakdown[key] = row._count._all;
  }

  return breakdown;
}

/** Se o usuário pode avaliar, e o que já escreveu. Alimenta a interface. */
export async function reviewEligibility(userId: string | null, productId: string) {
  if (!userId) return { canReview: false, existing: null };

  const [bought, existing] = await Promise.all([
    hasPurchased(userId, productId),
    prisma.review.findUnique({
      where: { productId_authorId: { productId, authorId: userId } },
      select: { id: true, rating: true, comment: true },
    }),
  ]);

  return { canReview: bought, existing };
}

/** Remoção por moderação. Recalcula a média junto. */
export async function removeReview(admin: SessionUser, reviewId: string): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, productId: true },
  });

  if (!review) throw notFound('Avaliação não encontrada.');

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: review.id } });
    await recomputeProductStats(tx, review.productId);
  });

  await audit({
    action: 'review.removed',
    target: target('review', review.id),
    actorId: admin.id,
    metadata: { productId: review.productId },
  });
}

/** Impede resposta duplicada quando o criador já respondeu. */
export async function hasResponded(reviewId: string): Promise<boolean> {
  const found = await prisma.reviewResponse.findUnique({
    where: { reviewId },
    select: { id: true },
  });
  if (found) throw conflict('Você já respondeu a esta avaliação.');
  return false;
}
