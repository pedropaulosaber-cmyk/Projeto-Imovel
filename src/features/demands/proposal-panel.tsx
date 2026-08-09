'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Input, SubmitButton, Textarea } from '@/components/ui/form';
import { Card, Notice } from '@/components/ui/primitives';
import {
  acceptProposalAction,
  rejectProposalAction,
  submitProposalAction,
} from '@/server/actions/demands';

/**
 * Ações do dono da demanda sobre uma proposta.
 *
 * Aceitar é irreversível — recusa as concorrentes e fecha a demanda — então
 * pede confirmação explícita. Um clique acidental aqui encerra a concorrência
 * de um projeto de dezenas de milhares de reais.
 */
export function ProposalActions({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-4 border-t border-line pt-4">
      {error ? <div className="mb-3"><Notice>{error}</Notice></div> : null}

      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[13.5px] text-ink-body">
            Aceitar encerra a concorrência e recusa as outras propostas. Confirma?
          </p>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await acceptProposalAction(proposalId);
                if (result.ok) router.push(`/messages/${result.data.conversationId}`);
                else setError(result.message);
              })
            }
          >
            Sim, aceitar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          <Button size="sm" onClick={() => setConfirming(true)} disabled={pending}>
            Aceitar proposta
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await rejectProposalAction(proposalId);
                if (!result.ok) setError(result.message);
              })
            }
          >
            Recusar
          </Button>
        </div>
      )}
    </div>
  );
}

type Existing = { amountCents: number; deliveryDays: number; pitch: string; scope: string } | null;

/** Formulário de proposta do profissional. */
export function ProposalForm({ demandId, existing }: { demandId: string; existing: Existing }) {
  const [state, formAction] = useActionState(submitProposalAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <Card className="p-6">
      <h3 className="text-[17px] font-bold">
        {existing ? 'Atualizar sua proposta' : 'Enviar uma proposta'}
      </h3>
      <p className="mt-1.5 text-[13.5px] text-muted">
        Só você e quem publicou a demanda enxergam o que você escrever aqui.
      </p>

      <form action={formAction} className="mt-5 flex flex-col gap-4" noValidate>
        <input type="hidden" name="demandId" value={demandId} />

        {state && !state.ok && !errors ? <Notice>{state.message}</Notice> : null}
        {state && state.ok ? <Notice tone="positive">Proposta enviada.</Notice> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor (R$)" error={errors?.amountCents} required>
            {(props) => (
              <Input
                {...props}
                name="amountReais"
                type="number"
                min={0}
                step={100}
                required
                defaultValue={existing ? existing.amountCents / 100 : ''}
              />
            )}
          </Field>

          <Field label="Prazo (dias)" error={errors?.deliveryDays} required>
            {(props) => (
              <Input
                {...props}
                name="deliveryDays"
                type="number"
                min={1}
                max={365}
                required
                defaultValue={existing?.deliveryDays ?? ''}
              />
            )}
          </Field>
        </div>

        <Field
          label="Sua apresentação"
          error={errors?.pitch}
          hint="Por que você é a pessoa certa para este problema específico."
          required
        >
          {(props) => (
            <Textarea {...props} name="pitch" required minLength={60} maxLength={4000} defaultValue={existing?.pitch ?? ''} />
          )}
        </Field>

        <Field
          label="Escopo"
          error={errors?.scope}
          hint="O que está incluído, em etapas. É o que evita discussão depois."
          required
        >
          {(props) => (
            <Textarea {...props} name="scope" required minLength={40} maxLength={8000} defaultValue={existing?.scope ?? ''} />
          )}
        </Field>

        <SubmitButton pendingLabel="Enviando…">
          {existing ? 'Atualizar proposta' : 'Enviar proposta'}
        </SubmitButton>
      </form>
    </Card>
  );
}
