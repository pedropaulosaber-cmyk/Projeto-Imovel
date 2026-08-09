import type { Metadata } from 'next';

import { Card, Panel } from '@/components/ui/primitives';
import { ProductForm } from '@/features/products/product-form';
import { requireRole } from '@/server/auth/authorize';
import { listCategories } from '@/server/services/products';

export const metadata: Metadata = { title: 'Novo produto', robots: { index: false } };

export default async function NewProductPage() {
  await requireRole('CREATOR');
  const categories = await listCategories();

  return (
    <>
      <h1 className="text-[30px] font-extrabold">Novo produto</h1>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-body">
        Ele nasce como rascunho. Quando estiver pronto, você envia para a curadoria — que responde
        em até dois dias úteis, com motivo em caso de recusa.
      </p>

      <Panel className="mt-6 p-5">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
          O que a curadoria olha
        </h2>
        <ul className="mt-3 flex list-none flex-col gap-2 p-0 text-[14px] leading-relaxed text-ink-body">
          <li>· A descrição explica o problema que resolve, não só o que o produto é.</li>
          <li>· As ferramentas necessárias estão declaradas — o comprador não pode descobrir depois.</li>
          <li>· Existe pelo menos um arquivo de entrega anexado.</li>
          <li>· O preço é coerente com o que está sendo entregue.</li>
        </ul>
      </Panel>

      <Card className="mt-6 p-6 sm:p-8">
        <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </Card>
    </>
  );
}
