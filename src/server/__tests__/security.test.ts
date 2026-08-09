import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppError } from '@/lib/errors';
import { requireOwnership } from '@/server/auth/authorize';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import type { SessionUser } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';
import { createDraftOrder, hasPurchased, markOrderPaid } from '@/server/services/orders';
import { updateProduct } from '@/server/services/products';
import { upsertReview } from '@/server/services/reviews';

/**
 * Testes dos fluxos críticos
 * ==========================
 *
 * Rodam contra um **Postgres de verdade**, não contra mock. A razão é direta:
 * as garantias que importam aqui — constraint única que torna o webhook
 * idempotente, `WHERE` que carrega a condição de posse, transação que mantém
 * a média coerente — são garantias *do banco*. Um mock que responde o que o
 * teste espera confirmaria o código e não confirmaria nada do que protege.
 *
 * Cada teste cria os próprios dados com sufixo aleatório e limpa no fim, para
 * poder rodar contra um banco que já tem o seed.
 */

const suffix = Math.random().toString(36).slice(2, 8);
const email = (name: string) => `teste-${name}-${suffix}@exemplo.invalid`;

let seller: SessionUser;
let buyer: SessionUser;
let outsider: SessionUser;
let productId: string;
let categoryId: string;

function asSessionUser(user: {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}): SessionUser {
  return { ...user, roles: ['BUYER', 'CREATOR'], status: 'ACTIVE' };
}

beforeAll(async () => {
  const passwordHash = await hashPassword('uma senha bem longa de teste');

  const [sellerRow, buyerRow, outsiderRow] = await Promise.all([
    prisma.user.create({
      data: { email: email('vendedor'), name: 'Vendedor Teste', passwordHash },
      select: { id: true, email: true, name: true, avatarUrl: true },
    }),
    prisma.user.create({
      data: { email: email('comprador'), name: 'Comprador Teste', passwordHash },
      select: { id: true, email: true, name: true, avatarUrl: true },
    }),
    prisma.user.create({
      data: { email: email('estranho'), name: 'Estranho Teste', passwordHash },
      select: { id: true, email: true, name: true, avatarUrl: true },
    }),
  ]);

  seller = asSessionUser(sellerRow);
  buyer = asSessionUser(buyerRow);
  outsider = asSessionUser(outsiderRow);

  const category = await prisma.productCategory.findFirstOrThrow({ select: { id: true } });
  categoryId = category.id;

  const product = await prisma.product.create({
    data: {
      slug: `produto-teste-${suffix}`,
      name: 'Produto de teste',
      tagline: 'Uma chamada de teste com tamanho suficiente.',
      description: 'x'.repeat(120),
      kind: 'AUTOMATION',
      categoryId,
      authorId: seller.id,
      priceCents: 189_000,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    select: { id: true },
  });

  productId = product.id;
});

afterAll(async () => {
  /*
   * A ordem aqui não é preferência: `Payment` referencia `Order` com
   * `onDelete: Restrict`, de propósito — registro financeiro não pode sumir em
   * cascata porque alguém apagou um pedido. O teardown paga esse preço
   * apagando de dentro para fora, e o fato de ele precisar disso é a prova de
   * que a constraint está fazendo efeito.
   */
  const orderIds = (
    await prisma.order.findMany({
      where: { buyerId: { in: [buyer.id, outsider.id] } },
      select: { id: true },
    })
  ).map((order) => order.id);

  await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.orderItem.deleteMany({ where: { productId } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.review.deleteMany({ where: { productId } });
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.user.deleteMany({ where: { id: { in: [seller.id, buyer.id, outsider.id] } } });
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------

describe('senha', () => {
  it('o hash não contém a senha e verifica corretamente', async () => {
    const plain = 'uma frase longa como senha';
    const hash = await hashPassword(plain);

    expect(hash).not.toContain(plain);
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, plain)).toBe(true);
    expect(await verifyPassword(hash, 'outra coisa')).toBe(false);
  });

  it('hashes da mesma senha são diferentes entre si', async () => {
    // Sem salt por hash, duas contas com a mesma senha teriam o mesmo hash — e
    // um vazamento revelaria quem compartilha senha com quem.
    const [first, second] = await Promise.all([hashPassword('mesma senha longa'), hashPassword('mesma senha longa')]);
    expect(first).not.toBe(second);
  });

  it('hash corrompido nega acesso em vez de derrubar a requisição', async () => {
    expect(await verifyPassword('não é um hash', 'qualquer coisa')).toBe(false);
  });
});

describe('ownership', () => {
  it('o dono passa', () => {
    expect(() => requireOwnership(seller, seller.id)).not.toThrow();
  });

  it('o administrador passa', () => {
    const admin: SessionUser = { ...outsider, roles: ['ADMIN'] };
    expect(() => requireOwnership(admin, seller.id)).not.toThrow();
  });

  it('terceiro recebe NOT_FOUND, não FORBIDDEN', () => {
    // 403 confirmaria que o id existe, transformando um chute em enumeração.
    try {
      requireOwnership(outsider, seller.id);
      expect.unreachable('deveria ter lançado');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('NOT_FOUND');
    }
  });

  it('não deixa terceiro editar produto alheio', async () => {
    await expect(
      updateProduct(outsider, productId, {
        name: 'Sequestrado',
        tagline: 'Uma chamada de teste com tamanho suficiente.',
        description: 'x'.repeat(120),
        kind: 'AUTOMATION',
        categoryId,
        priceCents: 1,
        requiredTools: [],
        integrations: [],
        tags: [],
      }),
    ).rejects.toThrow();

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { name: true, priceCents: true },
    });

    expect(product.name).toBe('Produto de teste');
    expect(product.priceCents).toBe(189_000);
  });
});

describe('checkout', () => {
  it('o preço do pedido vem do banco, não da requisição', async () => {
    const order = await createDraftOrder(buyer, productId);

    expect(order.totalCents).toBe(189_000);
    // 15% de 189.000 centavos.
    expect(order.feeCents).toBe(28_350);

    await prisma.order.deleteMany({ where: { id: order.orderId } });
  });

  it('o autor não compra o próprio produto', async () => {
    await expect(createDraftOrder(seller, productId)).rejects.toThrow();
  });

  it('um segundo checkout do mesmo produto reaproveita o pedido pendente', async () => {
    const first = await createDraftOrder(buyer, productId);
    const second = await createDraftOrder(buyer, productId);

    expect(second.orderId).toBe(first.orderId);

    await prisma.order.deleteMany({ where: { id: first.orderId } });
  });

  it('recusa confirmação com valor divergente do cobrado', async () => {
    const order = await createDraftOrder(buyer, productId);

    // Valor adulterado no caminho: creditar aqui seria vender por um real.
    await expect(
      markOrderPaid(order.orderId, { providerRef: `ref-fraude-${suffix}`, amountCents: 100 }),
    ).rejects.toThrow();

    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: order.orderId },
      select: { status: true },
    });
    expect(stored.status).toBe('PENDING');

    await prisma.order.deleteMany({ where: { id: order.orderId } });
  });
});

describe('webhook e direito de acesso', () => {
  it('confirmar duas vezes não credita a venda duas vezes', async () => {
    const order = await createDraftOrder(buyer, productId);
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { salesCount: true },
    });

    const first = await markOrderPaid(order.orderId, {
      providerRef: `ref-${suffix}`,
      amountCents: 189_000,
    });
    const second = await markOrderPaid(order.orderId, {
      providerRef: `ref-${suffix}`,
      amountCents: 189_000,
    });

    expect(first.alreadyProcessed).toBe(false);
    expect(second.alreadyProcessed).toBe(true);

    const after = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { salesCount: true },
    });

    expect(after.salesCount).toBe(before.salesCount + 1);
  });

  it('só quem pagou tem direito ao produto', async () => {
    expect(await hasPurchased(buyer.id, productId)).toBe(true);
    expect(await hasPurchased(outsider.id, productId)).toBe(false);
  });

  it('pedido reembolsado revoga o direito de acesso', async () => {
    const order = await prisma.order.findFirstOrThrow({
      where: { buyerId: buyer.id, status: 'PAID' },
      select: { id: true },
    });

    await prisma.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } });
    expect(await hasPurchased(buyer.id, productId)).toBe(false);

    await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
    expect(await hasPurchased(buyer.id, productId)).toBe(true);
  });
});

describe('avaliações', () => {
  it('quem não comprou não avalia', async () => {
    await expect(
      upsertReview(outsider, { productId, rating: 1, comment: 'x'.repeat(30) }),
    ).rejects.toThrow();
  });

  it('o autor não avalia o próprio produto', async () => {
    await expect(
      upsertReview(seller, { productId, rating: 5, comment: 'x'.repeat(30) }),
    ).rejects.toThrow();
  });

  it('quem comprou avalia, e a média fica coerente na mesma transação', async () => {
    await upsertReview(buyer, { productId, rating: 4, comment: 'Funcionou bem no meu caso.' });

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { ratingSum: true, ratingCount: true },
    });

    expect(product.ratingCount).toBe(1);
    expect(product.ratingSum).toBe(4);
  });

  it('reavaliar edita em vez de empilhar', async () => {
    await upsertReview(buyer, { productId, rating: 2, comment: 'Mudei de ideia depois de usar.' });

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { ratingSum: true, ratingCount: true },
    });

    expect(product.ratingCount).toBe(1);
    expect(product.ratingSum).toBe(2);
  });
});
