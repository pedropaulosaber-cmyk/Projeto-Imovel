import type { Metadata } from 'next';

import { LinkButton } from '@/components/ui/button';
import { Card, Eyebrow, Panel, SectionTitle } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Vender na AUTOMATIZE',
  description:
    'Publique automações, agentes e workflows de IA para milhares de compradores. 15% de comissão sobre a venda, zero sobre o resto.',
  alternates: { canonical: '/sell' },
};

const STEPS = [
  { title: 'Publique uma vez', body: 'Suba o que você já construiu, descreva o problema que ele resolve e anexe os arquivos de entrega.' },
  { title: 'Passamos pela curadoria', body: 'Nossa equipe revisa antes de publicar. Se algo faltar, você recebe o motivo — não uma recusa muda.' },
  { title: 'Venda quantas vezes forem', body: 'O mesmo trabalho atende o primeiro e o milésimo comprador. A entrega é automática e imediata.' },
];

const FAQ = [
  { q: 'Quanto a AUTOMATIZE cobra?', a: '15% sobre cada venda. Não há mensalidade, taxa de publicação, taxa de saque nem cobrança por produto listado.' },
  { q: 'Quando eu recebo?', a: 'O repasse acontece após a confirmação do pagamento pelo provedor, descontada a comissão. Você acompanha cada venda e o líquido no painel de receitas.' },
  { q: 'Posso vender algo que também vendo fora daqui?', a: 'Pode. Não há exclusividade.' },
  { q: 'E se alguém pedir reembolso?', a: 'O reembolso revoga o acesso aos arquivos automaticamente e estorna a comissão. Você não fica no prejuízo de uma venda desfeita.' },
  { q: 'Como meus arquivos ficam protegidos?', a: 'Ficam em armazenamento privado. O comprador recebe um link temporário assinado, e cada download é registrado — inclusive quantos IPs distintos baixaram o mesmo pedido.' },
];

export default function SellPage() {
  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-canvas to-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-10 lg:py-24">
          <Eyebrow>Para criadores</Eyebrow>
          <h1 className="mt-4 max-w-[16ch] text-[42px] font-extrabold leading-[1.04] sm:text-[56px]">
            Transforme o que você criou em uma nova <span className="text-brand">fonte de receita</span>.
          </h1>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-ink-body sm:text-[19px]">
            Publique automações, agentes, workflows e templates de IA para milhares de potenciais
            compradores. Você constrói uma vez; o marketplace vende quantas vezes forem.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/dashboard/products/new" size="lg">Publicar meu primeiro produto</LinkButton>
            <LinkButton href="/products" variant="secondary" size="lg">Ver o que já está publicado</LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-16 lg:px-10 lg:py-24">
        <SectionTitle className="max-w-[24ch]">
          Você constrói uma vez. O marketplace vende quantas vezes forem.
        </SectionTitle>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Card key={step.title} className="p-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-[15px] font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-body">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-canvas">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-10 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Eyebrow>Comissão</Eyebrow>
              <SectionTitle className="mt-3">15% sobre a venda. Zero sobre o resto.</SectionTitle>
              <p className="mt-4 max-w-[48ch] text-[16.5px] leading-relaxed text-ink-body">
                Sem mensalidade, sem taxa de publicação, sem cobrança por produto listado e sem taxa
                de saque. Você só paga quando vende.
              </p>
            </div>
            <Panel className="p-7">
              <p className="text-[13px] uppercase tracking-[0.12em] text-muted">Exemplo</p>
              <dl className="mt-4 flex flex-col gap-3 text-[15px]">
                <div className="flex justify-between"><dt>Preço do produto</dt><dd className="font-semibold">R$ 1.890</dd></div>
                <div className="flex justify-between text-muted"><dt>Comissão AUTOMATIZE (15%)</dt><dd>− R$ 283,50</dd></div>
                <div className="flex justify-between border-t border-line pt-3 text-[18px] font-extrabold">
                  <dt>Você recebe</dt><dd>R$ 1.606,50</dd>
                </div>
              </dl>
            </Panel>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[820px] px-5 py-16 lg:px-10 lg:py-24">
        <SectionTitle>Perguntas de quem vai publicar</SectionTitle>
        <div className="mt-8 flex flex-col gap-3">
          {FAQ.map((item) => (
            <details key={item.q} className="rounded-[var(--radius-card)] border border-line p-5">
              <summary className="cursor-pointer text-[16px] font-bold">{item.q}</summary>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-body">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-[var(--radius-panel)] bg-brand-deep px-6 py-12 text-center sm:px-12">
          <h2 className="mx-auto max-w-[20ch] text-[30px] font-extrabold leading-tight text-white">
            Publique a primeira em uma tarde.
          </h2>
          <div className="mt-7">
            <LinkButton href="/dashboard/products/new" size="lg">Começar agora</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
