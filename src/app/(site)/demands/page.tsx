import type { Metadata } from 'next';
import Link from 'next/link';

import { LinkButton } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Avatar, Card, EmptyState, Eyebrow, Tag } from '@/components/ui/primitives';
import { formatRange } from '@/lib/money';
import { excerpt, formatRelative } from '@/lib/text';
import { demandQuerySchema } from '@/lib/validation';
import { listDemands } from '@/server/services/demands';

export const metadata: Metadata = {
  title: 'Demandas abertas',
  description:
    'Empresas descrevendo problemas reais de automação e IA. Envie sua proposta com escopo, prazo e valor.',
  alternates: { canonical: '/demands' },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DemandsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query = demandQuerySchema.parse(raw);
  const { items, total, page, pageCount } = await listDemands(query);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && key !== 'page') params.set(key, value);
  }

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-12 lg:px-10 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Eyebrow>Demandas</Eyebrow>
          <h1 className="mt-3 text-[36px] font-extrabold leading-[1.05] sm:text-[44px]">Demandas</h1>
          <p className="mt-4 max-w-[54ch] text-[16.5px] leading-relaxed text-ink-body">
            Problemas reais publicados por empresas. Se você constrói, é aqui que o trabalho começa.
          </p>
        </div>
        <LinkButton href="/demands/new" size="lg">Publicar demanda</LinkButton>
      </div>

      <p className="mt-9 text-[13.5px] text-muted" role="status">
        {total} {total === 1 ? 'demanda aberta' : 'demandas abertas'}
      </p>

      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Nenhuma demanda aberta agora"
            description="Assim que uma empresa publicar um problema, ele aparece aqui. Se você é quem precisa, publique o seu."
            action={<LinkButton href="/demands/new">Publicar demanda</LinkButton>}
          />
        </div>
      ) : (
        <ul className="mt-5 flex list-none flex-col gap-4 p-0">
          {items.map((demand) => (
            <li key={demand.id}>
              <Card interactive className="relative p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone={demand.status === 'OPEN' ? 'positive' : 'warning'}>
                    {demand.status === 'OPEN' ? 'Aberta' : 'Em análise'}
                  </Tag>
                  {demand.tools.slice(0, 3).map((tool) => (
                    <Tag key={tool}>{tool}</Tag>
                  ))}
                </div>

                <h2 className="mt-3 text-[19px] font-bold leading-snug">
                  <Link
                    href={`/demands/${demand.id}`}
                    className="text-ink no-underline after:absolute after:inset-0 after:content-[''] hover:text-brand-strong"
                  >
                    {demand.title}
                  </Link>
                </h2>

                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-body">
                  {excerpt(demand.problem, 220)}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4 text-[13px]">
                  <span className="flex items-center gap-2">
                    <Avatar name={demand.buyer.name} src={demand.buyer.avatarUrl} size={24} />
                    <span className="text-muted">{demand.buyer.name}</span>
                  </span>
                  <span className="font-semibold">
                    {formatRange(demand.budgetMinCents, demand.budgetMaxCents)}
                  </span>
                  <span className="text-muted">{demand.deadlineDays} dias de prazo</span>
                  <span className="text-muted">
                    {demand.proposalCount}{' '}
                    {demand.proposalCount === 1 ? 'proposta' : 'propostas'}
                  </span>
                  <time dateTime={new Date(demand.createdAt).toISOString()} className="ml-auto text-muted">
                    {formatRelative(demand.createdAt)}
                  </time>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} pageCount={pageCount} baseParams={params} className="mt-12" />
    </div>
  );
}
