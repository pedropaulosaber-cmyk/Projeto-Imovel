import type { MetadataRoute } from 'next';

import { publicEnv } from '@/config/env';
import { prisma } from '@/server/db/prisma';

/**
 * Sitemap.
 *
 * Só o que é **público e indexável**: produtos publicados e perfis listáveis.
 * Painel, biblioteca, demandas e checkout ficam de fora — não trazem tráfego e
 * expõem estrutura interna a quem varre o sitemap procurando superfície.
 *
 * `lastModified` sai do `updatedAt` real: um sitemap que carimba tudo com a
 * data de hoje ensina o buscador a ignorar o campo.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_APP_URL;

  const [products, professionals] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: { slug: true, updatedAt: true },
      take: 10_000,
    }),
    prisma.professionalProfile.findMany({
      where: { startingAtCents: { gt: 0 }, user: { status: 'ACTIVE', deletedAt: null } },
      select: { slug: true, updatedAt: true },
      take: 10_000,
    }),
  ]);

  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/professionals`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/sell`, changeFrequency: 'monthly', priority: 0.7 },
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...professionals.map((professional) => ({
      url: `${base}/professionals/${professional.slug}`,
      lastModified: professional.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
