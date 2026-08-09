import type { Metadata } from 'next';

import { Card } from '@/components/ui/primitives';
import { LinkButton } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Suporte', alternates: { canonical: '/support' } };

const TOPICS = [
  { title: 'Comprei e não recebi o arquivo', body: 'A liberação acontece assim que o provedor confirma o pagamento. Se passaram mais de 10 minutos, verifique sua biblioteca e depois nos escreva com o número do pedido.' },
  { title: 'O produto não funcionou como esperado', body: 'Fale primeiro com quem publicou — o suporte do produto é dele. Se não houver resposta em 48h, acionamos a mediação.' },
  { title: 'Quero pedir reembolso', body: 'Escreva para suporte@automatize.com.br com o número do pedido e o motivo. O reembolso revoga o acesso aos arquivos.' },
  { title: 'Sou criador e meu produto foi recusado', body: 'O motivo da recusa aparece na página do produto, no seu painel. Corrija o apontado e reenvie para análise.' },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 lg:px-10 lg:py-16">
      <h1 className="text-[34px] font-extrabold">Suporte</h1>
      <p className="mt-3 text-[16.5px] leading-relaxed text-ink-body">
        As dúvidas mais comuns e por onde falar com a gente.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {TOPICS.map((topic) => (
          <Card key={topic.title} className="p-5">
            <h2 className="text-[16px] font-bold">{topic.title}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-body">{topic.body}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6 text-center">
        <h2 className="text-[18px] font-bold">Não achou o que precisava?</h2>
        <p className="mt-2 text-[14.5px] text-ink-body">
          Escreva para <a href="mailto:suporte@automatize.com.br">suporte@automatize.com.br</a>.
          Respondemos em até um dia útil.
        </p>
        <div className="mt-5">
          <LinkButton href="/products" variant="secondary">Voltar ao catálogo</LinkButton>
        </div>
      </Card>
    </div>
  );
}
