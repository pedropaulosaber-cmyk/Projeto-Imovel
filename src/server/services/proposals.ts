import 'server-only';

import { conflict, forbidden, notFound, validationFailed } from '@/lib/errors';
import { audit, target } from '@/server/audit';
import { requireOwnership } from '@/server/auth/authorize';
import type { SessionUser } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';

/**
 * Propostas
 * =========
 *
 * ## Aceitar uma proposta é uma transação, não um update
 *
 * Aceitar significa quatro coisas ao mesmo tempo: marcar a escolhida, recusar
 * as concorrentes, fechar a demanda e abrir a conversa entre as partes. Se
 * qualquer uma falhar sozinha, o estado que sobra é incoerente — duas
 * propostas aceitas, ou uma demanda fechada sem vencedor.
 *
 * Por isso tudo acontece dentro de `$transaction`: ou o mundo inteiro muda, ou
 * nada muda.
 *
 * ## O contador na demanda
 *
 * `proposalCount` é desnormalizado e atualizado junto com a criação. A
 * listagem de demandas mostra "12 propostas" em cada card; fazer `COUNT` por
 * card é o N+1 clássico, e ele só aparece quando a plataforma já tem volume.
 */

type ProposalInput = {
  demandId: string;
  amountCents: number;
  deliveryDays: number;
  pitch: string;
  scope: string;
  notes?: string;
};

/**
 * Envia (ou atualiza) a proposta do profissional para uma demanda.
 *
 * Reenviar edita a proposta existente em vez de empilhar outra — a constraint
 * `@@unique([demandId, authorId])` no banco garante isso mesmo se dois cliques
 * chegarem juntos.
 */
export async function submitProposal(user: SessionUser, input: ProposalInput): Promise<string> {
  const [demand, profile] = await Promise.all([
    prisma.demand.findUnique({
      where: { id: input.demandId },
      select: { id: true, buyerId: true, status: true, title: true },
    }),
    prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }),
  ]);

  if (!demand) throw notFound('Demanda não encontrada.');

  if (!profile) {
    throw validationFailed('Crie seu perfil profissional antes de enviar propostas.');
  }

  if (demand.buyerId === user.id) {
    throw validationFailed('Você não pode propor para a própria demanda.');
  }

  if (demand.status !== 'OPEN' && demand.status !== 'IN_REVIEW') {
    throw conflict('Esta demanda não está mais recebendo propostas.');
  }

  const existing = await prisma.proposal.findUnique({
    where: { demandId_authorId: { demandId: demand.id, authorId: user.id } },
    select: { id: true, status: true },
  });

  if (existing?.status === 'ACCEPTED') {
    throw conflict('Sua proposta já foi aceita e não pode ser alterada.');
  }

  if (existing) {
    await prisma.proposal.update({
      where: { id: existing.id },
      data: {
        amountCents: input.amountCents,
        deliveryDays: input.deliveryDays,
        pitch: input.pitch,
        scope: input.scope,
        notes: input.notes ?? null,
        status: 'SENT',
      },
    });
    return existing.id;
  }

  const proposal = await prisma.$transaction(async (tx) => {
    const created = await tx.proposal.create({
      data: {
        demandId: demand.id,
        authorId: user.id,
        profileId: profile.id,
        amountCents: input.amountCents,
        deliveryDays: input.deliveryDays,
        pitch: input.pitch,
        scope: input.scope,
        notes: input.notes ?? null,
      },
      select: { id: true },
    });

    await tx.demand.update({
      where: { id: demand.id },
      data: { proposalCount: { increment: 1 } },
    });

    await tx.notification.create({
      data: {
        userId: demand.buyerId,
        type: 'PROPOSAL_RECEIVED',
        title: 'Nova proposta recebida',
        body: `${user.name} enviou uma proposta para "${demand.title}".`,
        href: `/demands/${demand.id}`,
      },
    });

    return created;
  });

  return proposal.id;
}

/**
 * Aceita a proposta. Só o dono da demanda.
 *
 * Recusa as concorrentes no mesmo movimento e abre a conversa — sem a
 * conversa, as duas partes acabam de fechar um negócio e não têm por onde se
 * falar dentro da plataforma, que é onde o registro precisa ficar.
 */
export async function acceptProposal(user: SessionUser, proposalId: string): Promise<string> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: {
      id: true,
      authorId: true,
      status: true,
      amountCents: true,
      demand: { select: { id: true, buyerId: true, title: true, status: true } },
    },
  });

  if (!proposal) throw notFound('Proposta não encontrada.');
  requireOwnership(user, proposal.demand.buyerId);

  if (proposal.status !== 'SENT') throw conflict('Esta proposta não está mais disponível.');
  if (proposal.demand.status === 'AWARDED' || proposal.demand.status === 'CLOSED') {
    throw conflict('Esta demanda já foi encerrada.');
  }

  const conversationId = await prisma.$transaction(async (tx) => {
    await tx.proposal.update({ where: { id: proposal.id }, data: { status: 'ACCEPTED' } });

    await tx.proposal.updateMany({
      where: { demandId: proposal.demand.id, id: { not: proposal.id }, status: 'SENT' },
      data: { status: 'REJECTED' },
    });

    await tx.demand.update({
      where: { id: proposal.demand.id },
      data: { status: 'AWARDED' },
    });

    await tx.professionalProfile.updateMany({
      where: { userId: proposal.authorId },
      data: { projectsClosed: { increment: 1 } },
    });

    const conversation = await tx.conversation.create({
      data: {
        subject: proposal.demand.title,
        demandId: proposal.demand.id,
        members: {
          create: [{ userId: proposal.demand.buyerId }, { userId: proposal.authorId }],
        },
      },
      select: { id: true },
    });

    await tx.notification.create({
      data: {
        userId: proposal.authorId,
        type: 'PROPOSAL_ACCEPTED',
        title: 'Sua proposta foi aceita',
        body: `${user.name} aceitou sua proposta para "${proposal.demand.title}".`,
        href: `/messages/${conversation.id}`,
      },
    });

    return conversation.id;
  });

  await audit({
    action: 'proposal.accepted',
    target: target('proposal', proposal.id),
    actorId: user.id,
    metadata: { demandId: proposal.demand.id, amountCents: proposal.amountCents },
  });

  return conversationId;
}

/** Recusa uma proposta específica, mantendo a demanda aberta. */
export async function rejectProposal(user: SessionUser, proposalId: string): Promise<void> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { id: true, status: true, demand: { select: { buyerId: true } } },
  });

  if (!proposal) throw notFound('Proposta não encontrada.');
  requireOwnership(user, proposal.demand.buyerId);
  if (proposal.status !== 'SENT') throw conflict('Esta proposta já foi respondida.');

  await prisma.proposal.update({ where: { id: proposal.id }, data: { status: 'REJECTED' } });
  await audit({
    action: 'proposal.rejected',
    target: target('proposal', proposal.id),
    actorId: user.id,
  });
}

/** O profissional retira a própria proposta. */
export async function withdrawProposal(user: SessionUser, proposalId: string): Promise<void> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { id: true, authorId: true, status: true },
  });

  if (!proposal) throw notFound('Proposta não encontrada.');
  if (proposal.authorId !== user.id) throw forbidden('Esta proposta não é sua.');
  if (proposal.status === 'ACCEPTED') throw conflict('Uma proposta aceita não pode ser retirada.');

  await prisma.proposal.update({ where: { id: proposal.id }, data: { status: 'WITHDRAWN' } });
}

/** Propostas enviadas pelo profissional, para o painel dele. */
export async function listOwnProposals(userId: string) {
  return prisma.proposal.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      amountCents: true,
      deliveryDays: true,
      status: true,
      createdAt: true,
      demand: {
        select: { id: true, title: true, status: true, budgetMinCents: true, budgetMaxCents: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
