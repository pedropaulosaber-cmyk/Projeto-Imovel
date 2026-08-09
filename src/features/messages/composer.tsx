'use client';

import { useActionState, useRef } from 'react';

import { SubmitButton, Textarea } from '@/components/ui/form';
import { Notice } from '@/components/ui/primitives';
import { sendMessageAction } from '@/server/actions/messages';

/**
 * Caixa de envio.
 *
 * Limpa o campo depois do envio bem-sucedido — e só nesse caso. Limpar sempre
 * apagaria o texto quando o envio falha, que é exatamente quando a pessoa mais
 * precisa dele de volta.
 */
export function MessageComposer({ conversationId }: { conversationId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    async (previous: Awaited<ReturnType<typeof sendMessageAction>> | null, formData: FormData) => {
      const result = await sendMessageAction(previous, formData);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    null,
  );

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="conversationId" value={conversationId} />

      {state && !state.ok ? <Notice>{state.message}</Notice> : null}

      <Textarea
        name="body"
        required
        maxLength={5000}
        className="min-h-24"
        aria-label="Sua mensagem"
        placeholder="Escreva sua mensagem…"
      />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Enviando…">Enviar</SubmitButton>
      </div>
    </form>
  );
}
