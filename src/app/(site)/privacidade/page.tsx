import type { Metadata } from 'next';

import { Cabecalho } from '@/components/layout/cabecalho';
import { Eyebrow } from '@/components/ui/primitivas';
import { site } from '@/config/site';
import { rotas } from '@/lib/rotas';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Como o site trata os dados enviados nos formulários: base legal, finalidade, compartilhamento, prazo de guarda e como exercer os direitos previstos na LGPD.',
  alternates: { canonical: rotas.privacidade },
};

/**
 * Exigência do CLAUDE.md e da LGPD: o consentimento pedido no formulário só é
 * informado se existir uma página dizendo o que acontece com o dado. Esta é
 * essa página — texto base, a ser revisado pelo jurídico antes de publicar.
 */
const secoes: { titulo: string; paragrafos: string[] }[] = [
  {
    titulo: 'Quem trata os seus dados',
    paragrafos: [
      `Os dados enviados neste site são tratados por ${site.nome}, corretor de imóveis inscrito sob ${site.creci}, com atendimento em ${site.contato.endereco}, ${site.contato.cidade} — ${site.contato.estado}.`,
      `Para exercer qualquer direito previsto na LGPD, fale com a gente pelo WhatsApp ${site.contato.telefoneExibicao}.`,
    ],
  },
  {
    titulo: 'Que dados coletamos',
    paragrafos: [
      'Nos formulários: nome, telefone de WhatsApp, e-mail (quando informado), o empreendimento ou a tipologia de interesse e o momento em que você autorizou o contato.',
      'Automaticamente, junto do envio: o endereço IP usado no consentimento e os parâmetros de campanha (UTM) da página em que você chegou. O IP é guardado para demonstrar quando e de onde o consentimento foi dado; os UTMs, para saber qual anúncio ou busca trouxe você.',
    ],
  },
  {
    titulo: 'Para que usamos',
    paragrafos: [
      'Para entrar em contato sobre os imóveis que você pediu, enviar tabela, plantas e disponibilidade de unidades, e acompanhar o atendimento até a decisão.',
      'A base legal é o seu consentimento (LGPD, art. 7º, I), coletado de forma destacada no formulário. Sem a marcação do consentimento o formulário não é enviado.',
    ],
  },
  {
    titulo: 'Com quem compartilhamos',
    paragrafos: [
      'Com o corretor responsável pelo empreendimento de seu interesse, e com o nosso sistema de gestão de atendimento (CRM), que registra a conversa.',
      'Com a Meta, quando o contato vem de um anúncio: enviamos ao Meta um evento de conversão com identificadores criptografados (hash SHA-256 do telefone e do e-mail), para medir o resultado da campanha. O Meta não recebe os seus dados em texto aberto.',
      'Não vendemos, alugamos nem cedemos os seus dados para terceiros com finalidade publicitária própria.',
    ],
  },
  {
    titulo: 'Por quanto tempo guardamos',
    paragrafos: [
      'Enquanto durar o atendimento e, depois dele, pelo prazo necessário para cumprir obrigações legais e para defesa em eventual processo. Encerrado esse prazo, os dados são eliminados.',
      'O registro do consentimento (data, hora e IP) é mantido enquanto o dado correspondente existir, porque é ele que comprova a licitude do tratamento.',
    ],
  },
  {
    titulo: 'Os seus direitos',
    paragrafos: [
      'A LGPD garante a você: confirmação de que tratamos os seus dados, acesso a eles, correção do que estiver incompleto ou desatualizado, anonimização ou eliminação de dados desnecessários, portabilidade, informação sobre com quem compartilhamos e revogação do consentimento.',
      'A revogação vale a partir do pedido e não desfaz os tratamentos já realizados. Feita a revogação, paramos o contato.',
    ],
  },
  {
    titulo: 'Cookies',
    paragrafos: [
      'Usamos o Meta Pixel para medir o resultado dos anúncios. Ele grava cookies próprios do domínio (_fbp e _fbc) que identificam a origem da visita.',
      'Você pode bloquear esses cookies nas configurações do navegador; o site continua funcionando, e os formulários também.',
    ],
  },
  {
    titulo: 'Segurança',
    paragrafos: [
      'O site trafega apenas por HTTPS, valida no servidor tudo o que chega dos formulários, limita a frequência de envios por origem e assina digitalmente o repasse de cada contato ao CRM.',
      'Nenhum sistema é imune. Em caso de incidente com risco relevante, comunicamos os titulares e a ANPD nos termos do art. 48 da LGPD.',
    ],
  },
];

export default function PaginaPrivacidade() {
  return (
    <>
      <Cabecalho />

      <main className="px-[18px] pt-[30px] pb-[34px] md:px-5 md:pt-[clamp(40px,7vw,96px)] md:pb-[clamp(46px,6vw,96px)] lg:px-14">
        <Eyebrow className="mb-[18px] md:mb-[clamp(20px,3vw,36px)]">LGPD</Eyebrow>
        <h1 className="mb-6 max-w-[16ch] text-[38px] leading-[0.95] font-bold tracking-[-0.048em] text-balance md:mb-10 md:text-[clamp(38px,6.4vw,88px)]">
          Política de Privacidade
        </h1>

        <div className="max-w-[68ch]">
          {secoes.map((s) => (
            <section key={s.titulo} className="filete-topo py-6 md:py-8">
              <h2 className="mb-3 text-xl font-semibold tracking-[-0.025em] md:mb-4 md:text-2xl">
                {s.titulo}
              </h2>
              {s.paragrafos.map((p) => (
                <p
                  key={p.slice(0, 24)}
                  className="mb-3 text-[15px] leading-[1.72] text-creme/78 text-pretty last:mb-0 md:text-[17px] md:leading-[1.78]"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
          <div className="filete-topo" aria-hidden />

          <p className="mt-6 font-mono text-[10px] leading-[1.7] text-creme/45 md:text-[11px]">
            TEXTO BASE — SUBMETER À REVISÃO JURÍDICA ANTES DA PUBLICAÇÃO. CORRETOR DE IMÓVEIS ·{' '}
            {site.creci}
          </p>
        </div>
      </main>
    </>
  );
}
