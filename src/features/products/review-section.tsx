'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { Field, SubmitButton, Textarea } from '@/components/ui/form';
import { Avatar, Card, EmptyState, Notice, Stars } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { formatRelative } from '@/lib/text';
import { submitReviewAction } from '@/server/actions/commerce';

/**
 * Bloco de avaliações.
 *
 * ## Só aparece o formulário para quem pode avaliar
 *
 * A regra ("só quem comprou") é aplicada no servidor, sempre. Aqui a interface
 * apenas **não oferece** o que vai ser recusado — oferecer um formulário que
 * sempre falha é pior que não oferecer.
 *
 * ## As estrelas são radio, não botões
 *
 * Nota é escolha entre opções mutuamente exclusivas, que é a definição de
 * `radiogroup`. Com radios de verdade, a seta do teclado navega, o leitor de
 * tela anuncia "3 de 5" e o formulário envia sem JavaScript.
 */

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  author: { id: string; name: string; avatarUrl: string | null };
  response: { body: string; createdAt: Date } | null;
};

type Props = {
  productId: string;
  reviews: Review[];
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  average: number | null;
  total: number;
  canReview: boolean;
  existing: { id: string; rating: number; comment: string } | null;
  signedIn: boolean;
};

export function ReviewSection({
  productId,
  reviews,
  breakdown,
  average,
  total,
  canReview,
  existing,
  signedIn,
}: Props) {
  const [state, formAction] = useActionState(submitReviewAction, null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 5);

  return (
    <section className="mt-12" aria-labelledby="avaliacoes">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="avaliacoes" className="text-2xl font-extrabold">Avaliações</h2>
        {canReview ? (
          <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
            {existing ? 'Editar minha avaliação' : 'Avaliar este produto'}
          </Button>
        ) : null}
      </div>

      {total > 0 ? (
        <Card className="mt-5 flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="text-center sm:w-40">
            <p className="text-[44px] font-extrabold leading-none">{average?.toFixed(1)}</p>
            <div className="mt-2 flex justify-center">
              <Stars value={average} count={total} size={16} />
            </div>
          </div>

          <ul className="flex flex-1 list-none flex-col gap-1.5 p-0">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = breakdown[star];
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <li key={star} className="flex items-center gap-3 text-[13px]">
                  <span className="w-10 text-muted">{star} ★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-10 text-right text-muted">{count}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {open && canReview ? (
        <Card className="mt-5 p-6">
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="productId" value={productId} />

            <fieldset className="border-0 p-0">
              <legend className="mb-2 text-[13.5px] font-semibold text-ink-soft">Sua nota</legend>
              <div role="radiogroup" aria-label="Nota de 1 a 5" className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label
                    key={value}
                    className="cursor-pointer rounded p-1 focus-within:outline-2 focus-within:outline-brand"
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === value}
                      onChange={() => setRating(value)}
                      className="sr-only"
                    />
                    <span className="sr-only">{value} de 5</span>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill={value <= rating ? '#F59E0B' : '#E2E8F0'} aria-hidden>
                      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
                    </svg>
                  </label>
                ))}
              </div>
            </fieldset>

            <Field
              label="Seu comentário"
              error={state && !state.ok ? state.fieldErrors?.comment : undefined}
              hint="Conte o que você usou, o que funcionou e o que faltou. É o que ajuda quem vem depois."
              required
            >
              {(props) => (
                <Textarea
                  {...props}
                  name="comment"
                  defaultValue={existing?.comment ?? ''}
                  minLength={20}
                  maxLength={2000}
                  required
                  placeholder="Implantei em dois dias. O que mais ajudou foi…"
                />
              )}
            </Field>

            {state && !state.ok && !state.fieldErrors ? <Notice>{state.message}</Notice> : null}

            <div className="flex gap-2.5">
              <SubmitButton pendingLabel="Publicando…">Publicar avaliação</SubmitButton>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {reviews.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Ainda sem avaliações"
            description={
              signedIn
                ? 'Este produto ainda não recebeu avaliações. Só quem comprou pode avaliar — é o que mantém a nota honesta.'
                : 'Este produto ainda não recebeu avaliações. Só compradores verificados podem avaliar.'
            }
          />
        </div>
      ) : (
        <ul className="mt-6 flex list-none flex-col gap-4 p-0">
          {reviews.map((review) => (
            <li key={review.id}>
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={review.author.name} src={review.author.avatarUrl} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-[14.5px] font-bold">{review.author.name}</span>
                      <Stars value={review.rating} count={1} size={13} className="[&>span:last-child]:hidden" />
                      <time
                        dateTime={new Date(review.createdAt).toISOString()}
                        className="text-[12.5px] text-muted"
                      >
                        {formatRelative(review.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-ink-body">
                      {review.comment}
                    </p>

                    {review.response ? (
                      <div className="mt-3 rounded-[var(--radius-thumb)] border-l-2 border-brand bg-brand-subtle/50 px-4 py-3">
                        <p className="text-[12.5px] font-bold uppercase tracking-[0.1em] text-brand-strong">
                          Resposta do criador
                        </p>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-body">
                          {review.response.body}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {!signedIn && reviews.length > 0 ? (
        <p className="mt-5 text-center text-[13.5px] text-muted">
          Comprou este produto? <Link href="/login">Entre</Link> para avaliar.
        </p>
      ) : null}
    </section>
  );
}
