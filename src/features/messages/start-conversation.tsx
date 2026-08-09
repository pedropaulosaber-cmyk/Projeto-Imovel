'use client';

import { useActionState } from 'react';

import { Field, Input, SubmitButton, Textarea } from '@/components/ui/form';
import { Notice } from '@/components/ui/primitives';
import { openConversationAction } from '@/server/actions/messages';

export function StartConversation({
  recipientId,
  recipientName,
}: {
  recipientId: string;
  recipientName: string;
}) {
  const [state, formAction] = useActionState(openConversationAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {/* O destinatário vai no formulário, mas quem valida que ele existe e
          está ativo é o servidor — o campo escondido não autoriza nada. */}
      <input type="hidden" name="to" value={recipientId} />

      {state && !state.ok && !errors ? <Notice>{state.message}</Notice> : null}

      <Field label="Assunto" error={errors?.subject} hint="Opcional, mas ajuda a organizar.">
        {(props) => <Input {...props} name="subject" maxLength={140} placeholder="Automação de cobrança" />}
      </Field>

      <Field label="Mensagem" error={errors?.body}>
        {(props) => (
          <Textarea
            {...props}
            name="body"
            className="min-h-32"
            maxLength={5000}
            placeholder={`Olá, ${recipientName.split(' ')[0]}. Estou avaliando…`}
          />
        )}
      </Field>

      <SubmitButton pendingLabel="Abrindo…">Iniciar conversa</SubmitButton>
    </form>
  );
}
