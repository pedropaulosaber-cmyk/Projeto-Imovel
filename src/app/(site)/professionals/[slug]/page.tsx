import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductCard } from '@/components/marketplace/product-card';
import { LinkButton } from '@/components/ui/button';
import { Avatar, Card, Eyebrow, Panel, Stars, Tag } from '@/components/ui/primitives';
import { formatBRLCompact } from '@/lib/money';
import { averageRating, formatDate, toParagraphs } from '@/lib/text';
import { getProfessionalBySlug } from '@/server/services/professionals';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const professional = await getProfessionalBySlug(slug);

  if (!professional) return { title: 'Perfil não encontrado', robots: { index: false } };

  return {
    title: `${professional.user.name} — ${professional.headline}`,
    description: professional.headline,
    alternates: { canonical: `/professionals/${professional.slug}` },
    openGraph: { title: professional.user.name, description: professional.headline },
  };
}

export default async function ProfessionalPage({ params }: { params: Params }) {
  const { slug } = await params;
  const professional = await getProfessionalBySlug(slug);

  if (!professional) notFound();

  const rating = averageRating(professional.ratingSum, professional.ratingCount);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 lg:px-10 lg:py-14">
      <div className="grid gap-10 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start gap-5">
            <Avatar name={professional.user.name} src={professional.user.avatarUrl} size={82} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[32px] font-extrabold leading-tight">
                  {professional.user.name}
                </h1>
                {professional.verifiedAt ? (
                  <Tag tone="positive">Verificado</Tag>
                ) : null}
              </div>
              <p className="mt-1.5 text-[17px] leading-relaxed text-ink-body">
                {professional.headline}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
                <Stars value={rating} count={professional.ratingCount} />
                <span>
                  {professional.projectsClosed}{' '}
                  {professional.projectsClosed === 1 ? 'projeto concluído' : 'projetos concluídos'}
                </span>
                {professional.location ? <span>{professional.location}</span> : null}
                <span>Responde em até {professional.responseHours}h</span>
              </div>
            </div>
          </div>

          <section className="mt-10" aria-labelledby="sobre-pro">
            <h2 id="sobre-pro" className="text-2xl font-extrabold">Sobre</h2>
            <div className="mt-4 flex flex-col gap-4">
              {toParagraphs(professional.bio).map((paragraph, index) => (
                <p key={index} className="text-[16px] leading-[1.7] text-ink-body">{paragraph}</p>
              ))}
            </div>
          </section>

          {professional.specialties.length > 0 || professional.tools.length > 0 ? (
            <section className="mt-10" aria-labelledby="expertise">
              <h2 id="expertise" className="text-2xl font-extrabold">Especialidades e ferramentas</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <Card className="p-5">
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                    Especialidades
                  </h3>
                  <ul className="mt-3 flex list-none flex-wrap gap-1.5 p-0">
                    {professional.specialties.map((item) => (
                      <li key={item}><Tag tone="brand">{item}</Tag></li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-5">
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                    Ferramentas
                  </h3>
                  <ul className="mt-3 flex list-none flex-wrap gap-1.5 p-0">
                    {professional.tools.map((item) => (
                      <li key={item}><Tag>{item}</Tag></li>
                    ))}
                  </ul>
                </Card>
              </div>
            </section>
          ) : null}

          {professional.portfolio.length > 0 ? (
            <section className="mt-10" aria-labelledby="portfolio">
              <h2 id="portfolio" className="text-2xl font-extrabold">Portfólio</h2>
              <ul className="mt-5 flex list-none flex-col gap-4 p-0">
                {professional.portfolio.map((item) => (
                  <li key={item.id}>
                    <Card className="p-6">
                      <h3 className="text-[17px] font-bold">{item.title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-ink-body">{item.summary}</p>
                      {item.outcome ? (
                        <p className="mt-3 inline-flex rounded-[var(--radius-thumb)] bg-positive-subtle px-3 py-1.5 text-[13.5px] font-semibold text-positive">
                          {item.outcome}
                        </p>
                      ) : null}
                      {item.externalUrl ? (
                        <p className="mt-3">
                          <a href={item.externalUrl} rel="noopener noreferrer nofollow" target="_blank" className="text-[13.5px]">
                            Ver o projeto ↗
                          </a>
                        </p>
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {professional.services.length > 0 ? (
            <section className="mt-10" aria-labelledby="servicos">
              <h2 id="servicos" className="text-2xl font-extrabold">Serviços</h2>
              <ul className="mt-5 grid list-none gap-4 p-0 sm:grid-cols-2">
                {professional.services.map((service) => (
                  <li key={service.id}>
                    <Card className="flex h-full flex-col p-5">
                      <h3 className="text-[15.5px] font-bold">{service.name}</h3>
                      <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-body">
                        {service.description}
                      </p>
                      <p className="mt-3 border-t border-line pt-3 text-[15px] font-extrabold">
                        {formatBRLCompact(service.priceCents)}
                        <span className="ml-2 text-[12.5px] font-medium text-muted">
                          entrega em {service.deliveryDays} dias
                        </span>
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {professional.user.products.length > 0 ? (
            <section className="mt-10" aria-labelledby="produtos-pro">
              <h2 id="produtos-pro" className="text-2xl font-extrabold">Produtos publicados</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {professional.user.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      kind: 'AUTOMATION',
                      currency: 'BRL',
                      salesCount: 0,
                      publishedAt: null,
                      category: { slug: '', name: 'Produto' },
                      author: { id: professional.user.id, name: professional.user.name, avatarUrl: professional.user.avatarUrl },
                      tags: [],
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* --------------------------------------------------- Contratação */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="p-6">
            <Eyebrow>Contratar</Eyebrow>
            <p className="mt-3 text-[12.5px] text-muted">a partir de</p>
            <p className="text-[30px] font-extrabold leading-none tracking-tight">
              {formatBRLCompact(professional.startingAtCents)}
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              <LinkButton href={`/demands/new?pro=${professional.slug}`} fullWidth size="lg">
                Solicitar proposta
              </LinkButton>
              <LinkButton href={`/messages/new?to=${professional.user.id}`} variant="secondary" fullWidth>
                Enviar mensagem
              </LinkButton>
            </div>

            <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
              Você descreve o problema, recebe uma proposta com escopo e prazo, e decide sem
              compromisso.
            </p>
          </Card>

          <Panel className="mt-4 p-5">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
              Como a contratação funciona
            </h2>
            <ol className="mt-3 flex list-none flex-col gap-3 p-0 text-[13.5px] leading-relaxed text-ink-body">
              {[
                'Você descreve o problema e o orçamento.',
                'O profissional envia proposta com escopo, prazo e valor.',
                'Vocês conversam pela plataforma e ajustam o que for preciso.',
                'Ao aceitar, o registro do combinado fica guardado aqui.',
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

          <p className="mt-4 text-center text-[12.5px] text-muted">
            No marketplace desde {formatDate(professional.user.createdAt)}
          </p>
        </aside>
      </div>

      <p className="mt-14 text-center text-[13.5px] text-muted">
        Procurando outro perfil? <Link href="/professionals">Ver todos os profissionais</Link>
      </p>
    </div>
  );
}
