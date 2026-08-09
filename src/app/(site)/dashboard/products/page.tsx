import type { Metadata } from 'next';
import Link from 'next/link';

import { LinkButton } from '@/components/ui/button';
import { Card, EmptyState, Notice, Tag } from '@/components/ui/primitives';
import { formatBRLCompact } from '@/lib/money';
import { averageRating, formatRelative } from '@/lib/text';
import { requireUser } from '@/server/auth/authorize';
import { listAuthorProducts } from '@/server/services/products';

export const metadata: Metadata = { title: 'Meus produtos', robots: { index: false } };

const TONE = { PUBLISHED: 'positive', PENDING_REVIEW: 'warning', REJECTED: 'danger', DRAFT: 'neutral', ARCHIVED: 'neutral' } as const;
const LABEL = { PUBLISHED: 'Publicado', PENDING_REVIEW: 'Em análise', REJECTED: 'Recusado', DRAFT: 'Rascunho', ARCHIVED: 'Arquivado' } as const;

export default async function DashboardProductsPage() {
  const user = await requireUser();
  const products = await listAuthorProducts(user.id);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[30px] font-extrabold">Meus produtos</h1>
        <LinkButton href="/dashboard/products/new">Novo produto</LinkButton>
      </div>

      {products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nenhum produto ainda"
            description="Publique o que você já construiu. A curadoria responde em até dois dias úteis."
            action={<LinkButton href="/dashboard/products/new">Criar produto</LinkButton>}
          />
        </div>
      ) : (
        <ul className="mt-8 flex list-none flex-col gap-3 p-0">
          {products.map((product) => (
            <li key={product.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-[16px] font-bold">
                      {product.status === 'PUBLISHED' ? (
                        <Link href={`/products/${product.slug}`} className="text-ink no-underline hover:text-brand-strong">
                          {product.name}
                        </Link>
                      ) : (
                        product.name
                      )}
                    </h2>
                    <p className="mt-1 text-[13px] text-muted">
                      {formatBRLCompact(product.priceCents)} · {product.salesCount}{' '}
                      {product.salesCount === 1 ? 'venda' : 'vendas'} · nota{' '}
                      {averageRating(product.ratingSum, product.ratingCount)?.toFixed(1) ?? '—'} ·
                      atualizado {formatRelative(product.updatedAt)}
                    </p>
                  </div>
                  <Tag tone={TONE[product.status]}>{LABEL[product.status]}</Tag>
                </div>

                {product.status === 'REJECTED' && product.moderationNote ? (
                  <div className="mt-4">
                    <Notice tone="warning">
                      <strong>Motivo da recusa:</strong> {product.moderationNote}
                    </Notice>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
