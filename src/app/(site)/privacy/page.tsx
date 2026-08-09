import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacidade e LGPD',
  description: 'Como a AUTOMATIZE trata dados pessoais, qual a base legal e como exercer seus direitos.',
  alternates: { canonical: '/privacy' },
};

/**
 * Política de privacidade.
 *
 * O conteúdo aqui descreve **o que o código realmente faz** — as bases legais,
 * as retenções e os direitos listados correspondem ao que está implementado em
 * `services/accounts.ts` e no schema. Uma política que promete o que o sistema
 * não faz é pior que nenhuma: vira prova documental contra a empresa.
 *
 * Antes de ir a produção, precisa de revisão jurídica. O texto foi escrito para
 * ser preciso, não para substituir advogado.
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-[720px] px-5 py-12 lg:px-10 lg:py-16">
      <h1 className="text-[34px] font-extrabold">Privacidade e proteção de dados</h1>
      <p className="mt-3 text-[14px] text-muted">
        Em conformidade com a Lei 13.709/2018 (LGPD).
      </p>

      <div className="mt-8 flex flex-col gap-8 text-[15.5px] leading-[1.7] text-ink-body">
        <section>
          <h2 className="text-xl font-extrabold text-ink">Quais dados tratamos</h2>
          <p className="mt-2">
            Nome, e-mail e senha (armazenada apenas como hash argon2id, nunca em texto). Para quem
            vende: dados de perfil, produtos publicados e histórico de transações. Registramos
            também o endereço IP de forma pseudonimizada (hash) nas sessões e nos downloads, para
            detecção de abuso.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-ink">Base legal</h2>
          <p className="mt-2">
            Execução de contrato (art. 7º, V) para o que é necessário à operação da conta e das
            compras; legítimo interesse (art. 7º, IX) para segurança e prevenção a fraude; e
            cumprimento de obrigação legal (art. 7º, II) para os registros fiscais das transações.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-ink">Dados de pagamento</h2>
          <p className="mt-2">
            Não recebemos, não processamos e não armazenamos dados de cartão. O pagamento acontece
            inteiramente no ambiente do provedor, e o que retorna para nós é apenas a confirmação
            da transação.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-ink">Seus direitos</h2>
          <p className="mt-2">
            Você pode solicitar acesso, correção, portabilidade e exclusão dos seus dados (art. 18).
            Na exclusão, os dados pessoais são anonimizados; o registro das transações é preservado,
            porque envolve também a contraparte da compra e obrigações fiscais que não são nossas
            de dispensar.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-ink">Encarregado de dados</h2>
          <p className="mt-2">
            Solicitações e dúvidas:{' '}
            <a href="mailto:privacidade@automatize.com.br">privacidade@automatize.com.br</a>. O prazo
            de resposta é de até 15 dias.
          </p>
        </section>
      </div>
    </article>
  );
}
