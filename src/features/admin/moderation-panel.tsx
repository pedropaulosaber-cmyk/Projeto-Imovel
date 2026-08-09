'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SubmitButton, Textarea } from '@/components/ui/form';
import { Notice } from '@/components/ui/primitives';
import { moderateProductAction } from '@/server/actions/products';

/**
 * Decisão de moderação.
 *
 * A recusa **exige** motivo — o schema não aceita sem, e o formulário não
 * envia sem. Não é burocracia: sem motivo, o criador reenvia a mesma coisa e a
 * fila cresce com o mesmo produto três vezes.
 */
export function ModerationPanel({ productId, slug }: { productId: string; slug: string }) {
  const [state, formAction] = useActionState(moderateProductAction, null);
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="mt-4 border-t border-line pt-4">
      {state && !state.ok ? <div className="mb-3"><Notice>{state.message}</Notice></div> : null}

      <Link href={`/products/${slug}`} className="text-[13.5px] font-semibold" target="_blank">
        Abrir a página do produto ↗
      </Link>

      {rejecting ? (
        <form action={formAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="decision" value="reject" />
          <input type="hidden" name="productId" value={productId} />
          <Textarea
            name="note"
            required
            minLength={20}
            maxLength={2000}
            className="min-h-24"
            aria-label="Motivo da recusa"
            placeholder="Explique o que precisa ser corrigido para o produto ser aprovado."
          />
          <div className="flex gap-2.5">
            <SubmitButton variant="danger" size="sm" pendingLabel="Recusando…">Confirmar recusa</SubmitButton>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2.5">
          <form action={formAction}>
            <input type="hidden" name="decision" value="approve" />
            <input type="hidden" name="productId" value={productId} />
            <SubmitButton size="sm" pendingLabel="Aprovando…">Aprovar e publicar</SubmitButton>
          </form>
          <Button size="sm" variant="secondary" onClick={() => setRejecting(true)}>Recusar</Button>
        </div>
      )}
    </div>
  );
}
