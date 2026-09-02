import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CardSimilar } from '@/components/empreendimentos/cards';
import { Cabecalho } from '@/components/layout/cabecalho';
import { FormularioLead } from '@/components/lead/formulario-lead';
import { Diferenciais } from '@/components/empreendimentos/diferenciais';
import { Galeria } from '@/components/empreendimentos/galeria';
import { Plantas } from '@/components/empreendimentos/plantas';
import { Mapa } from '@/components/mapa/mapa';
import { site, urlBase } from '@/config/site';
import {
  empreendimentoPorSlug,
  empreendimentosPublicados,
  empreendimentosSimilares,
  precoExibicao,
} from '@/content/empreendimentos';
import { nomeDaRegiao, regiaoPorSlug, rotuloDaCategoria, slugDaCategoria } from '@/content/regioes';
import type { Empreendimento } from '@/content/tipos';
import { rotas } from '@/lib/rotas';

export const revalidate = 3600;
export const dynamicParams = false;

type Params = { params: Promise<{ regiao: string; categoria: string; slug: string }> };

export function generateStaticParams() {
  return empreendimentosPublicados().map((e) => ({
    regiao: e.regiaoSlug,
    categoria: slugDaCategoria(e.categoria),
    slug: e.slug,
  }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const e = empreendimentoPorSlug(slug);
  if (!e) return {};

  return {
    title: `${e.nome} — ${rotuloDaCategoria(e.categoria)} no ${nomeDaRegiao(e.regiaoSlug)}`,
    description: e.resumo,
    alternates: { canonical: rotas.empreendimento(e) },
    openGraph: {
      title: e.nome,
      description: e.resumo,
      type: 'website',
    },
  };
}

export default async function PaginaEmpreendimento({ params }: Params) {
  const { regiao: regiaoSlug, categoria: categoriaSlug, slug } = await params;
  const e = empreendimentoPorSlug(slug);

  /* A URL precisa bater com o imóvel: /jardim-atlantico/... não pode servir um
     imóvel do Serrinha, ou o mesmo conteúdo passa a existir em vários
     endereços. */
  if (!e || e.regiaoSlug !== regiaoSlug || slugDaCategoria(e.categoria) !== categoriaSlug) {
    notFound();
  }

  const regiao = regiaoPorSlug(e.regiaoSlug);
  /* A galeria do herói é só de foto; planta tem seção própria mais abaixo. */
  const fotos = e.midias.filter((m) => m.tipo === 'foto');
  const plantasImagens = e.midias.filter((m) => m.tipo === 'planta');
  const temTour = e.midias.some((m) => m.tipo === 'video');
  const similares = empreendimentosSimilares(e.slug);

  return (
    <>
      <Cabecalho ativo="imoveis" />
      <script
        type="application/ld+json"
        /* JSON-LD serializado de dados próprios; nada aqui vem do visitante. */
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaDoImovel(e)) }}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Herói + galeria                                                   */}
      {/* ---------------------------------------------------------------- */}
      <Galeria
        midias={fotos}
        nome={e.nome}
        acoes={
          temTour ? (
            <>
              <span className="rounded-full border border-white/30 bg-[rgba(20,19,15,0.65)] px-[14px] py-[9px] text-[11px] font-medium md:px-[18px] md:py-[10px] md:text-xs">
                Tour 360°
              </span>
              <span className="rounded-full border border-white/30 bg-[rgba(20,19,15,0.65)] px-[14px] py-[9px] text-[11px] font-medium md:px-[18px] md:py-[10px] md:text-xs">
                Vídeo
              </span>
            </>
          ) : null
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-[10px] md:mb-4 md:gap-3">
          <span className="rounded-full bg-ouro px-[13px] py-[6px] text-[11px] font-semibold text-tinta md:px-[14px] md:text-xs">
            {rotuloDaCategoria(e.categoria)}
          </span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-creme/75 md:text-[11px]">
            {regiao?.nome.toUpperCase()}
            <span className="hidden md:inline">
              {' '}
              · {regiao?.cidade.toUpperCase()} — {regiao?.estado}
            </span>
          </span>
        </div>
        <h1 className="text-[36px] leading-[0.96] font-bold tracking-[-0.045em] md:text-[clamp(34px,6vw,88px)] md:leading-[0.94]">
          {e.nome}
        </h1>
      </Galeria>

      {/* ---------------------------------------------------------------- */}
      {/* Corpo: conteúdo + formulário lateral                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="md:flex md:flex-wrap md:items-start md:gap-[clamp(26px,4vw,68px)] md:px-5 md:pt-[clamp(30px,4.4vw,68px)] md:pb-[clamp(46px,6vw,96px)] lg:px-14">
        <main className="min-w-0 md:flex-[999_1_540px]">
          {/* Ficha técnica */}
          {/*
            Preço e entrega são derivados. Guardar a data de entrega também
            dentro de `ficha` já rendeu um imóvel com "dez/2026" no campo e
            "A confirmar" na tabela da página: o mesmo dado em dois lugares
            diverge no dia em que só um dos dois é atualizado.
          */}
          <div className="grid grid-cols-2 md:mb-[clamp(28px,4vw,56px)] md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
            {[
              { label: 'A PARTIR DE', valor: precoExibicao(e) },
              ...e.ficha,
              { label: 'ENTREGA', valor: e.previsaoEntrega ?? 'A confirmar' },
            ].map((f) => (
              <div key={f.label} className="celula p-[18px] md:px-5 md:py-[22px]">
                <p className="mb-2 font-mono text-[9px] tracking-[0.14em] text-creme/55 md:mb-[10px] md:text-[10px]">
                  {f.label}
                </p>
                <p className="text-xl leading-none font-semibold tracking-[-0.03em] md:text-2xl">
                  {f.valor}
                </p>
              </div>
            ))}
          </div>

          <div className="px-[18px] pt-[26px] md:px-0 md:pt-0">
            {/* Status da obra */}
            {e.obra ? (
              <div className="mb-7 md:mb-[clamp(28px,4vw,56px)]">
                <div className="mb-[10px] flex items-baseline justify-between md:mb-3">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-creme/55 md:text-[11px]">
                    STATUS DA OBRA
                  </span>
                  <span className="text-[13px] md:text-sm">
                    {e.obra.etapa} · {e.obra.percentual}%
                    <span className="hidden md:inline"> concluído</span>
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`Andamento da obra: ${e.obra.percentual}%`}
                  aria-valuenow={e.obra.percentual}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1 overflow-hidden rounded-full bg-creme/[0.16]"
                >
                  <div className="h-full bg-ouro" style={{ width: `${e.obra.percentual}%` }} />
                </div>
              </div>
            ) : null}

            {/* Descrição */}
            <section className="mb-7 md:mb-[clamp(30px,4vw,60px)]">
              <h2 className="mb-[14px] text-2xl font-semibold tracking-[-0.03em] md:mb-5 md:text-[clamp(22px,2.8vw,36px)] md:leading-[1.08]">
                O empreendimento
              </h2>
              {e.descricao.map((p) => (
                <p
                  key={p.slice(0, 24)}
                  className="mb-[14px] max-w-[66ch] text-[15px] leading-[1.72] text-creme/78 text-pretty last:mb-0 md:mb-4 md:text-[17px] md:leading-[1.78]"
                >
                  {p}
                </p>
              ))}
            </section>

            {/* Diferenciais */}
            <section className="mb-7 md:mb-[clamp(30px,4vw,60px)]">
              <h2 className="mb-[14px] text-2xl font-semibold tracking-[-0.03em] md:mb-5 md:text-[clamp(22px,2.8vw,36px)] md:leading-[1.08]">
                Diferenciais
              </h2>
              <Diferenciais itens={e.amenidades} />
            </section>

            <Plantas plantas={e.plantas} imagens={plantasImagens} />

            {/* Localização */}
            <section>
              <h2 className="mb-[14px] text-2xl font-semibold tracking-[-0.03em] md:mb-5 md:text-[clamp(22px,2.8vw,36px)] md:leading-[1.08]">
                Localização
              </h2>
              <Mapa
                rotulo={e.nome}
                endereco={e.localizacao.endereco}
                mapaUrl={e.localizacao.mapaUrl}
                coordenadas={e.localizacao.coordenadas}
              />
              <p className="mt-4 max-w-[62ch] text-sm leading-[1.7] text-creme/72 text-pretty md:mt-5 md:text-base md:leading-[1.72]">
                {e.localizacao.endereco}. {e.localizacao.referencias}
              </p>

              {/*
                Lei 4.591/64, art. 32 e Resolução COFECI 1.065/2007: número do
                registro de incorporação e CRECI do responsável, na peça em que
                o imóvel é divulgado.
              */}
              {/*
                Sem número, o aviso ocupa o lugar dele — e num bloco visível,
                não na linha de rodapé em cinza. Quem vai comprar precisa ler.
              */}
              {e.avisoRegistro ? (
                <p className="mt-4 rounded-lg border border-ouro/45 bg-ouro/[0.07] px-4 py-3 text-[13px] leading-[1.65] text-creme/85 md:mt-5 md:text-sm">
                  <strong className="font-semibold text-ouro">
                    Registro de incorporação não localizado.
                  </strong>{' '}
                  {e.avisoRegistro} Pela Lei 4.591/64, art. 32, nenhuma unidade pode ser
                  comercializada antes do registro — o número é conferido antes de qualquer
                  proposta.
                </p>
              ) : null}

              <p className="mt-4 font-mono text-[10px] leading-[1.7] text-creme/50 md:mt-[18px] md:text-[11px]">
                {e.numeroRegistroIncorporacao
                  ? `REGISTRO DE INCORPORAÇÃO ${e.numeroRegistroIncorporacao.toUpperCase()}`
                  : 'REGISTRO DE INCORPORAÇÃO EM APURAÇÃO'}
                {e.corretorResponsavel
                  ? ` · CORRETOR DE IMÓVEIS RESPONSÁVEL: ${e.corretorResponsavel.nome.toUpperCase()}, ${e.corretorResponsavel.creci}`
                  : ` · CORRETOR DE IMÓVEIS: ${site.creci}`}
              </p>
            </section>
          </div>
        </main>

        {/* Formulário lateral --------------------------------------------- */}
        <aside
          id="contato"
          className="mx-[18px] mt-7 scroll-mt-20 rounded-[14px] bg-creme p-[22px] text-tinta md:sticky md:top-20 md:mx-0 md:mt-0 md:max-w-[400px] md:flex-[1_1_320px] md:rounded-[10px] md:p-[clamp(22px,3vw,32px)]"
        >
          <h2 className="mb-[10px] text-2xl leading-[1.1] font-semibold tracking-[-0.03em] md:text-[clamp(23px,2.2vw,30px)]">
            {e.book ? 'Receba o book completo' : 'Fale com um especialista'}
          </h2>
          <p className="mb-[18px] text-sm leading-[1.6] text-grafite-claro md:mb-[22px]">
            {e.book
              ? `Plantas, perspectivas e ficha técnica — ${e.book.paginas} páginas em PDF, liberado na hora. Tabela e disponibilidade real de unidades vão pelo WhatsApp.`
              : 'Tabela, disponibilidade real de unidades e condições de pagamento no seu WhatsApp.'}
          </p>

          <FormularioLead
            variante="claro"
            empreendimentoSlug={e.slug}
            pedirEmail
            tipologias={e.plantas.map((p) => `${p.tipo} — ${p.area}`)}
            rotuloBotao={e.book ? 'Receber o book' : 'Chamar no WhatsApp'}
          />

          {e.corretorResponsavel ? (
            <div className="mt-[22px] flex items-center gap-3 pt-[18px] shadow-[0_-1px_0_rgba(20,19,15,0.14)]">
              <div className="hachura-clara h-11 w-11 shrink-0 rounded-full" aria-hidden />
              <div>
                <p className="mb-[3px] text-sm font-medium">{e.corretorResponsavel.nome}</p>
                <p className="text-xs text-pedra">
                  Corretor de imóveis · {e.corretorResponsavel.creci} ·{' '}
                  {e.corretorResponsavel.regiao}
                </p>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Imóveis parecidos                                                 */}
      {/* ---------------------------------------------------------------- */}
      {similares.length ? (
        <section className="px-[18px] pt-[30px] pb-[34px] md:px-5 md:py-[clamp(36px,5vw,84px)] md:shadow-[0_-1px_0_rgba(246,243,236,0.16)] lg:px-14">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-[18px] md:mb-[clamp(20px,2.6vw,36px)]">
            <h2 className="text-2xl leading-none font-semibold tracking-[-0.03em] md:text-[clamp(24px,3.4vw,46px)] md:tracking-[-0.035em]">
              Imóveis parecidos
            </h2>
            <Link
              href={rotas.imoveis}
              className="hidden border-b border-ouro pb-1 text-sm font-medium md:block"
            >
              Ver todos
            </Link>
          </div>
          <div className="-mx-[18px] flex gap-3 overflow-x-auto px-[18px] pb-[6px] md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-[clamp(14px,2vw,24px)] md:overflow-visible md:px-0 md:pb-0">
            {similares.map((s) => (
              <CardSimilar key={s.slug} e={s} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

/**
 * Schema.org. `RealEstateListing` é o tipo do anúncio; o imóvel em si entra
 * como `Residence` no `about`, que é o que o Google usa para o rich result de
 * imóvel.
 */
function schemaDoImovel(e: Empreendimento) {
  const regiao = regiaoPorSlug(e.regiaoSlug);
  const url = `${urlBase()}${rotas.empreendimento(e)}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': url,
    url,
    name: e.nome,
    description: e.resumo,
    datePosted: new Date().toISOString().slice(0, 10),
    ...(e.midias.find((m) => m.tipo === 'foto' && m.url)?.url
      ? { image: `${urlBase()}${e.midias.find((m) => m.tipo === 'foto' && m.url)?.url}` }
      : {}),
    /* Offer sem preço é válido no Schema.org; offer com preço errado vira
       rich result mentindo o valor na busca. */
    offers: {
      '@type': 'Offer',
      ...(e.precoAPartirDe === null ? {} : { price: e.precoAPartirDe, priceCurrency: 'BRL' }),
      availability: 'https://schema.org/InStock',
    },
    about: {
      '@type': 'Residence',
      name: e.nome,
      address: {
        '@type': 'PostalAddress',
        streetAddress: e.localizacao.endereco,
        addressLocality: regiao?.cidade ?? 'Goiânia',
        addressRegion: regiao?.estado ?? 'GO',
        addressCountry: 'BR',
      },
      floorSize: {
        '@type': 'QuantitativeValue',
        minValue: e.metragemMin,
        maxValue: e.metragemMax,
        unitCode: 'MTK',
      },
      amenityFeature: e.amenidades.map((a) => ({
        '@type': 'LocationFeatureSpecification',
        name: a,
        value: true,
      })),
    },
    provider: {
      '@type': 'RealEstateAgent',
      name: site.nome,
      identifier: site.creci,
      areaServed: `${regiao?.cidade ?? 'Goiânia'} — ${regiao?.estado ?? 'GO'}`,
    },
  };
}
