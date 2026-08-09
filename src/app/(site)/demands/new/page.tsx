import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Card, Eyebrow, Panel } from '@/components/ui/primitives';
import { DemandForm } from '@/features/demands/demand-form';
import { currentUser } from '@/server/auth/authorize';

export const metadata: Metadata = {
  title: 'Publicar uma demanda',
  description: 'Descreva o problema e receba propostas de quem já resolveu algo parecido.',
  robots: { index: false, follow: true },
};

export default async function NewDemandPage() {
  const user = await currentUser();
  // Guarda de página: o middleware não cobre `/demands/new` porque a listagem
  // de demandas é pública. A autorização real continua sendo a da Server
  // Action, que roda mesmo se alguém pular esta tela.
  if (!user) redirect('/login?next=/demands/new');

  return (
    <div className="mx-auto max-w-[820px] px-5 py-12 lg:px-10 lg:py-16">
      <Eyebrow>Nova demanda</Eyebrow>
      <h1 className="mt-3 text-[34px] font-extrabold leading-[1.08] sm:text-[40px]">
        Descreva o que precisa ser automatizado.
      </h1>
      <p className="mt-4 max-w-[58ch] text-[16.5px] leading-relaxed text-ink-body">
        Quanto mais concreto o problema, melhores as propostas. Diga o que acontece hoje, quanto
        custa e o que mudaria se estivesse resolvido.
      </p>

      <Panel className="mt-8 p-5">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
          O que faz uma boa demanda
        </h2>
        <ul className="mt-3 flex list-none flex-col gap-2 p-0 text-[14px] leading-relaxed text-ink-body">
          <li>· O processo como ele é hoje, incluindo quantas pessoas e quantas horas.</li>
          <li>· As ferramentas que já estão em uso e não podem ser trocadas.</li>
          <li>· O volume real (quantos documentos, tickets, leads por mês).</li>
          <li>· O que você considera "resolvido" — o critério de aceite.</li>
        </ul>
      </Panel>

      <Card className="mt-6 p-6 sm:p-8">
        <DemandForm />
      </Card>
    </div>
  );
}
