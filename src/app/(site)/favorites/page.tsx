import type { Metadata } from 'next';
import Link from 'next/link';

import { ProductCard } from '@/components/marketplace/product-card';
import { LinkButton } from '@/components/ui/button';
import { Avatar, Card, EmptyState, Stars } from '@/components/ui/primitives';
import { formatBRLCompact } from '@/lib/money';
import { averageRating } from '@/lib/text';
import { requireUser } from '@/server/auth/authorize';
import { listFavorites } from '@/server/services/engagement';

export const metadata: Metadata = { title: 'Favoritos', robots: { index: false } };

export default async function FavoritesPage() {
  const user = await requireUser();
  const { products, professionals } = await listFavorites(user.id);

  const empty = products.length === 0 && professionals.length === 0;

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 lg:px-10 lg:py-16">
      <h1 className="text-[32px] font-extrabold">Favoritos</h1>
      <p className="mt-2 text-[15.5px] text-ink-body">
        O que você salvou para decidir depois.
      </p>

      {empty ? (
        <div className="mt-8">
          <EmptyState
            title="Nada salvo ainda"
            description="Use o botão Salvar nas páginas de produto e de profissional para montar sua lista de comparação."
            action={<LinkButton href="/products">Explorar soluções</LinkButton>}
          />
        </div>
      ) : null}

      {products.length > 0 ? (
        <section className="mt-10" aria-labelledby="prod-fav">
          <h2 id="prod-fav" className="text-xl font-extrabold">Produtos</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  kind: 'AUTOMATION',
                  currency: 'BRL',
                  salesCount: 0,
                  publishedAt: null,
                  category: { slug: '', name: 'Produto' },
                  author: { id: '', name: product.author.name, avatarUrl: null },
                  tags: [],
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {professionals.length > 0 ? (
        <section className="mt-12" aria-labelledby="pro-fav">
          <h2 id="pro-fav" className="text-xl font-extrabold">Profissionais</h2>
          <ul className="mt-5 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((professional) => (
              <li key={professional.id}>
                <Card interactive className="relative flex h-full flex-col gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={professional.user.name} src={professional.user.avatarUrl} size={42} />
                    <div className="min-w-0">
                      <h3 className="text-[15.5px] font-bold">
                        <Link
                          href={`/professionals/${professional.slug}`}
                          className="text-ink no-underline after:absolute after:inset-0 after:content-['']"
                        >
                          {professional.user.name}
                        </Link>
                      </h3>
                      <p className="truncate text-[12.5px] text-muted">{professional.headline}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                    <Stars
                      value={averageRating(professional.ratingSum, professional.ratingCount)}
                      count={professional.ratingCount}
                    />
                    <span className="text-[14px] font-extrabold">
                      {formatBRLCompact(professional.startingAtCents)}
                    </span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
