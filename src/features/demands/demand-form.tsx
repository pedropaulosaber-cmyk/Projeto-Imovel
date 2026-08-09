'use client';

import { useActionState } from 'react';

import { Field, Input, SubmitButton, Textarea } from '@/components/ui/form';
import { Notice } from '@/components/ui/primitives';
import { createDemandAction } from '@/server/actions/demands';

/**
 * Formulário de demanda.
 *
 * ## Reais na tela, centavos no domínio
 *
 * Os campos de orçamento se chamam `budgetMinReais`/`budgetMaxReais` e a
 * conversão para centavos acontece **no servidor**, em `createDemandAction`.
 *
 * Converter aqui, no cliente, seria pedir para um valor chegar errado: bastaria
 * o JavaScript não ter hidratado ainda, ou alguém postar o formulário direto, e
 * "8000" entraria como oitenta reais em vez de oito mil. O nome do campo diz a
 * unidade justamente para que essa confusão não sobreviva a uma leitura rápida.
 */
export function DemandForm() {
  const [state, formAction] = useActionState(createDemandAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state && !state.ok && !errors ? <Notice>{state.message}</Notice> : null}

      <Field label="Título" error={errors?.title} hint="Uma frase que resuma o problema." required>
        {(props) => (
          <Input
            {...props}
            name="title"
            required
            minLength={10}
            maxLength={140}
            placeholder="Automatizar a conciliação bancária de 4 contas PJ"
          />
        )}
      </Field>

      <Field
        label="Qual é o problema hoje?"
        error={errors?.problem}
        hint="Descreva o processo atual, o volume e o custo. Seja concreto."
        required
      >
        {(props) => (
          <Textarea
            {...props}
            name="problem"
            required
            minLength={40}
            maxLength={8000}
            className="min-h-44"
            placeholder="Hoje o time financeiro exporta o OFX de quatro bancos e concilia manualmente contra o contas a receber…"
          />
        )}
      </Field>

      <Field
        label="O que você quer alcançar?"
        error={errors?.goal}
        hint="O critério de aceite: como você vai saber que está resolvido."
        required
      >
        {(props) => (
          <Textarea
            {...props}
            name="goal"
            required
            minLength={20}
            maxLength={4000}
            placeholder="Conciliação automática diária, com fila de exceções só para o que não casar sozinho."
          />
        )}
      </Field>

      <Field
        label="Ferramentas envolvidas"
        error={errors?.tools}
        hint="Separadas por vírgula. Inclua o que já está em uso e não pode ser trocado."
      >
        {(props) => <Input {...props} name="tools" placeholder="Omie, n8n, Excel" />}
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Orçamento mínimo (R$)" error={errors?.budgetMinCents} required>
          {(props) => (
            <Input
              {...props}
              name="budgetMinReais"
              type="number"
              min={0}
              step={100}
              required
              placeholder="8000"
            />
          )}
        </Field>

        <Field label="Orçamento máximo (R$)" error={errors?.budgetMaxCents} required>
          {(props) => (
            <Input {...props} name="budgetMaxReais" type="number" min={0} step={100} required placeholder="15000" />
          )}
        </Field>

        <Field label="Prazo (dias)" error={errors?.deadlineDays} required>
          {(props) => (
            <Input {...props} name="deadlineDays" type="number" min={1} max={365} required placeholder="45" />
          )}
        </Field>
      </div>

      <p className="text-[12.5px] text-muted">
        Os valores são em reais e servem para orientar as propostas — você não se compromete com
        eles.
      </p>

      <SubmitButton size="lg" pendingLabel="Publicando…">Publicar demanda</SubmitButton>
    </form>
  );
}
