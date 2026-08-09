import type { Metadata } from 'next';

import { Avatar, Card, EmptyState } from '@/components/ui/primitives';
import { formatBRL } from '@/lib/money';
import { formatRelative } from '@/lib/text';
import { requireRole } from '@/server/auth/authorize';
import { listCreatorSales } from '@/server/services/orders';

export const metadata: Metadata = { title: 'Clientes', robots: { index: false } };

/**
 * Clientes do criador.
 *
 * Agrega as vendas por comprador. O e-mail aparece porque o criador precisa
 * conseguir dar suporte a quem comprou dele — e **só** aparece para o autor do
 * produto, nunca numa superfície pública.
 */
export default async function CustomersPage() {
  const user = await requireRole('CREATOR');
  const sales = await listCreatorSales(user.id);

  const byCustomer = new Map<
    string,
    { name: string; email: string; avatarUrl: string | null; orders: number; totalCents: number; last: Date | null }
  >();

  for (const sale of sales) {
    const buyer = sale.order.buyer;
    const entry = byCustomer.get(buyer.id) ?? {
      name: buyer.name,
      email: buyer.email,
      avatarUrl: buyer.avatarUrl,
      orders: 0,
      totalCents: 0,
      last: sale.order.paidAt,
    };

    entry.orders += 1;
    entry.totalCents += sale.netCents;
    if (sale.order.paidAt && (!entry.last || sale.order.paidAt > entry.last)) {
      entry.last = sale.order.paidAt;
    }

    byCustomer.set(buyer.id, entry);
  }

  const customers = [...byCustomer.entries()].sort((a, b) => b[1].totalCents - a[1].totalCents);

  return (
    <>
      <h1 className="text-[30px] font-extrabold">Clientes</h1>
      <p className="mt-2 text-[15px] text-ink-body">Quem comprou os seus produtos.</p>

      {customers.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Nenhum cliente ainda" description="Quando alguém comprar um produto seu, o contato aparece aqui para você dar suporte." />
        </div>
      ) : (
        <ul className="mt-8 flex list-none flex-col gap-3 p-0">
          {customers.map(([id, customer]) => (
            <li key={id}>
              <Card className="flex flex-wrap items-center gap-4 p-4">
                <Avatar name={customer.name} src={customer.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold">{customer.name}</p>
                  <p className="truncate text-[12.5px] text-muted">{customer.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-extrabold">{formatBRL(customer.totalCents)}</p>
                  <p className="text-[12px] text-muted">
                    {customer.orders} {customer.orders === 1 ? 'compra' : 'compras'}
                    {customer.last ? ` · ${formatRelative(customer.last)}` : ''}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
