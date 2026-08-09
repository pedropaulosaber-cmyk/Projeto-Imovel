import 'server-only';

import { conflict, notFound, validationFailed } from '@/lib/errors';
import { escapeLike, slugify, uniqueSlug } from '@/lib/text';
import { type ProductInput, type ProductQuery } from '@/lib/validation';
import { audit, target } from '@/server/audit';
import { requireOwnership, type Role } from '@/server/auth/authorize';
import type { SessionUser } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';
import type { Prisma } from '@/generated/prisma/client';

/**
 * Serviço de produtos
 * ===================
 *
 * Toda regra de catálogo mora aqui. Componentes e Server Actions chamam estas
 * funções; nenhum deles fala com o Prisma direto — é o que a regra de lint
 * `no-restricted-imports` garante mecanicamente.
 *
 * A razão não é estética. Quando a checagem de ownership vive dentro da mesma
 * função que faz o `update`, não existe caminho de escrita que a contorne. Se
 * ela vivesse na página, o segundo lugar que atualiza produto (a rota da API,
 * o job de importação) começaria sem ela.
 */

export const PAGE_SIZE = 24;

/**
 * Campos da listagem.
 *
 * Explícito, e não `include` inteiro, por dois motivos: a descrição de um
 * produto tem quilobytes e não aparece no card (trazer 24 delas é banda
 * desperdiçada), e `select` fechado impede que um campo sensível adicionado
 * amanhã ao modelo vaze para uma resposta pública sem ninguém notar.
 */
const cardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  kind: true,
  priceCents: true,
  currency: true,
  coverImageUrl: true,
  ratingSum: true,
  ratingCount: true,
  salesCount: true,
  publishedAt: true,
  category: { select: { slug: true, name: true } },
  author: { select: { id: true, name: true, avatarUrl: true } },
  tags: { select: { tag: true }, take: 4 },
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

/** Só produto publicado e não excluído aparece em superfície pública. */
const publicScope: Prisma.ProductWhereInput = { status: 'PUBLISHED', deletedAt: null };

function orderFor(sort: ProductQuery['sort']): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'recent':
      return [{ publishedAt: 'desc' }];
    case 'price_asc':
      return [{ priceCents: 'asc' }];
    case 'price_desc':
      return [{ priceCents: 'desc' }];
    case 'sales':
      return [{ salesCount: 'desc' }, { publishedAt: 'desc' }];
    case 'rating':
      // Ordenar por `ratingSum` favoreceria quem tem muitas notas medianas
      // sobre quem tem poucas ótimas — mas ordenar pela média crua faria um
      // produto com uma única nota 5 liderar o marketplace. O desempate por
      // contagem é o meio-termo honesto sem exigir cálculo bayesiano em SQL.
      return [{ ratingCount: 'desc' }, { ratingSum: 'desc' }];
    default:
      // "Relevância" sem motor de busca é uma mentira educada. O que se pode
      // prometer de verdade é: o que vende, com o mais recente à frente.
      return [{ salesCount: 'desc' }, { publishedAt: 'desc' }];
  }
}

function whereFor(query: ProductQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { ...publicScope };

  if (query.q) {
    const term = escapeLike(query.q);
    // Busca em nome, chamada e tag. `mode: 'insensitive'` vira `ILIKE` no
    // Postgres. Para escala real isto vira `tsvector` com índice GIN — o
    // ponto de virada é perceptível por volta de 100 mil produtos.
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { tagline: { contains: term, mode: 'insensitive' } },
      { tags: { some: { tag: { contains: term, mode: 'insensitive' } } } },
    ];
  }

  if (query.category) where.category = { slug: query.category };
  if (query.kind) where.kind = query.kind;

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.priceCents = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }

  return where;
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
};

/**
 * Lista pública, paginada.
 *
 * A contagem vai na mesma transação da busca para que o total não descreva
 * uma página diferente da que foi devolvida — sob escrita concorrente, duas
 * consultas separadas divergem e a paginação mostra uma página fantasma no fim.
 */
export async function listProducts(query: ProductQuery): Promise<Paginated<ProductCard>> {
  const where = whereFor(query);
  const skip = (query.page - 1) * PAGE_SIZE;

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: cardSelect,
      orderBy: orderFor(query.sort),
      skip,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page: query.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

const detailSelect = {
  ...cardSelect,
  description: true,
  requirements: true,
  requiredTools: true,
  integrations: true,
  demoVideoUrl: true,
  status: true,
  authorId: true,
  createdAt: true,
  images: { select: { id: true, url: true, alt: true }, orderBy: { position: 'asc' } },
  tags: { select: { tag: true } },
  files: { select: { id: true, filename: true, sizeBytes: true, version: true } },
  category: { select: { id: true, slug: true, name: true } },
  author: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      profile: { select: { bio: true, company: true } },
      professionalProfile: { select: { slug: true, headline: true } },
    },
  },
} satisfies Prisma.ProductSelect;

export type ProductDetail = Prisma.ProductGetPayload<{ select: typeof detailSelect }>;

/**
 * Produto por slug.
 *
 * Aceita `viewer` para deixar o autor e o admin verem o próprio rascunho —
 * sem isso, o criador não conseguiria pré-visualizar o que está montando.
 * Qualquer outra pessoa só enxerga o que está publicado.
 */
export async function getProductBySlug(
  slug: string,
  viewer: SessionUser | null,
): Promise<ProductDetail | null> {
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    select: detailSelect,
  });

  if (!product) return null;
  if (product.status === 'PUBLISHED') return product;

  const isOwner = viewer?.id === product.authorId;
  const isModerator = viewer?.roles.includes('ADMIN' satisfies Role) ?? false;

  return isOwner || isModerator ? product : null;
}

/** Relacionados: mesma categoria, exceto ele mesmo. */
export async function relatedProducts(product: {
  id: string;
  categoryId: string;
}): Promise<ProductCard[]> {
  return prisma.product.findMany({
    where: { ...publicScope, categoryId: product.categoryId, id: { not: product.id } },
    select: cardSelect,
    orderBy: [{ salesCount: 'desc' }],
    take: 4,
  });
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

/**
 * Cria produto como rascunho.
 *
 * Nasce em `DRAFT`, nunca publicado: publicar é um ato separado e deliberado,
 * que passa por moderação. Um produto que nasce público é um vetor de spam
 * com um POST de distância.
 */
export async function createProduct(user: SessionUser, input: ProductInput): Promise<{ id: string; slug: string }> {
  const category = await prisma.productCategory.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });
  if (!category) throw validationFailed('Categoria inválida.', { categoryId: ['Escolha uma categoria válida.'] });

  const slug = await uniqueSlug(input.name, async (candidate) => {
    const found = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    return found !== null;
  });

  const product = await prisma.product.create({
    data: {
      slug,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      kind: input.kind,
      categoryId: input.categoryId,
      authorId: user.id,
      priceCents: input.priceCents,
      requiredTools: input.requiredTools,
      integrations: input.integrations,
      requirements: input.requirements || null,
      coverImageUrl: input.coverImageUrl || null,
      demoVideoUrl: input.demoVideoUrl || null,
      status: 'DRAFT',
      tags: { create: input.tags.map((tag) => ({ tag: slugify(tag) })) },
    },
    select: { id: true, slug: true },
  });

  return product;
}

/**
 * Atualiza produto.
 *
 * O dono vem do banco, **nunca** do formulário. Um `ownerId` enviado pelo
 * cliente é exatamente o parâmetro que um atacante troca.
 */
export async function updateProduct(
  user: SessionUser,
  productId: string,
  input: ProductInput,
): Promise<void> {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, authorId: true, status: true, priceCents: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt) throw notFound('Produto não encontrado.');
  requireOwnership(user, existing.authorId);

  // Editar um produto já publicado o devolve para a fila de moderação: sem
  // isso, aprova-se um produto inócuo e troca-se o conteúdo por outro no dia
  // seguinte. É o buraco clássico de qualquer marketplace com curadoria.
  const nextStatus = existing.status === 'PUBLISHED' ? 'PENDING_REVIEW' : existing.status;

  await prisma.$transaction(async (tx) => {
    await tx.productTag.deleteMany({ where: { productId } });
    await tx.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        tagline: input.tagline,
        description: input.description,
        kind: input.kind,
        categoryId: input.categoryId,
        priceCents: input.priceCents,
        requiredTools: input.requiredTools,
        integrations: input.integrations,
        requirements: input.requirements || null,
        coverImageUrl: input.coverImageUrl || null,
        demoVideoUrl: input.demoVideoUrl || null,
        status: nextStatus,
        tags: { create: input.tags.map((tag) => ({ tag: slugify(tag) })) },
      },
    });
  });

  if (existing.priceCents !== input.priceCents) {
    // Mudança de preço é auditada em separado: é a alteração que aparece em
    // disputa ("o preço era outro quando comprei").
    await audit({
      action: 'product.price_changed',
      target: target('product', productId),
      actorId: user.id,
      metadata: { from: existing.priceCents, to: input.priceCents },
    });
  }
}

/** Envia para moderação. */
export async function submitForReview(user: SessionUser, productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, authorId: true, status: true, files: { select: { id: true }, take: 1 } },
  });

  if (!product) throw notFound('Produto não encontrado.');
  requireOwnership(user, product.authorId);

  if (product.status === 'PENDING_REVIEW') throw conflict('Este produto já está em análise.');
  if (product.status === 'PUBLISHED') throw conflict('Este produto já está publicado.');

  // Um produto digital sem arquivo é uma compra que não entrega nada. Barrar
  // aqui é mais barato que descobrir no primeiro pedido de reembolso.
  if (product.files.length === 0) {
    throw validationFailed('Anexe ao menos um arquivo antes de enviar para análise.');
  }

  await prisma.product.update({ where: { id: productId }, data: { status: 'PENDING_REVIEW' } });
  await audit({
    action: 'product.submitted',
    target: target('product', productId),
    actorId: user.id,
  });
}

/**
 * Decisão de moderação. Só admin.
 *
 * Notifica o criador nos dois casos — inclusive na recusa, com o motivo. Uma
 * recusa silenciosa faz o criador reenviar a mesma coisa, e a fila cresce.
 */
export async function moderateProduct(
  admin: SessionUser,
  decision: { decision: 'approve'; productId: string } | { decision: 'reject'; productId: string; note: string },
): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: decision.productId },
    select: { id: true, name: true, slug: true, authorId: true, status: true },
  });

  if (!product) throw notFound('Produto não encontrado.');
  if (product.status !== 'PENDING_REVIEW') {
    throw conflict('Este produto não está aguardando análise.');
  }

  const approved = decision.decision === 'approve';

  await prisma.$transaction([
    prisma.product.update({
      where: { id: product.id },
      data: approved
        ? { status: 'PUBLISHED', publishedAt: new Date(), moderationNote: null }
        : { status: 'REJECTED', moderationNote: decision.note },
    }),
    prisma.notification.create({
      data: {
        userId: product.authorId,
        type: approved ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
        title: approved ? `${product.name} está no ar` : `${product.name} precisa de ajustes`,
        body: approved
          ? 'Seu produto foi aprovado e já aparece no marketplace.'
          : decision.note,
        href: approved ? `/products/${product.slug}` : `/dashboard/products/${product.id}`,
      },
    }),
  ]);

  await audit({
    action: approved ? 'product.approved' : 'product.rejected',
    target: target('product', product.id),
    actorId: admin.id,
    metadata: approved ? undefined : { note: decision.note },
  });
}

/**
 * Arquiva o produto.
 *
 * Nunca apaga: quem comprou continua tendo direito ao arquivo e ao histórico.
 * "Remover" um produto vendido destruiria o acervo de outra pessoa.
 */
export async function archiveProduct(user: SessionUser, productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, authorId: true },
  });

  if (!product) throw notFound('Produto não encontrado.');
  requireOwnership(user, product.authorId);

  await prisma.product.update({ where: { id: productId }, data: { status: 'ARCHIVED' } });
  await audit({ action: 'product.archived', target: target('product', productId), actorId: user.id });
}

/**
 * Recalcula os agregados de avaliação.
 *
 * Chamado dentro da transação que cria ou remove avaliação. Os campos são
 * desnormalizados por performance (ver o schema), e desnormalização só é
 * segura quando a atualização é atômica com o fato que a origina.
 */
export async function recomputeProductStats(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<void> {
  const aggregate = await tx.review.aggregate({
    where: { productId },
    _sum: { rating: true },
    _count: { _all: true },
  });

  await tx.product.update({
    where: { id: productId },
    data: {
      ratingSum: aggregate._sum.rating ?? 0,
      ratingCount: aggregate._count._all,
    },
  });
}

/** Produtos do criador, para o dashboard. Inclui rascunhos e recusados. */
export async function listAuthorProducts(authorId: string) {
  return prisma.product.findMany({
    where: { authorId, deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      priceCents: true,
      salesCount: true,
      ratingSum: true,
      ratingCount: true,
      updatedAt: true,
      moderationNote: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/** Fila de moderação, para o admin. */
export async function listPendingModeration() {
  return prisma.product.findMany({
    where: { status: 'PENDING_REVIEW', deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      priceCents: true,
      updatedAt: true,
      author: { select: { id: true, name: true, email: true } },
      category: { select: { name: true } },
    },
    orderBy: { updatedAt: 'asc' },
  });
}

export async function listCategories() {
  return prisma.productCategory.findMany({
    where: { parentId: null },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      children: { select: { id: true, slug: true, name: true }, orderBy: { position: 'asc' } },
      _count: { select: { products: { where: publicScope } } },
    },
    orderBy: { position: 'asc' },
  });
}

/**
 * Números da vitrine para a home.
 *
 * Fica no service, e não na página, porque a regra do projeto é que a camada
 * de apresentação não consulta o banco: é no service que os filtros de
 * visibilidade (`status`, `deletedAt`) vivem, e repeti-los na página é como um
 * deles acaba esquecido e um rascunho entra na contagem pública.
 */
export async function platformStats(): Promise<{ products: number; professionals: number; demands: number }> {
  const [products, professionals, demands] = await prisma.$transaction([
    prisma.product.count({ where: publicScope }),
    prisma.professionalProfile.count({
      where: { startingAtCents: { gt: 0 }, user: { status: 'ACTIVE', deletedAt: null } },
    }),
    prisma.demand.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
  ]);

  return { products, professionals, demands };
}
