import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProductCard, ProductCardSkeleton } from '@/components/marketplace/product-card';
import { LinkButton } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, Eyebrow } from '@/components/ui/primitives';
import { ProductFilters } from '@/features/products/filters';
import { productQuerySchema } from '@/lib/validation';
import { listCategories, listProducts } from '@/server/services/products';

export const metadata: Metadata = {
  title: 'Soluções de IA prontas para usar',
  description:
    'Agentes de IA, automações, workflows e templates publicados por criadores verificados. Filtre por categoria, ferramenta e preço.',
  alternates: { canonical: '/products' },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Vitrine de produtos.
 *
 * ## A busca acontece no servidor
 *
 * Filtro, ordenação e paginação viram uma consulta com `WHERE`, `ORDER BY` e
 * `LIMIT`. A alternativa comum — carregar tudo e filtrar no navegador —
 * funciona com 50 produtos e derruba a página com 5 mil, que é exatamente o
 * número que se quer alcançar.
 */
async function ProductGrid({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query = productQuerySchema.parse(raw);
  const { items, total, page, pageCount } = await listProducts(query);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && key !== 'page') params.set(key, value);
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhuma solução encontrada"
        description="Tente outros termos ou remova alguns filtros. Se o que você precisa não existe aqui ainda, publique uma demanda e receba propostas de quem constrói."
        action={<LinkButton href="/demands/new">Publicar uma demanda</LinkButton>}
      />
    );
  }

  return (
    <>
      <p className="text-[13.5px] text-muted" role="status">
        {total} {total === 1 ? 'solução encontrada' : 'soluções encontradas'}
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Pagination page={page} pageCount={pageCount} baseParams={params} className="mt-12" />
    </>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 lg:px-10 lg:py-16">
      <Eyebrow>Marketplace</Eyebrow>
      <h1 className="mt-3 max-w-[18ch] text-[36px] font-extrabold leading-[1.05] sm:text-[44px]">
        Soluções prontas para colocar a IA para trabalhar.
      </h1>
      <p className="mt-4 max-w-[56ch] text-[16.5px] leading-relaxed text-ink-body">
        Tudo aqui passou por curadoria antes de ser publicado, e só quem comprou pode avaliar.
      </p>

      <div className="mt-9">
        <Suspense fallback={<div className="shimmer h-36 rounded-[var(--radius-card)]" />}>
          <ProductFilters categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
        </Suspense>
      </div>

      <div className="mt-8">
        {/*
          A chave force o Suspense a remontar quando os filtros mudam, o que
          faz o esqueleto reaparecer em vez de a lista antiga ficar congelada
          sem sinal de carregamento.
        */}
        <Suspense
          key={JSON.stringify(await searchParams)}
          fallback={
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          }
        >
          <ProductGrid searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
