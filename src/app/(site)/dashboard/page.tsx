import type { Metadata } from 'next';
import Link from 'next/link';

import { LinkButton } from '@/components/ui/button';
import { Card, EmptyState, Tag } from '@/components/ui/primitives';
import { formatBRL, formatBRLCompact } from '@/lib/money';
import { averageRating, formatRelative } from '@/lib/text';
import { requireUser } from '@/server/auth/authorize';
import { creatorEarnings, listBuyerOrders, listCreatorSales } from '@/server/services/orders';
import { listAuthorProducts } from '@/server/services/products';

export const metadata: Metadata = { title: 'Visão geral', robots: { index: false } };

const STATUS_TONE = {
  PUBLISHED: 'positive',
  PENDING_REVIEW: 'warning',
  REJECTED: 'danger',
  DRAFT: 'neutral',
  ARCHIVED: 'neutral',
} as const;

const STATUS_LABEL = {
  PUBLISHED: 'Publicado',
  PENDING_REVIEW: 'Em análise',
  REJECTED: 'Recusado',
  DRAFT: 'Rascunho',
  ARCHIVED: 'Arquivado',
} as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const isCreator = user.roles.includes('CREATOR') || user.roles.includes('ADMIN');

  const [products, earnings, sales, orders] = await Promise.all([
    isCreator ? listAuthorProducts(user.id) : Promise.resolve([]),
    isCreator ? creatorEarnings(user.id) : Promise.resolve(null),
    isCreator ? listCreatorSales(user.id) : Promise.resolve([]),
    listBuyerOrders(user.id),
  ]);

  return (
    <>
      <h1 className="text-[30px] font-extrabold">Visão geral</h1>
      <p className="mt-2 text-[15px] text-ink-body">Olá, {user.name.split(' ')[0]}.</p>

      {isCreator && earnings ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Receita líquida', value: formatBRL(earnings.netCents) },
            { label: 'Vendas', value: String(earnings.salesCount) },
            { label: 'Clientes', value: String(earnings.customerCount) },
            { label: 'Produtos publicados', value: String(products.filter((p) => p.status === 'PUBLISHED').length) },
          ].map((stat) => (
            <Card key={stat.label} className="p-5">
              <p className="text-[12.5px] uppercase tracking-[0.1em] text-muted">{stat.label}</p>
              <p className="mt-2 text-[26px] font-extrabold leading-none tracking-tight">
                {stat.value}
              </p>
            </Card>
          ))}
        </div>
      ) : null}

      {isCreator ? (
        <section className="mt-10" aria-labelledby="meus-produtos">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="meus-produtos" className="text-xl font-extrabold">Meus produtos</h2>
            <LinkButton href="/dashboard/products/new" size="sm">Novo produto</LinkButton>
          </div>

          {products.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Você ainda não publicou nada"
                description="Transforme uma automação que você já construiu em receita recorrente. A primeira publicação leva uma tarde."
                action={<LinkButton href="/dashboard/products/new">Publicar meu primeiro produto</LinkButton>}
              />
            </div>
          ) : (
            <ul className="mt-4 flex list-none flex-col gap-3 p-0">
              {products.slice(0, 5).map((product) => (
                <li key={product.id}>
                  <Card className="flex flex-wrap items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{product.name}</p>
                      <p className="mt-0.5 text-[12.5px] text-muted">
                        {formatBRLCompact(product.priceCents)} · {product.salesCount} vendas ·
                        nota {averageRating(product.ratingSum, product.ratingCount)?.toFixed(1) ?? '—'}
                      </p>
                    </div>
                    <Tag tone={STATUS_TONE[product.status]}>{STATUS_LABEL[product.status]}</Tag>
                    <Link href={`/dashboard/products`} className="text-[13.5px] font-semibold">
                      Gerenciar
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {isCreator && sales.length > 0 ? (
        <section className="mt-10" aria-labelledby="vendas-recentes">
          <h2 id="vendas-recentes" className="text-xl font-extrabold">Vendas recentes</h2>
          <ul className="mt-4 flex list-none flex-col gap-2.5 p-0">
            {sales.slice(0, 5).map((sale) => (
              <li key={sale.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-semibold">{sale.productName}</p>
                    <p className="text-[12.5px] text-muted">
                      {sale.order.buyer.name} · pedido {sale.order.number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-extrabold">{formatBRL(sale.netCents)}</p>
                    <p className="text-[12px] text-muted">
                      {sale.order.paidAt ? formatRelative(sale.order.paidAt) : '—'}
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10" aria-labelledby="minhas-compras">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="minhas-compras" className="text-xl font-extrabold">Minhas compras</h2>
          <Link href="/library" className="text-[13.5px] font-semibold">Ver biblioteca</Link>
        </div>

        {orders.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nenhuma compra ainda"
              description="Explore o catálogo e encontre uma solução que resolva algo que hoje custa horas do seu time."
              action={<LinkButton href="/products">Explorar soluções</LinkButton>}
            />
          </div>
        ) : (
          <ul className="mt-4 flex list-none flex-col gap-2.5 p-0">
            {orders.slice(0, 5).map((order) => (
              <li key={order.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-semibold">
                      {order.items.map((item) => item.productName).join(', ')}
                    </p>
                    <p className="text-[12.5px] text-muted">Pedido {order.number}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag tone={order.status === 'PAID' ? 'positive' : order.status === 'PENDING' ? 'warning' : 'neutral'}>
                      {order.status === 'PAID' ? 'Pago' : order.status === 'PENDING' ? 'Aguardando' : order.status}
                    </Tag>
                    <span className="text-[15px] font-extrabold">{formatBRL(order.totalCents)}</span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
