import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de uso',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-[720px] px-5 py-12 lg:px-10 lg:py-16">
      <h1 className="text-[34px] font-extrabold">Termos de uso</h1>

      <div className="mt-8 flex flex-col gap-8 text-[15.5px] leading-[1.7] text-ink-body">
        <section>
          <h2 className="text-xl font-extrabold text-ink">O papel da AUTOMATIZE</h2>
          <p className="mt-2">
            A plataforma intermedia a relação entre quem publica soluções e quem as compra ou
            contrata. A responsabilidade pelo conteúdo, pelo funcionamento e pelo suporte de cada
            produto é de quem o publicou.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-ink">Comissão</h2>
          <p className="mt-2">
            A plataforma retém 15% sobre o valor de cada venda concluída. Não há mensalidade, taxa
            de publicação ou taxa de saque. Em caso de reembolso, a comissão é estornada junto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-ink">Curadoria e moderação</h2>
          <p className="mt-2">
            Todo produto passa por análise antes de ser publicado. A plataforma pode recusar,
            despublicar ou arquivar conteúdo que viole estes termos, sempre informando o motivo a
            quem publicou.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-ink">Direito de arrependimento</h2>
          <p className="mt-2">
            Nos termos do art. 49 do Código de Defesa do Consumidor, compras feitas fora do
            estabelecimento comercial podem ser desfeitas em até 7 dias. Para produto digital já
            baixado, o pedido de reembolso é analisado caso a caso.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-ink">Conta</h2>
          <p className="mt-2">
            Você é responsável por manter a confidencialidade das suas credenciais. Contas que
            violem estes termos podem ser suspensas ou encerradas, com aviso e possibilidade de
            contestação.
          </p>
        </section>
      </div>
    </article>
  );
}
