import 'server-only';

import { forbidden, notFound } from '@/lib/errors';
import type { SessionUser } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';

/**
 * Favoritos, notificações e conversas
 * ===================================
 *
 * Três superfícies pequenas que compartilham a mesma regra de autorização:
 * **o registro pertence a quem está pedindo, ou não existe**. Ficam juntas
 * porque separá-las em três arquivos de trinta linhas espalharia essa regra
 * sem ganho nenhum.
 */

// ---------------------------------------------------------------------------
// Favoritos
// ---------------------------------------------------------------------------

/**
 * Alterna o favorito.
 *
 * `deleteMany`/`create` em vez de `upsert` porque o par único envolve uma
 * coluna nula (produto **ou** profissional), e `NULL` não participa de índice
 * único no Postgres da forma que o `upsert` esperaria.
 *
 * Devolve o novo estado para que a interface não precise recarregar a página.
 */
export async function toggleFavorite(
  user: SessionUser,
  target_: { productId: string } | { professionalProfileId: string },
): Promise<{ favorited: boolean }> {
  const where =
    'productId' in target_
      ? { userId: user.id, productId: target_.productId }
      : { userId: user.id, professionalProfileId: target_.professionalProfileId };

  const existing = await prisma.favorite.findFirst({ where, select: { id: true } });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }

  await prisma.favorite.create({ data: where });
  return { favorited: true };
}

export async function listFavorites(userId: string) {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    select: {
      id: true,
      createdAt: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          priceCents: true,
          coverImageUrl: true,
          status: true,
          ratingSum: true,
          ratingCount: true,
          author: { select: { name: true } },
        },
      },
      professional: {
        select: {
          id: true,
          slug: true,
          headline: true,
          startingAtCents: true,
          specialties: true,
          ratingSum: true,
          ratingCount: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    // Produto arquivado depois de favoritado continua na lista mas some da
    // vitrine: mostrá-lo levaria a uma página 404 a partir do próprio painel.
    products: rows.filter((row) => row.product?.status === 'PUBLISHED').map((row) => row.product!),
    professionals: rows.filter((row) => row.professional).map((row) => row.professional!),
  };
}

/** Ids favoritados, para marcar os cards da listagem numa consulta só. */
export async function favoriteProductIds(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();

  const rows = await prisma.favorite.findMany({
    where: { userId, productId: { not: null } },
    select: { productId: true },
  });

  return new Set(rows.map((row) => row.productId!).filter(Boolean));
}

// ---------------------------------------------------------------------------
// Notificações
// ---------------------------------------------------------------------------

export async function listNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    select: { id: true, type: true, title: true, body: true, href: true, readAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/**
 * Marca como lida.
 *
 * O `userId` entra no `where` do `updateMany` em vez de virar um `findUnique`
 * seguido de checagem: a autorização vira parte da condição de escrita, e não
 * há como executar a escrita sem ela.
 */
export async function markNotificationRead(user: SessionUser, notificationId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(user: SessionUser): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Conversas
// ---------------------------------------------------------------------------

/**
 * Conversas do usuário, com a última mensagem.
 *
 * `take: 1` na relação de mensagens resolve a prévia sem trazer o histórico
 * inteiro de cada conversa — o padrão que, esquecido, transforma a caixa de
 * entrada na página mais lenta do produto.
 */
export async function listConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    select: {
      id: true,
      subject: true,
      updatedAt: true,
      members: {
        where: { userId: { not: userId } },
        select: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      messages: {
        select: { body: true, createdAt: true, senderId: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Uma conversa, com as mensagens.
 *
 * A checagem de participação vem **antes** de qualquer leitura de mensagem: um
 * id de conversa adivinhado não pode devolver conteúdo de terceiros. Responde
 * `notFound` em vez de `forbidden` para não confirmar que o id existe.
 */
export async function getConversation(user: SessionUser, conversationId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    select: { conversationId: true },
  });

  if (!membership) throw notFound('Conversa não encontrada.');

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      subject: true,
      demandId: true,
      members: { select: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      messages: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
      },
    },
  });

  if (!conversation) throw notFound('Conversa não encontrada.');

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    data: { lastReadAt: new Date() },
  });

  return conversation;
}

export async function sendMessage(
  user: SessionUser,
  conversationId: string,
  body: string,
): Promise<void> {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    select: { conversationId: true },
  });

  if (!membership) throw forbidden('Você não participa desta conversa.');

  const recipients = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { not: user.id } },
    select: { userId: true },
  });

  await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId: user.id, body } }),
    // `updatedAt` da conversa é o que ordena a caixa de entrada; sem este
    // toque explícito, a conversa com mensagem nova ficaria no fim da lista.
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        userId: recipient.userId,
        type: 'MESSAGE_RECEIVED' as const,
        title: `Nova mensagem de ${user.name}`,
        body: body.slice(0, 140),
        href: `/messages/${conversationId}`,
      })),
    }),
  ]);
}

/**
 * Abre (ou reencontra) a conversa entre duas pessoas.
 *
 * Reencontrar importa: sem isso, cada clique em "enviar mensagem" cria uma
 * conversa nova e o histórico se fragmenta em dezenas de threads vazias.
 */
export async function openDirectConversation(
  user: SessionUser,
  otherUserId: string,
  subject?: string,
): Promise<string> {
  if (otherUserId === user.id) throw forbidden('Você não pode iniciar uma conversa consigo.');

  const existing = await prisma.conversation.findFirst({
    where: {
      demandId: null,
      AND: [{ members: { some: { userId: user.id } } }, { members: { some: { userId: otherUserId } } }],
    },
    select: { id: true, members: { select: { userId: true } } },
  });

  // A busca acima encontra conversas que contenham os dois; o filtro abaixo
  // garante que seja a conversa **só** dos dois, e não um grupo maior.
  if (existing && existing.members.length === 2) return existing.id;

  const created = await prisma.conversation.create({
    data: {
      subject: subject ?? null,
      members: { create: [{ userId: user.id }, { userId: otherUserId }] },
    },
    select: { id: true },
  });

  return created.id;
}

/**
 * Destinatário válido para iniciar uma conversa.
 *
 * Confirma que a conta existe e está ativa antes de a tela oferecer o
 * formulário. Sem isso, a pessoa escreve a mensagem inteira e só descobre no
 * envio que o perfil saiu do ar.
 */
export async function findMessageRecipient(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, status: 'ACTIVE', deletedAt: null },
    select: {
      id: true,
      name: true,
      professionalProfile: { select: { headline: true, responseHours: true } },
    },
  });
}
