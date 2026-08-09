import 'server-only';

import { createHash } from 'node:crypto';

import { headers } from 'next/headers';

import { env } from '@/config/env';
import { forbidden, notFound } from '@/lib/errors';
import { audit, target } from '@/server/audit';
import type { SessionUser } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';
import { enforce } from '@/server/ratelimit';
import { createDownloadUrl } from '@/server/storage';

/**
 * Entrega digital
 * ===============
 *
 * O caminho crítico do produto: é aqui que se decide se um arquivo pago vira
 * um link que circula em grupo de WhatsApp.
 *
 * A sequência é sempre a mesma, e a ordem importa:
 *
 *  1. **Limite de taxa** — antes de qualquer consulta cara.
 *  2. **O arquivo existe?**
 *  3. **Esta pessoa pagou por ele?** — consulta ao histórico de pedidos pagos,
 *     nunca a um campo que o cliente possa influenciar.
 *  4. **Assina** uma URL de vida curta.
 *  5. **Registra** o download.
 *
 * Nenhum passo é opcional e nenhum pode ser reordenado: assinar antes de
 * checar a compra é o defeito que entrega o catálogo inteiro para quem trocar
 * um id na URL.
 */

export async function issueDownload(
  user: SessionUser,
  fileId: string,
): Promise<{ url: string; filename: string }> {
  await enforce('download', user.id);

  const file = await prisma.productFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      storageKey: true,
      filename: true,
      product: { select: { id: true, name: true, authorId: true } },
    },
  });

  if (!file) throw notFound('Arquivo não encontrado.');

  // O autor baixa o próprio produto sem ter comprado — precisa disso para
  // conferir o que os compradores recebem.
  const isAuthor = file.product.authorId === user.id;

  if (!isAuthor) {
    const paidItem = await prisma.orderItem.findFirst({
      where: { productId: file.product.id, order: { buyerId: user.id, status: 'PAID' } },
      select: { id: true },
    });

    // `REFUNDED` não casa com `status: 'PAID'`, então o reembolso revoga o
    // acesso automaticamente — sem precisar de um segundo mecanismo que
    // alguém esqueceria de manter.
    if (!paidItem) {
      throw forbidden('Você precisa comprar este produto para baixar os arquivos.');
    }
  }

  const url = await createDownloadUrl({ key: file.storageKey, filename: file.filename });

  let ipHash: string | null = null;
  try {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) {
      ipHash = createHash('sha256').update(`${forwarded}${env.AUTH_SECRET}`).digest('hex').slice(0, 32);
    }
  } catch {
    // Fora de contexto de requisição não há headers; o registro segue sem IP.
  }

  await prisma.downloadLog.create({ data: { userId: user.id, fileId: file.id, ipHash } });

  await audit({
    action: 'file.downloaded',
    target: target('file', file.id),
    actorId: user.id,
    metadata: { productId: file.product.id },
  });

  return { url, filename: file.filename };
}

/**
 * Downloads recentes de um produto, para o criador.
 *
 * Mostra o número de IPs distintos por comprador: é o sinal que denuncia
 * compartilhamento de conta sem precisar de nenhuma tecnologia de DRM.
 */
export async function productDownloadStats(authorId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, authorId },
    select: { id: true },
  });

  if (!product) throw notFound('Produto não encontrado.');

  const logs = await prisma.downloadLog.findMany({
    where: { file: { productId } },
    select: {
      userId: true,
      ipHash: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const byUser = new Map<string, { name: string; count: number; ips: Set<string>; last: Date }>();

  for (const log of logs) {
    const entry = byUser.get(log.userId) ?? {
      name: log.user.name,
      count: 0,
      ips: new Set<string>(),
      last: log.createdAt,
    };

    entry.count += 1;
    if (log.ipHash) entry.ips.add(log.ipHash);
    if (log.createdAt > entry.last) entry.last = log.createdAt;
    byUser.set(log.userId, entry);
  }

  return [...byUser.entries()].map(([userId, entry]) => ({
    userId,
    name: entry.name,
    downloads: entry.count,
    distinctIps: entry.ips.size,
    lastDownloadAt: entry.last,
  }));
}
