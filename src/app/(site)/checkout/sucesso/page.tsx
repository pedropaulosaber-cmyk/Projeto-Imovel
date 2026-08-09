import type { Metadata } from 'next';

import { LinkButton } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Compra confirmada', robots: { index: false } };

type SearchParams = Promise<{ pedido?: string }>;

/**
 * Retorno do checkout.
 *
 * **Esta página não confirma nada.** Ela informa que o pagamento foi enviado;
 * quem confirma é o webhook. A diferença não é semântica: alguém pode digitar
 * esta URL direto, e uma página que "confirma" liberaria o produto a partir de
 * uma navegação forjada.
 *
 * Por isso o texto fala em "assim que o provedor confirmar" — é a verdade, e
 * evita a reclamação de quem chega aqui e não vê o produto na biblioteca no
 * mesmo segundo.
 */
export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { pedido } = await searchParams;

  return (
    <div className="mx-auto max-w-[560px] px-5 py-20 text-center lg:py-28">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-positive-subtle text-positive">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>

      <h1 className="mt-6 text-[30px] font-extrabold">Pagamento enviado</h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink-body">
        Assim que o provedor confirmar — costuma levar poucos segundos — o produto aparece na sua
        biblioteca com os arquivos liberados. Você também recebe uma notificação.
      </p>

      {pedido ? (
        <Card className="mt-6 p-4">
          <p className="text-[12.5px] uppercase tracking-[0.1em] text-muted">Número do pedido</p>
          <p className="mt-1 font-mono text-[18px] font-bold">{pedido}</p>
        </Card>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/library" size="lg">Ir para a biblioteca</LinkButton>
        <LinkButton href="/products" variant="secondary" size="lg">Continuar explorando</LinkButton>
      </div>
    </div>
  );
}
