import 'server-only';

import { randomInt } from 'node:crypto';

import { env } from '@/config/env';
import { conflict, notFound, validationFailed } from '@/lib/errors';
import { splitPayment } from '@/lib/money';
import { audit, target } from '@/server/audit';
import type { SessionUser } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';
import type { Prisma } from '@/generated/prisma/client';

/**
 * Pedidos e direito de acesso
 * ===========================
 *
 * ## A regra que não se negocia
 *
 * O preço vem do **banco**, no momento da criação do pedido. O cliente envia
 * o id do produto e nada mais. Não existe caminho neste arquivo que leia valor
 * vindo do navegador — é a diferença entre um marketplace e uma doação.
 *
 * O mesmo vale para a comissão: sai de `PLATFORM_FEE_BPS`, uma variável de
 * ambiente do servidor, e é congelada no item do pedido. Congelar importa
 * porque a comissão pode mudar amanhã e o repasse de ontem não pode mudar
 * junto.
 *
 * ## Por que o pedido nasce PENDING
 *
 * Criar o pedido antes de cobrar dá um identificador estável para correlacionar
 * com o provedor de pagamento. O acesso ao arquivo só aparece quando o webhook
 * confirma — e o webhook é a única fonte de verdade sobre pagamento. Confiar no
 * retorno do navegador ("voltei da página de sucesso, logo paguei") é o erro
 * que transforma o checkout numa loja grátis.
 */

/**
 * Número legível do pedido: `AUT-7F3K2M`.
 *
 * Sem sequência incremental de propósito — ela revelaria o volume de vendas da
 * plataforma para qualquer um que fizesse duas compras e subtraísse os números.
 */
function generateOrderNumber(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I, O, 0, 1
  let suffix = '';
  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[randomInt(alphabet.length)];
  }
  return `AUT-${suffix}`;
}

export type DraftOrder = {
  orderId: string;
  number: string;
  totalCents: number;
  feeCents: number;
  productName: string;
};

/**
 * Cria o pedido pendente para um produto.
 *
 * Devolve o pedido já existente quando há um pendente idêntico: um duplo
 * clique no botão de comprar não deve gerar dois pedidos, e o usuário não
 * precisa entender por quê.
 */
export async function createDraftOrder(buyer: SessionUser, productId: string): Promise<DraftOrder> {
  const product = await prisma.product.findFirst({
    where: { id: productId, status: 'PUBLISHED', deletedAt: null },
    select: { id: true, name: true, priceCents: true, currency: true, authorId: true },
  });

  // Produto não publicado responde "não encontrado", e não "não está à venda":
  // a segunda mensagem confirma que o id existe.
  if (!product) throw notFound('Produto não encontrado.');

  if (product.authorId === buyer.id) {
    throw validationFailed('Você não pode comprar o próprio produto.');
  }

  const alreadyOwns = await hasPurchased(buyer.id, product.id);
  if (alreadyOwns) throw conflict('Você já tem este produto na sua biblioteca.');

  const existingPending = await prisma.order.findFirst({
    where: { buyerId: buyer.id, status: 'PENDING', items: { some: { productId: product.id } } },
    select: { id: true, number: true, totalCents: true, items: { select: { feeCents: true } } },
  });

  if (existingPending) {
    return {
      orderId: existingPending.id,
      number: existingPending.number,
      totalCents: existingPending.totalCents,
      feeCents: existingPending.items[0]?.feeCents ?? 0,
      productName: product.name,
    };
  }

  const split = splitPayment(product.priceCents, env.PLATFORM_FEE_BPS);

  const order = await prisma.order.create({
    data: {
      number: generateOrderNumber(),
      buyerId: buyer.id,
      status: 'PENDING',
      subtotalCents: split.totalCents,
      feeCents: split.feeCents,
      totalCents: split.totalCents,
      currency: product.currency,
      items: {
        create: {
          productId: product.id,
          // Nome e preço copiados: o histórico do comprador não pode mudar
          // porque o vendedor renomeou o produto depois.
          productName: product.name,
          unitPriceCents: product.priceCents,
          feeCents: split.feeCents,
          quantity: 1,
        },
      },
    },
    select: { id: true, number: true, totalCents: true, feeCents: true },
  });

  return {
    orderId: order.id,
    number: order.number,
    totalCents: order.totalCents,
    feeCents: order.feeCents,
    productName: product.name,
  };
}

/**
 * Marca o pedido como pago. **Só o webhook chama isto.**
 *
 * Idempotente por construção: se o pedido já está `PAID`, devolve sem efeito.
 * O provedor reenvia eventos por design — em timeout, em retry, em replay
 * manual do painel — e a segunda entrega não pode creditar a venda de novo,
 * nem incrementar o contador do produto duas vezes.
 */
export async function markOrderPaid(
  orderId: string,
  payment: { providerRef: string; amountCents: number; raw?: unknown },
): Promise<{ alreadyProcessed: boolean }> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        buyerId: true,
        totalCents: true,
        number: true,
        items: { select: { productId: true, productName: true } },
      },
    });

    if (!order) throw notFound('Pedido não encontrado.');
    if (order.status === 'PAID') return { alreadyProcessed: true };

    // O valor confirmado pelo provedor tem de bater com o que o servidor
    // cobrou. Divergência aqui significa adulteração no meio do caminho ou
    // bug na integração; nos dois casos, creditar seria pior que falhar.
    if (payment.amountCents !== order.totalCents) {
      throw conflict(
        `Valor divergente no pagamento do pedido ${order.number}: ` +
          `esperado ${order.totalCents}, recebido ${payment.amountCents}.`,
      );
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        status: 'SUCCEEDED',
        providerRef: payment.providerRef,
        amountCents: payment.amountCents,
        rawEvent: (payment.raw ?? null) as Prisma.InputJsonValue,
      },
    });

    for (const item of order.items) {
      const product = await tx.product.update({
        where: { id: item.productId },
        data: { salesCount: { increment: 1 } },
        select: { authorId: true, name: true, slug: true },
      });

      await tx.notification.createMany({
        data: [
          {
            userId: order.buyerId,
            type: 'ORDER_PAID',
            title: 'Compra confirmada',
            body: `${item.productName} já está na sua biblioteca.`,
            href: '/library',
          },
          {
            userId: product.authorId,
            type: 'PRODUCT_SOLD',
            title: 'Você fez uma venda',
            body: `${product.name} foi vendido.`,
            href: '/dashboard/orders',
          },
        ],
      });
    }

    return { alreadyProcessed: false };
  });
}

/**
 * Direito de acesso ao produto.
 *
 * **A** pergunta de segurança da entrega digital: esta pessoa pagou por este
 * arquivo? Um pedido `PENDING` não conta — é justamente o estado de quem
 * iniciou o checkout e não pagou.
 */
export async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  const item = await prisma.orderItem.findFirst({
    where: { productId, order: { buyerId: userId, status: 'PAID' } },
    select: { id: true },
  });
  return item !== null;
}

/** Biblioteca do comprador: o que ele pagou, com o que dá para baixar. */
export async function listLibrary(userId: string) {
  const items = await prisma.orderItem.findMany({
    where: { order: { buyerId: userId, status: 'PAID' } },
    select: {
      id: true,
      productName: true,
      order: { select: { number: true, paidAt: true } },
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          coverImageUrl: true,
          status: true,
          updatedAt: true,
          author: { select: { name: true } },
          files: {
            select: { id: true, filename: true, sizeBytes: true, version: true, createdAt: true },
          },
        },
      },
    },
    orderBy: { order: { paidAt: 'desc' } },
  });

  return items;
}

/** Pedidos do comprador. */
export async function listBuyerOrders(userId: string) {
  return prisma.order.findMany({
    where: { buyerId: userId },
    select: {
      id: true,
      number: true,
      status: true,
      totalCents: true,
      createdAt: true,
      paidAt: true,
      items: { select: { productName: true, unitPriceCents: true, product: { select: { slug: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Vendas do criador.
 *
 * Devolve o **líquido** por item, não o bruto: é o número que o vendedor vai
 * receber, e mostrar o bruto no painel de receita gera a reclamação de sempre
 * no fim do mês.
 */
export async function listCreatorSales(authorId: string) {
  const items = await prisma.orderItem.findMany({
    where: { product: { authorId }, order: { status: 'PAID' } },
    select: {
      id: true,
      productName: true,
      unitPriceCents: true,
      feeCents: true,
      order: {
        select: {
          number: true,
          paidAt: true,
          buyer: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      product: { select: { id: true, slug: true } },
    },
    orderBy: { order: { paidAt: 'desc' } },
  });

  return items.map((item) => ({
    ...item,
    netCents: item.unitPriceCents - item.feeCents,
  }));
}

export type EarningsSummary = {
  grossCents: number;
  feeCents: number;
  netCents: number;
  salesCount: number;
  customerCount: number;
};

/**
 * Resumo financeiro do criador.
 *
 * Agregação no banco, não em JavaScript: somar em memória obriga a trazer
 * todas as linhas de venda para o servidor de aplicação, e isso deixa de
 * caber muito antes do que se imagina.
 */
export async function creatorEarnings(authorId: string): Promise<EarningsSummary> {
  const [totals, customers] = await prisma.$transaction([
    prisma.orderItem.aggregate({
      where: { product: { authorId }, order: { status: 'PAID' } },
      _sum: { unitPriceCents: true, feeCents: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { status: 'PAID', items: { some: { product: { authorId } } } },
      select: { buyerId: true },
      distinct: ['buyerId'],
    }),
  ]);

  const grossCents = totals._sum.unitPriceCents ?? 0;
  const feeCents = totals._sum.feeCents ?? 0;

  return {
    grossCents,
    feeCents,
    netCents: grossCents - feeCents,
    salesCount: totals._count._all,
    customerCount: customers.length,
  };
}

/** Registra o reembolso e revoga o acesso. */
export async function refundOrder(actorId: string, orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, number: true },
  });

  if (!order) throw notFound('Pedido não encontrado.');
  if (order.status !== 'PAID') throw conflict('Só é possível reembolsar um pedido pago.');

  await prisma.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } });
  await audit({
    action: 'order.refunded',
    target: target('order', order.id),
    actorId,
    metadata: { number: order.number },
  });
}
