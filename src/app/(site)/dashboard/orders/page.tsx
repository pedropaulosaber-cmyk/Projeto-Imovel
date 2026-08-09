import type { Metadata } from 'next';

import { Card, EmptyState, Tag } from '@/components/ui/primitives';
import { LinkButton } from '@/components/ui/button';
import { formatBRL } from '@/lib/money';
import { formatDateTime } from '@/lib/text';
import { requireUser } from '@/server/auth/authorize';
import { listBuyerOrders, listCreatorSales } from '@/server/services/orders';

export const metadata: Metadata = { title: 'Pedidos', robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser();
  const isCreator = user.roles.includes('CREATOR') || user.roles.includes('ADMIN');

  const [orders, sales] = await Promise.all([
    listBuyerOrders(user.id),
    isCreator ? listCreatorSales(user.id) : Promise.resolve([]),
  ]);

  return (
    <>
      <h1 className="text-[30px] font-extrabold">Pedidos</h1>

      {isCreator ? (
        <section className="mt-8" aria-labelledby="vendas">
          <h2 id="vendas" className="text-xl font-extrabold">Vendas</h2>
          {sales.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Nenhuma venda ainda" description="Suas vendas aparecem aqui com o valor líquido já descontada a comissão." />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-line text-left text-[12.5px] uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Produto</th>
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Comprador</th>
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Pedido</th>
                    <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Bruto</th>
                    <th scope="col" className="py-2.5 text-right font-semibold">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4 font-semibold">{sale.productName}</td>
                      <td className="py-3 pr-4 text-ink-body">{sale.order.buyer.name}</td>
                      <td className="py-3 pr-4 font-mono text-[13px] text-muted">{sale.order.number}</td>
                      <td className="py-3 pr-4 text-right text-muted">{formatBRL(sale.unitPriceCents)}</td>
                      <td className="py-3 text-right font-extrabold">{formatBRL(sale.netCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="compras">
        <h2 id="compras" className="text-xl font-extrabold">Minhas compras</h2>
        {orders.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nenhuma compra"
              description="Quando você comprar uma solução, o pedido aparece aqui com status e recibo."
              action={<LinkButton href="/products">Explorar soluções</LinkButton>}
            />
          </div>
        ) : (
          <ul className="mt-4 flex list-none flex-col gap-3 p-0">
            {orders.map((order) => (
              <li key={order.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-semibold">
                      {order.items.map((item) => item.productName).join(', ')}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      <span className="font-mono">{order.number}</span> ·{' '}
                      {order.paidAt ? formatDateTime(order.paidAt) : formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag tone={order.status === 'PAID' ? 'positive' : order.status === 'PENDING' ? 'warning' : 'neutral'}>
                      {order.status === 'PAID' ? 'Pago' : order.status === 'PENDING' ? 'Aguardando pagamento' : order.status}
                    </Tag>
                    <span className="font-extrabold">{formatBRL(order.totalCents)}</span>
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
