import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { Cabecalho } from '@/components/layout/cabecalho';
import { Mapa } from '@/components/mapa/mapa';
import { GradeNumeros, ListaNumerada } from '@/components/secoes/blocos';
import { Eyebrow } from '@/components/ui/primitivas';
import { site } from '@/config/site';
import { comoTrabalhamos, equipe, processo } from '@/content/escritorio';
import { rotas } from '@/lib/rotas';

export const revalidate = 3600;

const descricaoEscritorio =
  'Dezoito anos vendendo os mesmos três setores de Goiânia. Curadoria de empreendimentos com registro de incorporação, memorial e cronograma conferidos antes de entrar no catálogo.';

export const metadata: Metadata = {
  title: 'O escritório',
  description: descricaoEscritorio,
  keywords: [
    `${site.nome} Goiânia`,
    'imobiliária em Goiânia',
    'corretor de imóveis em Goiânia',
    site.creci,
    'lançamentos e imóveis na planta em Goiânia',
  ],
  alternates: { canonical: rotas.escritorio },
  openGraph: {
    title: `O escritório · ${site.nome}`,
    description: descricaoEscritorio,
    type: 'website',
    url: rotas.escritorio,
    images: [
      {
        url: '/imagens/escritorio-goiania.jpg',
        alt: `Escritório ${site.nome}, ${site.contato.cidade} — ${site.contato.estado}`,
      },
    ],
  },
};

export default function PaginaEscritorio() {
  return (
    <>
      <Cabecalho ativo="escritorio" />

      <section className="px-[18px] pt-[30px] pb-5 md:px-5 md:pt-[clamp(40px,7vw,110px)] md:pb-[clamp(24px,3vw,44px)] lg:px-14">
        <Eyebrow className="mb-[18px] md:mb-[clamp(20px,3vw,36px)]">O ESCRITÓRIO</Eyebrow>
        <h1 className="max-w-[20ch] text-[40px] leading-[0.94] font-bold tracking-[-0.05em] text-balance md:text-[clamp(38px,7.6vw,108px)] md:leading-[0.92]">
          Dezoito anos vendendo os mesmos três setores.
        </h1>
      </section>

      <section className="px-[18px] md:px-5 lg:px-14">
        <div className="relative h-[40svh] overflow-hidden rounded-xl md:h-[clamp(280px,54svh,600px)] md:rounded-[10px]">
          <Image
            src="/imagens/escritorio-goiania.jpg"
            alt={`Escritório ${site.nome}, no ${site.contato.endereco}`}
            fill
            priority
            sizes="100vw"
            quality={92}
            className="object-cover"
          />
          <span className="absolute right-4 bottom-3 hidden font-mono text-[10px] text-creme/75 md:block">
            ESCRITÓRIO · {site.contato.endereco.toUpperCase()}
          </span>
        </div>
      </section>

      {/* Como trabalhamos ------------------------------------------------- */}
      <section className="px-[18px] pt-7 md:flex md:flex-wrap md:gap-[clamp(20px,4vw,72px)] md:px-5 md:py-[clamp(36px,6vw,96px)] md:shadow-[0_1px_0_rgba(246,243,236,0.16)] lg:px-14">
        <Eyebrow tom="claro" className="mb-4 shrink-0 md:mb-0">
          01 — COMO TRABALHAMOS
        </Eyebrow>
        <div className="md:max-w-[66ch] md:flex-[1_1_420px]">
          <p className="mb-[18px] text-xl leading-[1.35] font-medium tracking-[-0.025em] text-pretty md:mb-6 md:text-[clamp(21px,2.4vw,32px)] md:leading-[1.28] md:tracking-[-0.03em]">
            <span className="md:hidden">{comoTrabalhamos.destaqueMobile}</span>
            <span className="hidden md:inline">{comoTrabalhamos.destaque}</span>
          </p>
          {comoTrabalhamos.paragrafos.map((p, i) => (
            <p
              key={p.slice(0, 24)}
              className={`text-[15px] leading-[1.72] text-creme/72 text-pretty md:text-[17px] md:leading-[1.78] ${
                i === 0 ? 'mb-[14px] md:mb-4' : ''
              }`}
            >
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* O processo -------------------------------------------------------- */}
      <section className="px-[18px] pt-7 md:px-5 md:py-[clamp(36px,6vw,96px)] lg:px-14">
        <Eyebrow tom="claro" className="mb-4 md:mb-[clamp(18px,2.4vw,32px)]">
          02 — O PROCESSO
        </Eyebrow>
        <ListaNumerada itens={processo} />
      </section>

      {/* Equipe ------------------------------------------------------------ */}
      <section className="mt-7 bg-creme px-[18px] py-7 text-tinta md:mt-0 md:px-5 md:py-[clamp(36px,6vw,96px)] lg:px-14">
        <div className="mb-5 md:mb-[clamp(20px,3vw,40px)] md:flex md:flex-wrap md:items-baseline md:justify-between md:gap-[18px]">
          <Eyebrow tom="escuro" className="mb-3 md:order-2 md:mb-0">
            03 — EQUIPE
          </Eyebrow>
          <h2 className="text-[28px] leading-none font-semibold tracking-[-0.035em] md:order-1 md:text-[clamp(26px,3.8vw,52px)]">
            Quem atende você
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-[14px] md:grid-cols-[repeat(auto-fit,minmax(210px,1fr))] md:gap-[clamp(14px,2vw,26px)]">
          {equipe.map((c) => (
            <div key={c.nome}>
              <div className="hachura-clara mb-[10px] grid aspect-[3/4] place-items-center rounded-[10px] p-3 text-center font-mono text-[9px] text-areia md:mb-[14px] md:rounded-lg md:p-[14px] md:text-[10px]">
                [ retrato — {c.nome} ]
              </div>
              <h3 className="mb-[5px] text-base font-semibold tracking-[-0.02em] md:mb-[6px] md:text-[19px] md:tracking-[-0.025em]">
                {c.nome}
              </h3>
              {/* COFECI 1.065/2007: cada corretor aparece com a sua inscrição. */}
              <p className="text-xs text-pedra md:text-[13px]">
                Corretor de imóveis · {c.creci}
                <br className="md:hidden" />
                <span className="hidden md:inline"> · </span>
                {c.regiao}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="hidden md:block">
        <GradeNumeros />
      </div>

      {/* Contato ----------------------------------------------------------- */}
      <section
        id="contato"
        className="scroll-mt-20 px-[18px] pt-7 pb-[34px] md:flex md:flex-wrap md:gap-[clamp(24px,4vw,72px)] md:px-5 md:py-[clamp(36px,6vw,96px)] lg:px-14"
      >
        <div className="md:flex-[1_1_300px]">
          <h2 className="mb-[18px] text-[30px] leading-[1.02] font-bold tracking-[-0.04em] md:mb-[22px] md:max-w-[18ch] md:text-[clamp(28px,4.2vw,58px)] md:leading-none md:tracking-[-0.045em]">
            Venha tomar um café no escritório.
          </h2>

          <dl className="mb-[22px] grid max-w-[44ch] gap-4 text-[15px] text-creme/80 md:mb-0 md:text-base">
            <div>
              <dt className="mb-[5px] font-mono text-[10px] tracking-[0.16em] text-creme/50 md:mb-[6px]">
                ENDEREÇO
              </dt>
              <dd className="m-0">
                {site.contato.endereco}, {site.contato.cidade} — {site.contato.estado}
              </dd>
            </div>
            <div>
              <dt className="mb-[5px] font-mono text-[10px] tracking-[0.16em] text-creme/50 md:mb-[6px]">
                HORÁRIO
              </dt>
              <dd className="m-0">{site.contato.horario}</dd>
            </div>
            <div>
              <dt className="mb-[5px] font-mono text-[10px] tracking-[0.16em] text-creme/50 md:mb-[6px]">
                WHATSAPP
              </dt>
              <dd className="m-0">{site.contato.telefoneExibicao}</dd>
            </div>
          </dl>

          <Link
            href={rotas.imoveis}
            className="block rounded-lg bg-ouro p-[17px] text-center text-[15px] font-semibold text-tinta md:mt-[30px] md:inline-block md:rounded md:px-[30px]"
          >
            Ver imóveis
          </Link>
        </div>

        <div className="mt-6 hidden md:mt-0 md:block md:min-h-[300px] md:flex-[1_1_300px]">
          <Mapa
            rotulo={`Escritório ${site.nome}`}
            endereco={site.contato.endereco}
            proporcao="h-full min-h-[300px]"
          />
        </div>
      </section>
    </>
  );
}
