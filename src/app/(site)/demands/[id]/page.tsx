import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Avatar, Card, EmptyState, Panel, Stars, Tag } from '@/components/ui/primitives';
import { LinkButton } from '@/components/ui/button';
import { ProposalActions, ProposalForm } from '@/features/demands/proposal-panel';
import { formatBRLCompact, formatRange } from '@/lib/money';
import { averageRating, formatRelative, toParagraphs } from '@/lib/text';
import { currentUser, hasRole } from '@/server/auth/authorize';
import { getDemand } from '@/server/services/demands';

type Params = Promise<{ id: string }>;

export const metadata: Metadata = {
  // Demanda contém descrição operacional interna de uma empresa. Indexar isso
  // exporia detalhe de processo de um cliente para qualquer busca — o tipo de
  // vazamento que não é falha técnica, é falha de julgamento.
  robots: { index: false, follow: false },
};

const STATUS: Record<string, { label: string; tone: 'positive' | 'warning' | 'neutral' | 'brand' }> = {
  OPEN: { label: 'Aberta para propostas', tone: 'positive' },
  IN_REVIEW: { label: 'Em análise', tone: 'warning' },
  AWARDED: { label: 'Profissional escolhido', tone: 'brand' },
  CLOSED: { label: 'Encerrada', tone: 'neutral' },
  CANCELLED: { label: 'Cancelada', tone: 'neutral' },
};

export default async function DemandPage({ params }: { params: Params }) {
  const { id } = await params;
  const viewer = await currentUser();
  const demand = await getDemand(id, viewer);

  if (!demand) notFound();

  const status = STATUS[demand.status] ?? STATUS.OPEN!;
  const ownProposal = viewer ? demand.proposals.find((p) => p.authorId === viewer.id) : undefined;
  const canPropose =
    hasRole(viewer, 'PROFESSIONAL') &&
    !demand.canManage &&
    (demand.status === 'OPEN' || demand.status === 'IN_REVIEW');

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-10 lg:px-10 lg:py-14">
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={status.tone}>{status.label}</Tag>
        {demand.tools.map((tool) => (
          <Tag key={tool}>{tool}</Tag>
        ))}
      </div>

      <h1 className="mt-4 text-[32px] font-extrabold leading-[1.08] sm:text-[38px]">
        {demand.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px]">
        <span className="flex items-center gap-2">
          <Avatar name={demand.buyer.name} src={demand.buyer.avatarUrl} size={26} />
          <span className="text-muted">{demand.buyer.name}</span>
        </span>
        <time dateTime={new Date(demand.createdAt).toISOString()} className="text-muted">
          publicada {formatRelative(demand.createdAt)}
        </time>
      </div>

      <div className="mt-8 grid gap-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <section aria-labelledby="problema">
            <h2 id="problema" className="text-xl font-extrabold">O problema</h2>
            <div className="mt-3 flex flex-col gap-4">
              {toParagraphs(demand.problem).map((paragraph, index) => (
                <p key={index} className="text-[16px] leading-[1.7] text-ink-body">{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="objetivo">
            <h2 id="objetivo" className="text-xl font-extrabold">O objetivo</h2>
            <div className="mt-3 flex flex-col gap-4">
              {toParagraphs(demand.goal).map((paragraph, index) => (
                <p key={index} className="text-[16px] leading-[1.7] text-ink-body">{paragraph}</p>
              ))}
            </div>
          </section>

          {/* ------------------------------------------------- Propostas */}
          <section className="mt-10" aria-labelledby="propostas">
            <h2 id="propostas" className="text-xl font-extrabold">
              {demand.canManage ? 'Propostas de profissionais' : 'Sua proposta'}
            </h2>

            {demand.proposals.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title={demand.canManage ? 'Ainda sem propostas' : 'Você ainda não propôs'}
                  description={
                    demand.canManage
                      ? 'Assim que um profissional enviar uma proposta, ela aparece aqui com escopo, prazo e valor.'
                      : 'Envie uma proposta com escopo, prazo e valor. Só você e quem publicou a demanda a enxergam.'
                  }
                />
              </div>
            ) : (
              <ul className="mt-4 flex list-none flex-col gap-4 p-0">
                {demand.proposals.map((proposal) => {
                  const rating = averageRating(proposal.profile.ratingSum, proposal.profile.ratingCount);

                  return (
                    <li key={proposal.id}>
                      <Card className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Avatar
                              name={proposal.profile.user.name}
                              src={proposal.profile.user.avatarUrl}
                              size={40}
                            />
                            <div>
                              <p className="text-[15px] font-bold">{proposal.profile.user.name}</p>
                              <p className="text-[13px] text-muted">{proposal.profile.headline}</p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                                <Stars value={rating} count={proposal.profile.ratingCount} size={13} />
                                <span className="text-[12.5px] text-muted">
                                  {proposal.profile.projectsClosed} projetos
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[20px] font-extrabold leading-none">
                              {formatBRLCompact(proposal.amountCents)}
                            </p>
                            <p className="mt-1 text-[12.5px] text-muted">
                              {proposal.deliveryDays} dias
                            </p>
                            <Tag
                              tone={
                                proposal.status === 'ACCEPTED'
                                  ? 'positive'
                                  : proposal.status === 'REJECTED'
                                    ? 'danger'
                                    : 'neutral'
                              }
                              className="mt-2"
                            >
                              {proposal.status === 'SENT'
                                ? 'Enviada'
                                : proposal.status === 'ACCEPTED'
                                  ? 'Aceita'
                                  : proposal.status === 'REJECTED'
                                    ? 'Recusada'
                                    : 'Retirada'}
                            </Tag>
                          </div>
                        </div>

                        <p className="mt-4 text-[14.5px] leading-relaxed text-ink-body">
                          {proposal.pitch}
                        </p>

                        <details className="mt-3">
                          <summary className="cursor-pointer text-[13.5px] font-semibold text-brand-strong">
                            Ver escopo detalhado
                          </summary>
                          <p className="mt-2 text-[14px] leading-relaxed text-ink-body">
                            {proposal.scope}
                          </p>
                        </details>

                        {demand.canManage && proposal.status === 'SENT' ? (
                          <ProposalActions proposalId={proposal.id} />
                        ) : null}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}

            {canPropose ? (
              <div className="mt-6">
                <ProposalForm demandId={demand.id} existing={ownProposal ?? null} />
              </div>
            ) : null}

            {!viewer ? (
              <div className="mt-6">
                <LinkButton href={`/login?next=/demands/${demand.id}`} variant="secondary">
                  Entrar para enviar proposta
                </LinkButton>
              </div>
            ) : null}
          </section>
        </div>

        {/* ------------------------------------------------------ Resumo */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Panel className="p-5">
            <dl className="flex flex-col gap-4 text-[14px]">
              <div>
                <dt className="text-[12.5px] uppercase tracking-[0.1em] text-muted">Orçamento</dt>
                <dd className="mt-1 text-[17px] font-extrabold">
                  {formatRange(demand.budgetMinCents, demand.budgetMaxCents)}
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] uppercase tracking-[0.1em] text-muted">Prazo</dt>
                <dd className="mt-1 font-semibold">{demand.deadlineDays} dias</dd>
              </div>
              <div>
                <dt className="text-[12.5px] uppercase tracking-[0.1em] text-muted">Propostas</dt>
                <dd className="mt-1 font-semibold">{demand.proposalCount}</dd>
              </div>
            </dl>
          </Panel>

          <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-muted">
            Só quem publicou a demanda vê todas as propostas. Cada profissional enxerga apenas a
            própria — é o que impede que um lance seja feito olhando o do concorrente.
          </p>
        </aside>
      </div>
    </div>
  );
}
