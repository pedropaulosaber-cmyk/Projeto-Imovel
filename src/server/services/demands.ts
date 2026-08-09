import 'server-only';

import { conflict, notFound } from '@/lib/errors';
import { escapeLike } from '@/lib/text';
import { audit, target } from '@/server/audit';
import { requireOwnership } from '@/server/auth/authorize';
import type { SessionUser } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { z } from 'zod';
import { demandInputSchema, demandQuerySchema } from '@/lib/validation';

/**
 * Demandas
 * ========
 *
 * O lado inverso do marketplace: em vez de a empresa procurar um produto
 * pronto, ela descreve o problema e os profissionais se candidatam.
 *
 * A regra que estrutura este módulo: **quem publica a demanda vê tudo, quem
 * propõe vê só a própria proposta.** Sem isso, um profissional lê as propostas
 * dos concorrentes e dá um lance um real abaixo — o que destrói o mercado para
 * todos os profissionais sérios em algumas semanas.
 */

export const DEMANDS_PAGE_SIZE = 20;

type DemandQuery = z.infer<typeof demandQuerySchema>;

const demandCardSelect = {
  id: true,
  title: true,
  problem: true,
  status: true,
  tools: true,
  budgetMinCents: true,
  budgetMaxCents: true,
  deadlineDays: true,
  proposalCount: true,
  createdAt: true,
  buyer: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.DemandSelect;

export type DemandCard = Prisma.DemandGetPayload<{ select: typeof demandCardSelect }>;

export async function listDemands(query: DemandQuery) {
  const where: Prisma.DemandWhereInput = {};

  if (query.status) where.status = query.status;
  else where.status = { in: ['OPEN', 'IN_REVIEW'] };

  if (query.q) {
    const term = escapeLike(query.q);
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { problem: { contains: term, mode: 'insensitive' } },
    ];
  }

  if (query.minBudget !== undefined) where.budgetMaxCents = { gte: query.minBudget };

  const orderBy: Prisma.DemandOrderByWithRelationInput[] =
    query.sort === 'budget_desc'
      ? [{ budgetMaxCents: 'desc' }]
      : query.sort === 'proposals'
        ? [{ proposalCount: 'desc' }]
        : [{ createdAt: 'desc' }];

  const [items, total] = await prisma.$transaction([
    prisma.demand.findMany({
      where,
      select: demandCardSelect,
      orderBy,
      skip: (query.page - 1) * DEMANDS_PAGE_SIZE,
      take: DEMANDS_PAGE_SIZE,
    }),
    prisma.demand.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / DEMANDS_PAGE_SIZE)),
  };
}

/**
 * Demanda com as propostas que o visitante tem direito de ver.
 *
 * A filtragem acontece **na query**, não depois em JavaScript. Filtrar depois
 * significa que os dados dos concorrentes chegaram ao servidor de renderização
 * — e de lá para uma prop serializada no HTML é um descuido de distância.
 */
export async function getDemand(id: string, viewer: SessionUser | null) {
  const demand = await prisma.demand.findUnique({
    where: { id },
    select: {
      ...demandCardSelect,
      goal: true,
      updatedAt: true,
      closedAt: true,
      buyerId: true,
    },
  });

  if (!demand) return null;

  const isOwner = viewer?.id === demand.buyerId;
  const isAdmin = viewer?.roles.includes('ADMIN') ?? false;

  const proposals = await prisma.proposal.findMany({
    where: {
      demandId: id,
      // O dono da demanda vê todas; qualquer outra pessoa vê só as suas.
      ...(isOwner || isAdmin ? {} : viewer ? { authorId: viewer.id } : { id: '__nenhuma__' }),
    },
    select: {
      id: true,
      amountCents: true,
      deliveryDays: true,
      pitch: true,
      scope: true,
      status: true,
      createdAt: true,
      authorId: true,
      profile: {
        select: {
          slug: true,
          headline: true,
          ratingSum: true,
          ratingCount: true,
          projectsClosed: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return { ...demand, proposals, canManage: isOwner || isAdmin };
}

export async function createDemand(
  user: SessionUser,
  input: z.infer<typeof demandInputSchema>,
): Promise<string> {
  const demand = await prisma.demand.create({
    data: {
      buyerId: user.id,
      title: input.title,
      problem: input.problem,
      goal: input.goal,
      categoryId: input.categoryId ?? null,
      tools: input.tools,
      budgetMinCents: input.budgetMinCents,
      budgetMaxCents: input.budgetMaxCents,
      deadlineDays: input.deadlineDays,
    },
    select: { id: true },
  });

  return demand.id;
}

export async function closeDemand(user: SessionUser, demandId: string): Promise<void> {
  const demand = await prisma.demand.findUnique({
    where: { id: demandId },
    select: { id: true, buyerId: true, status: true },
  });

  if (!demand) throw notFound('Demanda não encontrada.');
  requireOwnership(user, demand.buyerId);

  if (demand.status === 'CLOSED') throw conflict('Esta demanda já está encerrada.');

  await prisma.demand.update({
    where: { id: demandId },
    data: { status: 'CLOSED', closedAt: new Date() },
  });

  await audit({ action: 'demand.closed', target: target('demand', demandId), actorId: user.id });
}

/** Demandas publicadas pelo usuário, para o painel dele. */
export async function listOwnDemands(userId: string) {
  return prisma.demand.findMany({
    where: { buyerId: userId },
    select: { ...demandCardSelect, closedAt: true },
    orderBy: { createdAt: 'desc' },
  });
}
