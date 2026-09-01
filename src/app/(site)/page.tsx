import Image from 'next/image';
import Link from 'next/link';

import { BuscaHeroDesktop, BuscaHeroMobile } from '@/components/busca/busca';
import { CardOportunidade } from '@/components/empreendimentos/cards';
import { Cabecalho, PilulaHome } from '@/components/layout/cabecalho';
import { FormularioLead } from '@/components/lead/formulario-lead';
import { BannerParque, GradeNumeros } from '@/components/secoes/blocos';
import { Creci, Eyebrow } from '@/components/ui/primitivas';
import { site, urlBase } from '@/config/site';
import { contagemPorCategoria, oportunidadesDaSemana, totalPublicado } from '@/content/empreendimentos';
import { depoimentos } from '@/content/escritorio';
import { parquePorSlug } from '@/content/parques';
import { categorias, regioes } from '@/content/regioes';
import { rotas } from '@/lib/rotas';

/* Landing page: conteúdo estático, revalidado de hora em hora quando o
   catálogo passar a vir do Supabase. */
export const revalidate = 3600;

export default function Home() {
  const oportunidades = oportunidadesDaSemana();
  const total = totalPublicado();
  const serrinha = parquePorSlug('parque-serrinha');
  const cascavel = parquePorSlug('parque-cascavel');

  return (
    <>
      <Cabecalho semBarraDesktop />
      <script
        type="application/ld+json"
        /* Identidade do escritório: é o que liga as páginas de imóvel a um
           mesmo corretor no Google. */
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaDoEscritorio()) }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Herói                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative flex min-h-[78svh] flex-col justify-end md:min-h-[100svh] md:justify-start">
        <Image
          src="/imagens/escritorio-goiania.jpg"
          alt="Vista de Goiânia a partir do escritório, ao entardecer"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,12,0.55)_0%,rgba(14,14,12,0.15)_35%,rgba(14,14,12,0.95)_100%)] md:hidden"
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden md:block md:bg-[linear-gradient(100deg,rgba(14,14,12,0.86)_0%,rgba(14,14,12,0.5)_50%,rgba(14,14,12,0.18)_100%)]"
        />

        <PilulaHome />

        <div className="relative z-10 w-full px-[18px] pt-[60px] pb-[26px] md:flex md:flex-1 md:flex-wrap md:items-end md:justify-between md:gap-[clamp(24px,4vw,48px)] md:px-5 md:pt-[clamp(36px,6vw,88px)] md:pb-[clamp(40px,6vw,72px)] lg:px-14">
          <div className="min-w-0 md:max-w-[660px] md:flex-[1_1_460px]">
            <h1 className="mb-4 text-[40px] leading-[0.96] font-bold tracking-[-0.045em] text-balance md:mb-[26px] md:text-[clamp(40px,6.4vw,82px)] md:leading-[0.94]">
              Três setores. O endereço certo em cada um.
            </h1>

            <p className="mb-5 text-sm leading-[1.6] font-light text-creme/85 md:mb-7 md:max-w-[46ch] md:text-[clamp(14px,1.1vw,16px)] md:text-pretty">
              <span className="md:hidden">
                Dezoito anos acompanhando obra por obra em Serrinha, Pedro Ludovico e Jardim
                Atlântico, com registro e cronograma abertos.
              </span>
              <span className="hidden md:inline">
                Dezoito anos acompanhando obra por obra em Serrinha, Pedro Ludovico e Jardim
                Atlântico. Não vendemos catálogo: apresentamos os três ou quatro empreendimentos
                que servem para você, com registro e cronograma abertos.
              </span>
            </p>

            <div className="mb-5 flex flex-wrap items-center gap-[10px] md:mb-7 md:gap-[14px]">
              <Creci className="hidden text-creme/70 md:inline" />
              <span
                aria-label="Cinco estrelas"
                className="text-[15px] tracking-[0.12em] text-ouro md:text-[17px] md:tracking-[0.15em]"
              >
                ★★★★★
              </span>
              <span className="text-[13px] text-creme/75 md:text-sm">+500 famílias atendidas</span>
            </div>

            <BuscaHeroMobile />
            <BuscaHeroDesktop />
          </div>
        </div>
      </section>

      {/*
        A ordem troca entre os artboards: no desktop os números vêm antes das
        oportunidades; no celular o estoque vem primeiro, porque é o que o
        visitante de anúncio veio ver.
      */}
      <div className="flex flex-col">
        {/* -------------------------------------------------------------- */}
        {/* Oportunidades da semana                                         */}
        {/* -------------------------------------------------------------- */}
        <section className="order-1 px-[18px] pt-[30px] pb-[6px] md:order-2 md:px-5 md:py-[clamp(40px,6vw,88px)] lg:px-14">
          <div className="mb-[18px] md:mb-[clamp(22px,3vw,38px)] md:flex md:flex-wrap md:items-end md:justify-between md:gap-5">
            <div>
              <Eyebrow className="mb-[10px] md:mb-[14px]">01 — DISPONÍVEIS AGORA</Eyebrow>
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-[28px] leading-none font-semibold tracking-[-0.035em] md:text-[clamp(28px,4vw,54px)]">
                  Oportunidades da semana
                </h2>
                <Link
                  href={rotas.imoveis}
                  className="text-[13px] font-medium whitespace-nowrap text-ouro md:hidden"
                >
                  Ver {total} →
                </Link>
              </div>
            </div>
            <Link
              href={rotas.imoveis}
              className="hidden border-b border-ouro pb-1 text-sm font-medium md:block"
            >
              Ver todos os {total} imóveis
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] md:gap-[clamp(14px,2vw,24px)]">
            {oportunidades.map((e) => (
              <CardOportunidade key={e.slug} e={e} />
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Números                                                          */}
        {/* -------------------------------------------------------------- */}
        <div className="order-2 my-[26px] md:order-1 md:my-0">
          <GradeNumeros />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Parque Serrinha                                                     */}
      {/* ------------------------------------------------------------------ */}
      {serrinha ? <BannerParque parque={serrinha} /> : null}

      {/* ------------------------------------------------------------------ */}
      {/* Três momentos de compra                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-creme px-[18px] py-[30px] text-tinta md:px-5 md:py-[clamp(44px,6vw,96px)] lg:px-14">
        <Eyebrow tom="escuro" className="mb-4 md:mb-[clamp(20px,3vw,36px)]">
          02 — TRÊS MOMENTOS DE COMPRA
        </Eyebrow>

        {categorias.map((c) => (
          <Link
            key={c.slug}
            href={`${rotas.imoveis}?categoria=${c.slug}`}
            className="filete-topo-escuro block py-[18px] md:flex md:flex-wrap md:items-baseline md:gap-[clamp(14px,3vw,40px)] md:py-[clamp(20px,2.8vw,34px)]"
          >
            <div className="mb-[6px] flex items-baseline justify-between gap-3 md:contents">
              <span className="text-[26px] leading-none font-semibold tracking-[-0.035em] md:flex-[1_1_220px] md:text-[clamp(26px,4vw,56px)] md:tracking-[-0.04em]">
                {c.titulo}
              </span>
              <span className="font-mono text-[11px] text-areia md:order-3 md:flex-none md:text-xs">
                {contagemPorCategoria(c.valor)} {contagemPorCategoria(c.valor) === 1 ? 'IMÓVEL' : 'IMÓVEIS'}
              </span>
            </div>
            <span className="block text-sm leading-[1.55] text-grafite md:order-2 md:max-w-[42ch] md:flex-[1_1_260px] md:text-[15px] md:leading-[1.6]">
              {c.texto}
            </span>
          </Link>
        ))}
        <div className="filete-topo-escuro" aria-hidden />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Parque Cascavel                                                     */}
      {/* ------------------------------------------------------------------ */}
      {cascavel ? <BannerParque parque={cascavel} /> : null}

      {/* ------------------------------------------------------------------ */}
      {/* Depoimentos                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-[18px] py-[30px] md:flex md:flex-wrap md:gap-[clamp(28px,5vw,72px)] md:px-5 md:py-[clamp(44px,6vw,96px)] lg:px-14">
        <div className="md:flex-[1_1_320px]">
          <Eyebrow className="mb-4 md:mb-6">03 — QUEM JÁ COMPROU</Eyebrow>
          {depoimentos.map((d) => (
            <figure key={d.autor} className="filete-topo m-0 py-[18px] md:py-[22px]">
              <blockquote className="mb-[10px] text-[18px] leading-[1.45] tracking-[-0.02em] text-pretty md:mb-[14px] md:text-[clamp(19px,1.8vw,25px)] md:leading-[1.42]">
                {d.texto}
              </blockquote>
              <figcaption className="text-xs text-creme/60 md:text-[13px]">
                {d.autor} — {d.imovel}
              </figcaption>
            </figure>
          ))}
          <div className="filete-topo" aria-hidden />
        </div>

        {/* Foto do escritório: só no desktop, como no artboard. */}
        <div className="relative hidden min-h-[360px] overflow-hidden rounded-lg md:block md:flex-[1_1_300px]">
          <Image
            src="/imagens/escritorio-goiania.jpg"
            alt={`Escritório ${site.nome} no ${site.contato.endereco}`}
            fill
            sizes="(max-width: 768px) 0px, 40vw"
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(14,14,12,0)_0%,rgba(14,14,12,0.88)_100%)] p-6">
            <p className="mb-[6px] text-xl font-medium tracking-[-0.02em]">
              {site.contato.endereco}
            </p>
            <p className="text-sm text-creme/70">{site.contato.horario}</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Captação                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="contato"
        className="scroll-mt-20 px-[18px] py-[30px] md:flex md:flex-wrap md:gap-[clamp(28px,5vw,72px)] md:px-5 md:py-[clamp(44px,6vw,96px)] md:shadow-[0_-1px_0_rgba(246,243,236,0.16)] lg:px-14"
      >
        <div className="md:flex-[1_1_320px]">
          <h2 className="mb-[14px] text-[32px] leading-none font-bold tracking-[-0.045em] md:mb-5 md:max-w-[18ch] md:text-[clamp(30px,4.6vw,66px)] md:leading-[0.98]">
            As melhores unidades saem na primeira semana.
          </h2>
          <p className="mb-5 text-sm leading-[1.65] text-creme/72 md:mb-0 md:max-w-[44ch] md:text-[17px] md:leading-[1.7] md:text-pretty">
            <span className="md:hidden">
              Tabela atualizada, plantas e disponibilidade real no WhatsApp em até 15 minutos.
            </span>
            <span className="hidden md:inline">
              Envie seus dados e receba tabela atualizada, plantas e disponibilidade real de
              unidades no WhatsApp, em até 15 minutos no horário comercial.
            </span>
          </p>
        </div>

        <div className="md:flex-[1_1_320px] md:self-start md:rounded-lg md:border md:border-creme/[0.18] md:p-[clamp(22px,3vw,34px)]">
          <FormularioLead />
        </div>
      </section>
    </>
  );
}

/** Schema.org do escritório — `RealEstateAgent`, com o CRECI como identificador. */
function schemaDoEscritorio() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${urlBase()}/#escritorio`,
    name: site.nome,
    url: urlBase(),
    image: `${urlBase()}/imagens/escritorio-goiania.jpg`,
    identifier: site.creci,
    telephone: site.contato.whatsapp,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.contato.endereco,
      addressLocality: site.contato.cidade,
      addressRegion: site.contato.estado,
      addressCountry: 'BR',
    },
    areaServed: regioes.map((r) => ({
      '@type': 'Place',
      name: `${r.nome}, ${r.cidade} — ${r.estado}`,
    })),
    openingHours: ['Mo-Fr 09:00-19:00', 'Sa 09:00-14:00'],
  };
}
