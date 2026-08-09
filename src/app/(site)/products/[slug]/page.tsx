import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PRODUCT_KIND_LABEL, ProductCard } from '@/components/marketplace/product-card';
import { Avatar, Card, Panel, Stars, Tag, Thumb } from '@/components/ui/primitives';
import { BuyPanel } from '@/features/products/buy-panel';
import { ReviewSection } from '@/features/products/review-section';
import { publicEnv } from '@/config/env';
import { formatBRL } from '@/lib/money';
import { averageRating, formatDate, toParagraphs } from '@/lib/text';
import { currentUser } from '@/server/auth/authorize';
import { getProductBySlug, relatedProducts } from '@/server/services/products';
import { listProductReviews, ratingBreakdown, reviewEligibility } from '@/server/services/reviews';
import { hasPurchased } from '@/server/services/orders';

type Params = Promise<{ slug: string }>;

/**
 * Metadados dinâmicos.
 *
 * Cada produto tem título, descrição, canônica e Open Graph próprios. Sem
 * isso, mil páginas de produto competem entre si com o mesmo título no
 * buscador e nenhuma delas ranqueia — é o defeito de SEO mais caro e mais
 * comum em marketplace.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, null);

  if (!product) return { title: 'Produto não encontrado', robots: { index: false } };

  const url = `${publicEnv.NEXT_PUBLIC_APP_URL}/products/${product.slug}`;

  return {
    title: product.name,
    description: product.tagline,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: 'website',
      url,
      title: product.name,
      description: product.tagline,
      ...(product.coverImageUrl ? { images: [{ url: product.coverImageUrl }] } : {}),
    },
    twitter: { card: 'summary_large_image', title: product.name, description: product.tagline },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const viewer = await currentUser();
  const product = await getProductBySlug(slug, viewer);

  if (!product) notFound();

  const [related, reviews, breakdown, eligibility, owned] = await Promise.all([
    relatedProducts({ id: product.id, categoryId: product.category.id }),
    listProductReviews(product.id),
    ratingBreakdown(product.id),
    reviewEligibility(viewer?.id ?? null, product.id),
    viewer ? hasPurchased(viewer.id, product.id) : Promise.resolve(false),
  ]);

  const rating = averageRating(product.ratingSum, product.ratingCount);
  const isOwner = viewer?.id === product.authorId;

  /**
   * Dado estruturado.
   *
   * É o que faz o resultado de busca mostrar preço e estrelas em vez de só um
   * link azul. `JSON.stringify` de um objeto montado aqui — nunca concatenação
   * de string com conteúdo do usuário, que seria injeção de script.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.tagline,
    ...(product.coverImageUrl ? { image: product.coverImageUrl } : {}),
    brand: { '@type': 'Brand', name: 'AUTOMATIZE' },
    offers: {
      '@type': 'Offer',
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: product.currency,
      availability: 'https://schema.org/InStock',
      url: `${publicEnv.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
    },
    ...(rating !== null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[1200px] px-5 py-10 lg:px-10 lg:py-14">
        {product.status !== 'PUBLISHED' ? (
          <p
            role="status"
            className="mb-6 rounded-[var(--radius-btn)] border border-warning/20 bg-warning-subtle px-4 py-3 text-sm text-warning"
          >
            Este produto está como <strong>{product.status}</strong> e só é visível para você.
          </p>
        ) : null}

        <nav aria-label="Trilha" className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
          <Link href="/products" className="no-underline hover:text-brand-strong">Produtos</Link>
          <span aria-hidden>/</span>
          <Link href={`/products?category=${product.category.slug}`} className="no-underline hover:text-brand-strong">
            {product.category.name}
          </Link>
        </nav>

        <div className="grid gap-10 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          {/* ------------------------------------------------- Conteúdo */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="brand">{PRODUCT_KIND_LABEL[product.kind] ?? product.kind}</Tag>
              <Tag>{product.category.name}</Tag>
            </div>

            <h1 className="mt-4 text-[34px] font-extrabold leading-[1.08] sm:text-[42px]">
              {product.name}
            </h1>

            <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-ink-body">
              {product.tagline}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={
                  product.author.professionalProfile
                    ? `/professionals/${product.author.professionalProfile.slug}`
                    : '#'
                }
                className="flex items-center gap-2.5 no-underline"
              >
                <Avatar name={product.author.name} src={product.author.avatarUrl} size={34} />
                <span>
                  <span className="block text-[14px] font-semibold text-ink">
                    {product.author.name}
                  </span>
                  <span className="block text-[12.5px] text-muted">Criador</span>
                </span>
              </Link>
              <Stars value={rating} count={product.ratingCount} size={16} />
              <span className="text-[13px] text-muted">
                {product.salesCount} {product.salesCount === 1 ? 'venda' : 'vendas'}
              </span>
            </div>

            {product.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.coverImageUrl}
                alt={`Prévia de ${product.name}`}
                className="mt-8 w-full rounded-[var(--radius-panel)] border border-line object-cover"
              />
            ) : (
              <Thumb className="mt-8 h-64 w-full" />
            )}

            <section className="mt-10" aria-labelledby="sobre">
              <h2 id="sobre" className="text-2xl font-extrabold">Sobre esta solução</h2>
              <div className="mt-4 flex flex-col gap-4">
                {toParagraphs(product.description).map((paragraph, index) => (
                  <p key={index} className="text-[16px] leading-[1.7] text-ink-body">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            {product.requiredTools.length > 0 || product.integrations.length > 0 ? (
              <section className="mt-10" aria-labelledby="compat">
                <h2 id="compat" className="text-2xl font-extrabold">Compatibilidade</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {product.requiredTools.length > 0 ? (
                    <Card className="p-5">
                      <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                        Ferramentas necessárias
                      </h3>
                      <ul className="mt-3 flex list-none flex-wrap gap-1.5 p-0">
                        {product.requiredTools.map((tool) => (
                          <li key={tool}><Tag tone="brand">{tool}</Tag></li>
                        ))}
                      </ul>
                    </Card>
                  ) : null}

                  {product.integrations.length > 0 ? (
                    <Card className="p-5">
                      <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                        Integra com
                      </h3>
                      <ul className="mt-3 flex list-none flex-wrap gap-1.5 p-0">
                        {product.integrations.map((integration) => (
                          <li key={integration}><Tag>{integration}</Tag></li>
                        ))}
                      </ul>
                    </Card>
                  ) : null}
                </div>
              </section>
            ) : null}

            {product.files.length > 0 ? (
              <section className="mt-10" aria-labelledby="incluso">
                <h2 id="incluso" className="text-2xl font-extrabold">O que está incluído</h2>
                <ul className="mt-4 flex list-none flex-col gap-2 p-0">
                  {product.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line px-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[14.5px] font-semibold">
                          {file.filename}
                        </span>
                        <span className="block text-[12.5px] text-muted">
                          versão {file.version} · {(file.sizeBytes / 1_048_576).toFixed(1)} MB
                        </span>
                      </span>
                      <Tag tone={owned ? 'positive' : 'neutral'}>
                        {owned ? 'Disponível' : 'Após a compra'}
                      </Tag>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {product.requirements ? (
              <section className="mt-10" aria-labelledby="requisitos">
                <h2 id="requisitos" className="text-2xl font-extrabold">Requisitos</h2>
                <p className="mt-4 text-[16px] leading-[1.7] text-ink-body">{product.requirements}</p>
              </section>
            ) : null}

            <ReviewSection
              productId={product.id}
              reviews={reviews.items}
              breakdown={breakdown}
              average={rating}
              total={product.ratingCount}
              canReview={eligibility.canReview && !isOwner}
              existing={eligibility.existing}
              signedIn={Boolean(viewer)}
            />
          </div>

          {/* ------------------------------------------------------ Compra */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <BuyPanel
              productId={product.id}
              priceLabel={product.priceCents === 0 ? 'Grátis' : formatBRL(product.priceCents)}
              owned={owned}
              isOwner={isOwner}
              signedIn={Boolean(viewer)}
              publishedAt={product.publishedAt ? formatDate(product.publishedAt) : null}
              slug={product.slug}
            />

            <Panel className="mt-4 p-5">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                Como funciona a compra
              </h2>
              <ol className="mt-3 flex list-none flex-col gap-3 p-0 text-[13.5px] leading-relaxed text-ink-body">
                {[
                  'Você paga pelo checkout seguro — o cartão nunca passa pelos nossos servidores.',
                  'A confirmação chega do provedor de pagamento direto ao nosso servidor.',
                  'O produto aparece na sua biblioteca com os arquivos liberados.',
                  'Atualizações do criador ficam disponíveis sem custo adicional.',
                ].map((step, index) => (
                  <li key={index} className="flex gap-2.5">
                    <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-brand-subtle text-[11px] font-bold text-brand-strong">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Panel>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="mt-20" aria-labelledby="relacionados">
            <h2 id="relacionados" className="text-2xl font-extrabold">Produtos relacionados</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
