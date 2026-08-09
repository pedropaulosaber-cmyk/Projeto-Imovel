import type { Metadata } from 'next';

import { Card, EmptyState, Panel } from '@/components/ui/primitives';
import { formatBRL } from '@/lib/money';
import { formatDate } from '@/lib/text';
import { requireRole } from '@/server/auth/authorize';
import { creatorEarnings, listCreatorSales } from '@/server/services/orders';

export const metadata: Metadata = { title: 'Receitas', robots: { index: false } };

export default async function EarningsPage() {
  // Exige o papel de criador: quem só compra não tem receita, e mostrar uma
  // tela zerada seria pior que dizer que a área não é para ele.
  const user = await requireRole('CREATOR');
  const [summary, sales] = await Promise.all([creatorEarnings(user.id), listCreatorSales(user.id)]);

  return (
    <>
      <h1 className="text-[30px] font-extrabold">Receitas</h1>
      <p className="mt-2 text-[15px] text-ink-body">
        Valores líquidos, já descontada a comissão de 15% da plataforma.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Bruto', value: formatBRL(summary.grossCents), tone: 'text-ink' },
          { label: 'Comissão', value: `− ${formatBRL(summary.feeCents)}`, tone: 'text-muted' },
          { label: 'Líquido', value: formatBRL(summary.netCents), tone: 'text-positive' },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-[12.5px] uppercase tracking-[0.1em] text-muted">{stat.label}</p>
            <p className={`mt-2 text-[26px] font-extrabold leading-none tracking-tight ${stat.tone}`}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      <Panel className="mt-6 p-5">
        <p className="text-[13.5px] leading-relaxed text-ink-body">
          O repasse acontece após a confirmação do pagamento pelo provedor. Reembolsos estornam a
          comissão junto — você não paga taxa sobre venda desfeita.
        </p>
      </Panel>

      <section className="mt-10" aria-labelledby="historico">
        <h2 id="historico" className="text-xl font-extrabold">Histórico</h2>
        {sales.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Sem movimentação" description="Assim que a primeira venda for confirmada, ela aparece aqui." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-line text-left text-[12.5px] uppercase tracking-[0.08em] text-muted">
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Data</th>
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Produto</th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Bruto</th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Comissão</th>
                  <th scope="col" className="py-2.5 text-right font-semibold">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-line last:border-0">
                    <td className="py-3 pr-4 text-muted">{sale.order.paidAt ? formatDate(sale.order.paidAt) : '—'}</td>
                    <td className="py-3 pr-4 font-semibold">{sale.productName}</td>
                    <td className="py-3 pr-4 text-right text-muted">{formatBRL(sale.unitPriceCents)}</td>
                    <td className="py-3 pr-4 text-right text-muted">− {formatBRL(sale.feeCents)}</td>
                    <td className="py-3 text-right font-extrabold">{formatBRL(sale.netCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
