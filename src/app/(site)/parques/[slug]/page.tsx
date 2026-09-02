import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CardVizinhoDoParque } from '@/components/empreendimentos/cards';
import { Cabecalho } from '@/components/layout/cabecalho';
import { GradeNumeros, ListaNumerada } from '@/components/secoes/blocos';
import { Eyebrow } from '@/components/ui/primitivas';
import { empreendimentosPorParque } from '@/content/empreendimentos';
import { parquePorSlug, parques } from '@/content/parques';
import { rotas } from '@/lib/rotas';

export const revalidate = 3600;
export const dynamicParams = false;

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return parques.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const parque = parquePorSlug(slug);
  if (!parque) return {};

  return {
    title: `${parque.nome} — o que muda com a obra`,
    description: parque.resumoPagina,
    alternates: { canonical: rotas.parque(parque.slug) },
  };
}

export default async function PaginaParque({ params }: Params) {
  const { slug } = await params;
  const parque = parquePorSlug(slug);
  if (!parque) notFound();

  const vizinhos = empreendimentosPorParque(parque.slug);

  return (
    <>
      <Cabecalho ativo="parques" />

      {/* Herói ----------------------------------------------------------- */}
      <section className="relative flex min-h-[62svh] items-end md:h-[clamp(340px,70svh,720px)]">
        <Image
          src={parque.imagem}
          alt={parque.imagemAlt}
          fill
          priority
          sizes="100vw"
          quality={92}
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,12,0.6)_0%,rgba(14,14,12,0.15)_34%,rgba(14,14,12,0.95)_100%)] md:bg-[linear-gradient(180deg,rgba(14,14,12,0.4)_0%,rgba(14,14,12,0.1)_40%,rgba(14,14,12,0.92)_100%)]"
        />

        <div className="relative w-full px-[18px] pt-[50px] pb-[26px] text-white md:max-w-[900px] md:px-5 md:pt-0 md:pb-[clamp(28px,4vw,52px)] lg:px-14">
          <span className="mb-4 inline-block rounded-full bg-ouro px-[14px] py-[6px] text-[11px] font-semibold text-tinta md:mb-[18px] md:text-xs">
            {parque.selo}
          </span>
          <h1 className="mb-[14px] text-[38px] leading-[0.95] font-bold tracking-[-0.048em] text-white md:mb-5 md:text-[clamp(36px,6.4vw,88px)] md:leading-[0.94] md:tracking-[-0.05em]">
            {parque.titulo}
          </h1>
          <p className="max-w-[54ch] text-sm leading-[1.65] font-light text-white/85 text-pretty md:text-[clamp(15px,1.2vw,18px)]">
            <span className="md:hidden">{parque.resumoPaginaMobile}</span>
            <span className="hidden md:inline">{parque.resumoPagina}</span>
          </p>
        </div>
      </section>

      <GradeNumeros itens={parque.numeros} usarLabelMobile />

      {/* O que está sendo feito ------------------------------------------ */}
      <section className="px-[18px] pt-7 md:px-5 md:py-[clamp(36px,6vw,96px)] lg:px-14">
        <Eyebrow className="mb-4 md:mb-[clamp(18px,2.4vw,32px)]">O QUE ESTÁ SENDO FEITO</Eyebrow>
        <ListaNumerada itens={parque.etapas} />
      </section>

      {/* O que muda para quem mora ao redor ------------------------------ */}
      <section className="mt-7 bg-creme px-[18px] py-7 text-tinta md:mt-0 md:px-5 md:py-[clamp(36px,6vw,92px)] lg:px-14">
        <div className="md:flex md:flex-wrap md:gap-[clamp(24px,4vw,64px)]">
          <div className="md:flex-[1_1_300px]">
            <h2 className="mb-[14px] text-[26px] leading-[1.1] font-semibold tracking-[-0.035em] md:mb-[18px] md:max-w-[18ch] md:text-[clamp(26px,3.6vw,48px)] md:leading-[1.06]">
              {parque.impacto.titulo}
            </h2>
            {parque.impacto.paragrafos.map((p, i) => (
              <p
                key={p.slice(0, 24)}
                className={`max-w-[50ch] text-[15px] leading-[1.68] text-grafite text-pretty md:text-base md:leading-[1.7] ${
                  i === 0 ? 'mb-5 md:mb-4' : ''
                } ${i > 0 ? 'hidden md:block' : ''}`}
              >
                {p}
              </p>
            ))}
          </div>

          <dl className="grid content-start text-sm md:flex-[1_1_280px] md:text-base">
            {parque.impacto.linhas.map((l, i) => (
              <div
                key={l.rotulo}
                className={`filete-topo-escuro flex justify-between gap-3 py-[14px] md:py-4 ${
                  i === 0 ? 'hidden md:flex' : ''
                } ${i === parque.impacto.linhas.length - 1 ? 'shadow-[0_-1px_0_rgba(20,19,15,0.16),0_1px_0_rgba(20,19,15,0.16)]' : ''}`}
              >
                <dt className="text-pedra">{l.rotulo}</dt>
                <dd className="m-0 font-medium">{l.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Empreendimentos no entorno -------------------------------------- */}
      {vizinhos.length ? (
        <section className="px-[18px] pt-[30px] pb-[34px] md:px-5 md:py-[clamp(36px,6vw,96px)] lg:px-14">
          <div className="mb-[18px] md:mb-[clamp(20px,3vw,38px)] md:flex md:flex-wrap md:items-end md:justify-between md:gap-5">
            <div>
              <Eyebrow className="mb-3 md:mb-[14px]">{parque.eyebrowProximos}</Eyebrow>
              <h2 className="text-[28px] leading-none font-semibold tracking-[-0.035em] md:text-[clamp(26px,3.8vw,50px)]">
                {parque.tituloProximos}
              </h2>
            </div>
            <Link
              href={rotas.imoveis}
              className="hidden border-b border-ouro pb-1 text-sm font-medium md:block"
            >
              Ver todos os imóveis
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] md:gap-[clamp(14px,2vw,24px)]">
            {vizinhos.map((e) => (
              <CardVizinhoDoParque key={e.slug} e={e} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="px-[18px] pb-6 font-mono text-[10px] leading-[1.7] text-creme/45 md:px-5 md:text-[11px] lg:px-14">
        DADOS DO PROJETO DE REVITALIZAÇÃO SÃO ILUSTRATIVOS E SEGUEM O CRONOGRAMA DIVULGADO PELA
        PREFEITURA DE GOIÂNIA.
      </p>
    </>
  );
}
