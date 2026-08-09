import Link from 'next/link';

import { ProductCard } from '@/components/marketplace/product-card';
import { LinkButton } from '@/components/ui/button';
import { Card, Eyebrow, Panel, SectionTitle, Tag } from '@/components/ui/primitives';
import { compactNumber } from '@/lib/text';
import { listCategories, listProducts, platformStats } from '@/server/services/products';

/**
 * Página inicial.
 *
 * Server Component com dados reais do catálogo — não uma vitrine com números
 * inventados. Um marketplace que anuncia "1.200 produtos" e mostra oito perde
 * a confiança no primeiro clique, e confiança é o único ativo que um
 * intermediário tem.
 *
 * ## Cache
 *
 * A home revalida a cada 5 minutos. Ela é a página mais visitada e a menos
 * sensível ao instante: um produto publicado agora aparecer daqui a cinco
 * minutos não incomoda ninguém, e renderizar do zero a cada visita seria
 * pagar banco por tráfego de topo de funil.
 */
export const revalidate = 300;

async function heroStats() {
  const stats = await platformStats();

  return [
    { value: stats.products, label: 'soluções publicadas' },
    { value: stats.professionals, label: 'profissionais verificados' },
    { value: stats.demands, label: 'demandas abertas' },
  ];
}

const PATHS = [
  {
    title: 'Compre pronto',
    body: 'Agentes, automações e workflows já construídos e testados. Baixe, conecte às suas ferramentas e coloque para rodar hoje.',
    href: '/products',
    cta: 'Ver soluções',
    icon: (
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2.3 2.3A1 1 0 0 0 5.4 17H17M16 21a1 1 0 1 0 2 0 1 1 0 0 0-2 0M8 21a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
    ),
  },
  {
    title: 'Contrate quem constrói',
    body: 'Especialistas em IA e automação com portfólio, avaliações e preço inicial visível. Você escolhe, negocia e contrata.',
    href: '/professionals',
    cta: 'Ver profissionais',
    icon: (
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    ),
  },
  {
    title: 'Publique sua demanda',
    body: 'Descreva o problema e receba propostas de quem já resolveu igual. Compare prazo, escopo e valor antes de decidir.',
    href: '/demands/new',
    cta: 'Publicar demanda',
    icon: <path d="M12 5v14M5 12h14" />,
  },
] as const;

const TRUST = [
  {
    title: 'Curadoria antes da publicação',
    body: 'Todo produto passa por análise da nossa equipe antes de aparecer no marketplace. Nada é publicado automaticamente.',
  },
  {
    title: 'Avaliação só de quem comprou',
    body: 'A nota vem exclusivamente de compradores verificados. Não existe avaliação de quem nunca usou.',
  },
  {
    title: 'Entrega protegida',
    body: 'Os arquivos ficam em armazenamento privado e são liberados por link temporário só depois do pagamento confirmado.',
  },
  {
    title: 'Preço sem surpresa',
    body: 'O que está na página é o que você paga. A comissão de 15% sai do vendedor, nunca do comprador.',
  },
] as const;

export default async function HomePage() {
  const [stats, categories, featured] = await Promise.all([
    heroStats(),
    listCategories(),
    listProducts({ sort: 'sales', page: 1 }),
  ]);

  return (
    <>
      {/*
        -------------------------------------------------------------- Hero

        As colunas usam `minmax(0, Nfr)` e não `Nfr` cru.

        A diferença decide se a página rola na horizontal no celular: uma
        trilha `1fr` tem largura mínima automática, então um item que não
        encolhe (aqui, o painel de prévia com textos que não quebram) estica a
        coluna além do container. Foi exatamente o que aconteceu — grid de
        390px com coluna de 443px — e o sintoma aparecia longe da causa, num
        `<span>` do texto de apoio.

        `minmax(0, …)` deixa a coluna encolher. É o mesmo motivo pelo qual as
        classes `grid-cols-N` do Tailwind já vêm com `minmax(0, 1fr)`.
      */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1200px] items-start gap-14 px-5 pb-16 pt-14 grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:px-10 lg:pb-24 lg:pt-[72px]">
          <div className="rise min-w-0">
            <Eyebrow>O marketplace de soluções de IA</Eyebrow>

            <h1 className="mt-4 max-w-[14ch] text-[42px] font-extrabold leading-[1.02] sm:text-[54px] lg:text-[66px]">
              Sua próxima <span className="text-brand">automação</span> já pode estar pronta.
            </h1>

            <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.55] text-ink-body sm:text-[19px]">
              Encontre soluções de IA, compre produtos prontos ou contrate especialistas para
              construir o que sua empresa precisa.
            </p>

            {/*
              Empilhado e largura cheia no celular.

              Não é preferência estética: o segundo rótulo tem 37 caracteres e
              os botões carregam `whitespace-nowrap`, então lado a lado em
              390px ele estourava a viewport e fazia a home inteira rolar na
              horizontal. Largura cheia também dá um alvo de toque melhor.
            */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <LinkButton href="/products" size="lg" className="whitespace-normal">
                Explorar soluções →
              </LinkButton>
              <LinkButton
                href="/demands/new"
                variant="secondary"
                size="lg"
                className="whitespace-normal text-center"
              >
                Preciso de uma solução personalizada
              </LinkButton>
            </div>

            <p className="mt-4 text-[13.5px] text-muted">
              Compre soluções prontas ou encontre quem pode construí-las para você.
            </p>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-line pt-5">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-2xl font-extrabold tracking-tight">
                      {compactNumber(stat.value)}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-muted">{stat.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Prévia do marketplace — a mesma do Canvas, com produtos reais. */}
          <Panel className="p-4 shadow-[var(--shadow-panel)]">
            <div className="flex items-center gap-2 px-1 pb-3">
              <span className="h-2 w-2 rounded-full bg-[#CBD5E1]" />
              <span className="h-2 w-2 rounded-full bg-[#CBD5E1]" />
              <span className="h-2 w-2 rounded-full bg-[#CBD5E1]" />
              <span className="ml-2 text-[11.5px] text-muted">automatize.com.br/products</span>
            </div>

            <div className="rounded-[var(--radius-field)] border border-line bg-paper p-4">
              <div className="flex items-center gap-2.5 rounded-[9px] border border-line px-3 py-2.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.2-3.2" />
                </svg>
                <span className="text-[13px] text-muted">qualificação de leads</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag tone="brand">Agentes de IA</Tag>
                <Tag>Automações</Tag>
                <Tag>Workflows</Tag>
                <Tag>Vendas</Tag>
              </div>

              <ul className="mt-3.5 flex list-none flex-col gap-2.5 p-0">
                {featured.items.slice(0, 3).map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 rounded-[var(--radius-thumb)] border border-line p-2.5"
                  >
                    <span className="thumb-gradient h-11 w-11 flex-none rounded-lg border border-line" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold">{product.name}</span>
                      <span className="block truncate text-[12px] text-muted">
                        {product.category.name}
                      </span>
                    </span>
                  </li>
                ))}
                {featured.items.length === 0 ? (
                  <li className="rounded-[var(--radius-thumb)] border border-dashed border-line p-4 text-center text-[13px] text-muted">
                    O catálogo abre em breve.
                  </li>
                ) : null}
              </ul>
            </div>
          </Panel>
        </div>
      </section>

      {/* --------------------------------------------------- Três caminhos */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 lg:px-10 lg:py-24">
        <Eyebrow>Como funciona</Eyebrow>
        <SectionTitle className="mt-3 max-w-[18ch]">Três caminhos. Um lugar só.</SectionTitle>
        <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-ink-body">
          Nem todo problema tem solução pronta, e nem todo problema precisa de um projeto do zero.
          Aqui os três caminhos convivem.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PATHS.map((path) => (
            <Card key={path.title} className="flex flex-col gap-3 p-6">
              <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-thumb)] bg-brand-subtle text-brand">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {path.icon}
                </svg>
              </span>
              <h3 className="text-lg font-bold">{path.title}</h3>
              <p className="text-[14.5px] leading-relaxed text-ink-body">{path.body}</p>
              <Link
                href={path.href}
                className="mt-auto pt-2 text-[14.5px] font-semibold text-brand-strong no-underline hover:text-brand-deep"
              >
                {path.cta} →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- Categorias */}
      {categories.length > 0 ? (
        <section className="border-y border-line bg-canvas">
          <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-10 lg:py-20">
            <Eyebrow>Categorias</Eyebrow>
            <SectionTitle className="mt-3">O que você precisa automatizar?</SectionTitle>

            <ul className="mt-9 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="flex h-full items-start justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-5 no-underline transition-colors hover:border-brand"
                  >
                    <span>
                      <span className="block text-[15.5px] font-bold text-ink">{category.name}</span>
                      {category.description ? (
                        <span className="mt-1 block text-[13.5px] leading-relaxed text-muted">
                          {category.description}
                        </span>
                      ) : null}
                    </span>
                    <span className="whitespace-nowrap rounded-full bg-line-soft px-2.5 py-1 text-[12px] font-semibold text-ink-body">
                      {category._count.products}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* --------------------------------------------------------- Destaque */}
      {featured.items.length > 0 ? (
        <section className="mx-auto max-w-[1200px] px-5 py-16 lg:px-10 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Mais vendidos</Eyebrow>
              <SectionTitle className="mt-3">Soluções que já estão rodando.</SectionTitle>
            </div>
            <LinkButton href="/products" variant="secondary">
              Ver tudo
            </LinkButton>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {/* -------------------------------------------------------- Confiança */}
      <section className="border-t border-line bg-canvas">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-10 lg:py-24">
          <Eyebrow>Confiança</Eyebrow>
          <SectionTitle className="mt-3 max-w-[20ch]">
            Feito para comprar com confiança.
          </SectionTitle>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {TRUST.map((item) => (
              <Card key={item.title} className="flex gap-4 p-6">
                <span className="mt-0.5 flex-none text-positive">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[16px] font-bold">{item.title}</span>
                  <span className="mt-1.5 block text-[14.5px] leading-relaxed text-ink-body">
                    {item.body}
                  </span>
                </span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- CTA final */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 lg:px-10">
        <div className="rounded-[var(--radius-panel)] bg-brand-deep px-6 py-14 text-center sm:px-14">
          <h2 className="mx-auto max-w-[22ch] text-[32px] font-extrabold leading-tight text-white sm:text-[40px]">
            O que você precisa automatizar já pode estar pronto.
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-[16px] leading-relaxed text-white/70">
            Comece explorando o catálogo. Se nada servir exatamente, publique sua demanda e receba
            propostas de quem constrói.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/products" size="lg">
              Explorar soluções
            </LinkButton>
            <LinkButton
              href="/demands/new"
              size="lg"
              variant="secondary"
              className="border-white/25 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
            >
              Publicar uma demanda
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
