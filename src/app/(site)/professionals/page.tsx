import type { Metadata } from 'next';
import Link from 'next/link';

import { LinkButton } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Avatar, Card, EmptyState, Eyebrow, Stars, Tag } from '@/components/ui/primitives';
import { formatBRLCompact } from '@/lib/money';
import { averageRating } from '@/lib/text';
import { professionalQuerySchema } from '@/lib/validation';
import { listProfessionals, popularSpecialties } from '@/server/services/professionals';

export const metadata: Metadata = {
  title: 'Profissionais de IA e automação',
  description:
    'Especialistas com portfólio, avaliações e preço inicial visível. Compare e contrate quem já resolveu um problema parecido com o seu.',
  alternates: { canonical: '/professionals' },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const AVAILABILITY: Record<string, { label: string; tone: 'positive' | 'warning' | 'neutral' }> = {
  AVAILABLE: { label: 'Disponível', tone: 'positive' },
  LIMITED: { label: 'Agenda limitada', tone: 'warning' },
  UNAVAILABLE: { label: 'Sem agenda', tone: 'neutral' },
};

export default async function ProfessionalsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query = professionalQuerySchema.parse(raw);
  const [{ items, total, page, pageCount }, specialties] = await Promise.all([
    listProfessionals(query),
    popularSpecialties(),
  ]);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && key !== 'page') params.set(key, value);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 lg:px-10 lg:py-16">
      <Eyebrow>Profissionais</Eyebrow>
      <h1 className="mt-3 max-w-[20ch] text-[36px] font-extrabold leading-[1.05] sm:text-[44px]">
        Encontre quem pode construir sua próxima automação.
      </h1>
      <p className="mt-4 max-w-[56ch] text-[16.5px] leading-relaxed text-ink-body">
        Portfólio, avaliação de clientes reais e preço inicial declarado. Sem leilão às cegas.
      </p>

      {specialties.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/professionals"
            className={`rounded-full border px-3.5 py-[7px] text-[13px] font-medium no-underline ${
              query.specialty ? 'border-line text-ink-soft' : 'border-brand bg-brand text-white'
            }`}
          >
            Todas
          </Link>
          {specialties.map((specialty) => (
            <Link
              key={specialty}
              href={`/professionals?specialty=${encodeURIComponent(specialty)}`}
              className={`rounded-full border px-3.5 py-[7px] text-[13px] font-medium no-underline ${
                query.specialty === specialty
                  ? 'border-brand bg-brand text-white'
                  : 'border-line text-ink-soft hover:border-brand'
              }`}
            >
              {specialty}
            </Link>
          ))}
        </div>
      ) : null}

      <p className="mt-8 text-[13.5px] text-muted" role="status">
        {total} {total === 1 ? 'profissional' : 'profissionais'}
      </p>

      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Nenhum profissional encontrado"
            description="Ajuste os filtros ou publique sua demanda — profissionais que atendem ao seu caso vão até você."
            action={<LinkButton href="/demands/new">Publicar demanda</LinkButton>}
          />
        </div>
      ) : (
        <ul className="mt-5 grid list-none gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
          {items.map((professional) => {
            const rating = averageRating(professional.ratingSum, professional.ratingCount);
            const availability = AVAILABILITY[professional.availability] ?? AVAILABILITY.UNAVAILABLE!;

            return (
              <li key={professional.id}>
                <Card interactive className="relative flex h-full flex-col gap-3 p-6">
                  <div className="flex items-start gap-3">
                    <Avatar name={professional.user.name} src={professional.user.avatarUrl} size={46} />
                    <div className="min-w-0">
                      <h2 className="text-[16px] font-bold leading-tight">
                        <Link
                          href={`/professionals/${professional.slug}`}
                          className="text-ink no-underline after:absolute after:inset-0 after:content-[''] hover:text-brand-strong"
                        >
                          {professional.user.name}
                        </Link>
                      </h2>
                      {professional.location ? (
                        <p className="mt-0.5 text-[12.5px] text-muted">{professional.location}</p>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-[14px] leading-relaxed text-ink-body">{professional.headline}</p>

                  <ul className="flex list-none flex-wrap gap-1.5 p-0">
                    {professional.specialties.slice(0, 3).map((specialty) => (
                      <li key={specialty}><Tag tone="brand">{specialty}</Tag></li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
                    <div>
                      <Stars value={rating} count={professional.ratingCount} />
                      <p className="mt-1 text-[12px] text-muted">
                        {professional.projectsClosed}{' '}
                        {professional.projectsClosed === 1 ? 'projeto' : 'projetos'} · responde em{' '}
                        {professional.responseHours}h
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11.5px] text-muted">a partir de</p>
                      <p className="text-[16px] font-extrabold">
                        {formatBRLCompact(professional.startingAtCents)}
                      </p>
                    </div>
                  </div>

                  <Tag tone={availability.tone} className="absolute right-4 top-4">
                    {availability.label}
                  </Tag>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} pageCount={pageCount} baseParams={params} className="mt-12" />
    </div>
  );
}
