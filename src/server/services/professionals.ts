import 'server-only';

import { notFound } from '@/lib/errors';
import { escapeLike, uniqueSlug } from '@/lib/text';
import type { SessionUser } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { z } from 'zod';
import { professionalProfileSchema, professionalQuerySchema } from '@/lib/validation';

/**
 * Profissionais
 * =============
 *
 * O diretório de quem constrói sob demanda. Espelha a estrutura de produtos —
 * lista filtrada e paginada, página de detalhe — porque as duas superfícies
 * têm o mesmo problema: muitos registros, busca por atributo, ordenação.
 *
 * A diferença que importa: perfil só aparece no diretório quando está
 * **completo o suficiente para ser contratado**. Um perfil recém-criado, sem
 * biografia nem preço, no meio da lista prejudica quem procura e o próprio
 * profissional, que recebe visita e nenhuma proposta.
 */

export const PROFESSIONALS_PAGE_SIZE = 18;

type ProfessionalQuery = z.infer<typeof professionalQuerySchema>;

const cardSelect = {
  id: true,
  slug: true,
  headline: true,
  specialties: true,
  tools: true,
  startingAtCents: true,
  availability: true,
  location: true,
  responseHours: true,
  ratingSum: true,
  ratingCount: true,
  projectsClosed: true,
  verifiedAt: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.ProfessionalProfileSelect;

export type ProfessionalCard = Prisma.ProfessionalProfileGetPayload<{ select: typeof cardSelect }>;

/**
 * O que torna um perfil listável.
 *
 * Biografia real (o texto-semente tem menos que isso), preço definido e conta
 * ativa. É o mínimo para que a página de detalhe responda às perguntas que
 * levam alguém a contratar.
 */
const listableScope: Prisma.ProfessionalProfileWhereInput = {
  startingAtCents: { gt: 0 },
  user: { status: 'ACTIVE', deletedAt: null },
};

export async function listProfessionals(query: ProfessionalQuery) {
  const where: Prisma.ProfessionalProfileWhereInput = { ...listableScope };

  if (query.q) {
    const term = escapeLike(query.q);
    where.OR = [
      { headline: { contains: term, mode: 'insensitive' } },
      { bio: { contains: term, mode: 'insensitive' } },
      { user: { name: { contains: term, mode: 'insensitive' } } },
      // `has` casa um elemento exato do array Postgres — é o operador certo
      // para `specialties`, e é indexável com GIN quando o volume pedir.
      { specialties: { has: query.q } },
    ];
  }

  if (query.specialty) where.specialties = { has: query.specialty };
  if (query.availability) where.availability = query.availability;
  if (query.maxRate !== undefined) where.startingAtCents = { gt: 0, lte: query.maxRate };

  const orderBy: Prisma.ProfessionalProfileOrderByWithRelationInput[] =
    query.sort === 'recent'
      ? [{ createdAt: 'desc' }]
      : query.sort === 'price_asc'
        ? [{ startingAtCents: 'asc' }]
        : [{ ratingCount: 'desc' }, { projectsClosed: 'desc' }];

  const [items, total] = await prisma.$transaction([
    prisma.professionalProfile.findMany({
      where,
      select: cardSelect,
      orderBy,
      skip: (query.page - 1) * PROFESSIONALS_PAGE_SIZE,
      take: PROFESSIONALS_PAGE_SIZE,
    }),
    prisma.professionalProfile.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / PROFESSIONALS_PAGE_SIZE)),
  };
}

export async function getProfessionalBySlug(slug: string) {
  return prisma.professionalProfile.findFirst({
    where: { slug, user: { deletedAt: null } },
    select: {
      ...cardSelect,
      bio: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
          profile: { select: { company: true, website: true } },
          // Produtos publicados do profissional: quem constrói sob demanda
          // muitas vezes também vende pronto, e ver os dois lados aumenta a
          // confiança de quem está decidindo contratar.
          products: {
            where: { status: 'PUBLISHED', deletedAt: null },
            select: {
              id: true,
              slug: true,
              name: true,
              tagline: true,
              priceCents: true,
              coverImageUrl: true,
              ratingSum: true,
              ratingCount: true,
            },
            take: 4,
            orderBy: { salesCount: 'desc' },
          },
        },
      },
      portfolio: {
        select: {
          id: true,
          title: true,
          summary: true,
          outcome: true,
          imageUrl: true,
          externalUrl: true,
        },
        orderBy: { position: 'asc' },
      },
      services: {
        select: { id: true, name: true, description: true, priceCents: true, deliveryDays: true },
        orderBy: { priceCents: 'asc' },
      },
    },
  });
}

/** Especialidades mais frequentes, para os chips de filtro. */
export async function popularSpecialties(limit = 12): Promise<string[]> {
  const profiles = await prisma.professionalProfile.findMany({
    where: listableScope,
    select: { specialties: true },
    take: 500,
  });

  const tally = new Map<string, number>();
  for (const profile of profiles) {
    for (const specialty of profile.specialties) {
      tally.set(specialty, (tally.get(specialty) ?? 0) + 1);
    }
  }

  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([specialty]) => specialty);
}

export async function getOwnProfessionalProfile(userId: string) {
  return prisma.professionalProfile.findUnique({
    where: { userId },
    select: {
      ...cardSelect,
      bio: true,
      portfolio: {
        select: { id: true, title: true, summary: true, outcome: true, position: true },
        orderBy: { position: 'asc' },
      },
      services: {
        select: { id: true, name: true, description: true, priceCents: true, deliveryDays: true },
      },
    },
  });
}

/**
 * Cria ou atualiza o perfil profissional do próprio usuário.
 *
 * `userId` vem da sessão, nunca do formulário — é o que impede alguém de
 * editar o perfil de outra pessoa trocando um campo escondido.
 */
export async function upsertProfessionalProfile(
  user: SessionUser,
  input: z.infer<typeof professionalProfileSchema>,
): Promise<void> {
  const existing = await prisma.professionalProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.professionalProfile.update({
      where: { id: existing.id },
      data: {
        headline: input.headline,
        bio: input.bio,
        specialties: input.specialties,
        tools: input.tools,
        startingAtCents: input.startingAtCents,
        availability: input.availability,
        location: input.location || null,
        responseHours: input.responseHours,
      },
    });
    return;
  }

  const slug = await uniqueSlug(user.name, async (candidate) => {
    const found = await prisma.professionalProfile.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return found !== null;
  });

  await prisma.professionalProfile.create({
    data: {
      userId: user.id,
      slug,
      headline: input.headline,
      bio: input.bio,
      specialties: input.specialties,
      tools: input.tools,
      startingAtCents: input.startingAtCents,
      availability: input.availability,
      location: input.location || null,
      responseHours: input.responseHours,
    },
  });
}

/** Item de portfólio do próprio perfil. */
export async function addPortfolioItem(
  user: SessionUser,
  input: { title: string; summary: string; outcome?: string; externalUrl?: string },
): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, _count: { select: { portfolio: true } } },
  });

  if (!profile) throw notFound('Crie seu perfil profissional primeiro.');

  await prisma.portfolioItem.create({
    data: {
      profileId: profile.id,
      title: input.title,
      summary: input.summary,
      outcome: input.outcome || null,
      externalUrl: input.externalUrl || null,
      position: profile._count.portfolio,
    },
  });
}

/**
 * Remove item do portfólio.
 *
 * `deleteMany` com o `profileId` no `where` é o detalhe que importa: um
 * `delete` por id sozinho apagaria o item de qualquer perfil, bastando
 * adivinhar o identificador. Aqui a condição de posse faz parte da própria
 * query, então não existe caminho sem ela.
 */
export async function removePortfolioItem(user: SessionUser, itemId: string): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) throw notFound();

  await prisma.portfolioItem.deleteMany({ where: { id: itemId, profileId: profile.id } });
}
