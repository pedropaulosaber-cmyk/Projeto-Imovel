import type { Metadata } from 'next';

import { LinkButton } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Checkout cancelado', robots: { index: false } };

export default function CheckoutCancelledPage() {
  return (
    <div className="mx-auto max-w-[560px] px-5 py-20 text-center lg:py-28">
      <h1 className="text-[30px] font-extrabold">Checkout cancelado</h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink-body">
        Nada foi cobrado. O pedido continua guardado — se quiser retomar, é só voltar ao produto e
        comprar de novo.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/products" size="lg">Voltar ao catálogo</LinkButton>
        <LinkButton href="/support" variant="secondary" size="lg">Tive um problema</LinkButton>
      </div>
    </div>
  );
}
