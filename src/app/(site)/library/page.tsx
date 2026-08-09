import type { Metadata } from 'next';

import { LinkButton } from '@/components/ui/button';
import { Card, EmptyState, Tag, Thumb } from '@/components/ui/primitives';
import { DownloadButton } from '@/features/library/download-button';
import { formatDate } from '@/lib/text';
import { requireUser } from '@/server/auth/authorize';
import { listLibrary } from '@/server/services/orders';

export const metadata: Metadata = { title: 'Minha biblioteca', robots: { index: false } };

/**
 * Biblioteca do comprador.
 *
 * Só o que ele pagou. A consulta parte de `OrderItem` com pedido `PAID`, então
 * um reembolso remove o item da lista sem precisar de nenhum outro mecanismo.
 */
export default async function LibraryPage() {
  const user = await requireUser();
  const items = await listLibrary(user.id);

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-12 lg:px-10 lg:py-16">
      <h1 className="text-[32px] font-extrabold">Minha biblioteca</h1>
      <p className="mt-2 text-[15.5px] text-ink-body">
        Tudo que você comprou, com os arquivos e as atualizações do criador.
      </p>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Sua biblioteca está vazia"
            description="Quando você comprar uma solução, ela aparece aqui com os arquivos liberados para download imediato."
            action={<LinkButton href="/products">Explorar soluções</LinkButton>}
          />
        </div>
      ) : (
        <ul className="mt-8 flex list-none flex-col gap-4 p-0">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="flex flex-col gap-4 p-5 sm:flex-row">
                {item.product.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.coverImageUrl}
                    alt=""
                    className="h-28 w-full rounded-[var(--radius-thumb)] border border-line object-cover sm:w-44"
                  />
                ) : (
                  <Thumb className="h-28 w-full sm:w-44" />
                )}

                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-bold">{item.product.name}</h2>
                  <p className="mt-1 text-[13.5px] text-muted">
                    por {item.product.author.name} · pedido {item.order.number} ·{' '}
                    {item.order.paidAt ? formatDate(item.order.paidAt) : ''}
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-body">
                    {item.product.tagline}
                  </p>

                  <ul className="mt-4 flex list-none flex-col gap-2 p-0">
                    {item.product.files.map((file) => (
                      <li
                        key={file.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-thumb)] border border-line px-3.5 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-semibold">
                            {file.filename}
                          </span>
                          <span className="block text-[12px] text-muted">
                            versão {file.version} · {(file.sizeBytes / 1_048_576).toFixed(1)} MB
                          </span>
                        </span>
                        <DownloadButton fileId={file.id} />
                      </li>
                    ))}
                    {item.product.files.length === 0 ? (
                      <li className="text-[13px] text-muted">
                        O criador ainda não anexou arquivos a este produto.
                      </li>
                    ) : null}
                  </ul>

                  {item.product.status !== 'PUBLISHED' ? (
                    <Tag className="mt-3">
                      Fora do catálogo — seu acesso continua garantido
                    </Tag>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
