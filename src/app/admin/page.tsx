import type { Metadata } from 'next';

import { Card, EmptyState, Tag } from '@/components/ui/primitives';
import { ModerationPanel } from '@/features/admin/moderation-panel';
import { formatBRLCompact } from '@/lib/money';
import { formatRelative } from '@/lib/text';
import { listPendingModeration } from '@/server/services/products';

export const metadata: Metadata = { title: 'Moderação', robots: { index: false } };

export default async function AdminPage() {
  const pending = await listPendingModeration();

  return (
    <div className="mx-auto max-w-[900px] px-5 py-12 lg:px-10">
      <h1 className="text-[30px] font-extrabold">Fila de moderação</h1>
      <p className="mt-2 text-[15px] text-ink-body">
        Produtos aguardando análise, do mais antigo para o mais recente.
      </p>

      {pending.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Fila vazia" description="Nenhum produto aguardando análise no momento." />
        </div>
      ) : (
        <ul className="mt-8 flex list-none flex-col gap-4 p-0">
          {pending.map((product) => (
            <li key={product.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-[17px] font-bold">{product.name}</h2>
                    <p className="mt-1 text-[14px] text-ink-body">{product.tagline}</p>
                    <p className="mt-2 text-[12.5px] text-muted">
                      {product.author.name} ({product.author.email}) · {product.category.name} ·
                      enviado {formatRelative(product.updatedAt)}
                    </p>
                  </div>
                  <Tag tone="warning">{formatBRLCompact(product.priceCents)}</Tag>
                </div>

                <ModerationPanel productId={product.id} slug={product.slug} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
