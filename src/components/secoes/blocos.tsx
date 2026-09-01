import Image from 'next/image';
import Link from 'next/link';

import { numeros } from '@/content/escritorio';
import type { Parque } from '@/content/tipos';
import { rotas } from '@/lib/rotas';

/** Grade de indicadores separada por linhas de 1px. 2 colunas no mobile, 4 no desktop. */
export function GradeNumeros({
  itens = numeros,
  usarLabelMobile = false,
}: {
  itens?: { valor: string; label: string; labelMobile?: string }[];
  usarLabelMobile?: boolean;
}) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
      {itens.map((n) => (
        <div key={n.label} className="celula p-[18px] md:px-8 md:py-10">
          <p className="mb-2 text-[26px] leading-none font-semibold tracking-[-0.035em] md:mb-[10px] md:text-[clamp(30px,3.4vw,46px)]">
            {n.valor}
          </p>
          <p className="text-xs text-creme/60 md:text-[13px]">
            {usarLabelMobile && n.labelMobile ? (
              <>
                <span className="md:hidden">{n.labelMobile}</span>
                <span className="hidden md:inline">{n.label}</span>
              </>
            ) : (
              n.label
            )}
          </p>
        </div>
      ))}
    </section>
  );
}

/**
 * Faixa de tela cheia com a foto do parque. Na home é o que explica por que o
 * setor vale o preço — e a porta de entrada para a página do parque.
 */
export function BannerParque({ parque }: { parque: Parque }) {
  return (
    <section className="relative flex min-h-[62svh] items-end md:min-h-[clamp(420px,78svh,760px)]">
      <Image
        src={parque.imagem}
        alt={parque.imagemAlt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,12,0.7)_0%,rgba(14,14,12,0.2)_35%,rgba(14,14,12,0.95)_100%)] md:bg-[linear-gradient(180deg,rgba(14,14,12,0.72)_0%,rgba(14,14,12,0.2)_34%,rgba(14,14,12,0.6)_72%,rgba(14,14,12,0.95)_100%)]"
      />

      <div className="relative w-full px-[18px] pt-[60px] pb-7 text-white md:px-5 md:pt-[clamp(60px,10vw,130px)] md:pb-[clamp(32px,5vw,60px)] lg:px-14">
        <span className="mb-4 inline-block rounded-full border border-white/30 bg-white/[0.16] px-[14px] py-[6px] text-[11px] font-medium backdrop-blur-[8px] md:mb-5 md:px-4 md:py-[7px] md:text-xs">
          {parque.chamadaCurta}
        </span>
        <h2 className="mb-[14px] max-w-[18ch] text-[34px] leading-[0.96] font-bold tracking-[-0.045em] text-white md:mb-5 md:text-[clamp(32px,5.4vw,76px)] md:leading-[0.94] md:tracking-[-0.05em]">
          {parque.titulo}
        </h2>
        <p className="mb-[18px] max-w-[52ch] text-sm leading-[1.65] font-light text-white/88 text-pretty md:mb-[26px] md:text-[clamp(15px,1.2vw,18px)] md:leading-[1.68]">
          <span className="md:hidden">{parque.resumoPaginaMobile}</span>
          <span className="hidden md:inline">{parque.resumoHome}</span>
        </p>
        <Link
          href={rotas.parque(parque.slug)}
          className="inline-block border-b-2 border-ouro pb-1 text-[15px] font-semibold text-white md:pb-[5px] md:text-base"
        >
          Conhecer o projeto
          <span className="hidden md:inline"> do parque</span> →
        </Link>
      </div>
    </section>
  );
}

/** Bloco numerado "01 / 02 / 03 / 04" — usado no processo e nas obras dos parques. */
export function ListaNumerada({ itens }: { itens: { n: string; titulo: string; texto: string }[] }) {
  return (
    <>
      {/* Mobile: lista com filete entre as linhas. */}
      <div className="grid md:hidden">
        {itens.map((item) => (
          <div key={item.n} className="filete-topo py-[18px]">
            <div className="flex items-baseline gap-[14px]">
              <span className="font-mono text-xs text-ouro">{item.n}</span>
              <div>
                <h3 className="mb-2 text-[19px] leading-[1.2] font-semibold tracking-[-0.025em]">
                  {item.titulo}
                </h3>
                <p className="text-sm leading-[1.6] text-creme/68">{item.texto}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="filete-topo" aria-hidden />
      </div>

      {/* Desktop: grade de cartões com o número no topo. */}
      <div className="hidden grid-cols-[repeat(auto-fit,minmax(220px,1fr))] md:grid">
        {itens.map((item) => (
          <div
            key={item.n}
            className="celula flex min-h-[240px] flex-col justify-between gap-7 p-[clamp(22px,2.6vw,34px)]"
          >
            <span className="font-mono text-[13px] text-ouro">{item.n}</span>
            <div>
              <h3 className="mb-[10px] text-[21px] leading-[1.18] font-semibold tracking-[-0.025em] lg:text-[22px]">
                {item.titulo}
              </h3>
              <p className="text-[15px] leading-[1.6] text-creme/68">{item.texto}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Mapa estilizado do design — grade, vias e o alfinete dourado. */
export function MapaPlaceholder({
  rotulo,
  proporcao = 'aspect-[4/3] md:aspect-video',
}: {
  rotulo: string;
  proporcao?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`Mapa da localização de ${rotulo}`}
      className={`relative overflow-hidden rounded-[10px] border border-creme/[0.16] bg-[#171714] bg-[linear-gradient(rgba(246,243,236,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(246,243,236,0.06)_1px,transparent_1px)] bg-[length:44px_44px] md:rounded-lg md:bg-[length:48px_48px] ${proporcao}`}
    >
      <div className="absolute inset-x-0 top-[44%] h-[14px] bg-white/[0.07] md:top-[43%] md:h-4" />
      <div className="absolute inset-y-0 left-[58%] hidden w-[14px] bg-white/[0.07] md:block" />
      <div className="absolute top-[42%] left-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center gap-[6px] md:top-[41%]">
        <span className="rounded-full bg-ouro px-3 py-[7px] text-[11px] font-semibold whitespace-nowrap text-tinta md:px-[14px] md:py-2 md:text-xs">
          {rotulo}
        </span>
        <span className="h-[10px] w-[10px] rounded-full bg-ouro md:h-[11px] md:w-[11px]" />
      </div>
      <span className="absolute bottom-[10px] left-3 font-mono text-[9px] text-creme/40 md:bottom-3 md:left-[14px] md:text-[10px]">
        [ MAPA INTERATIVO — GOOGLE MAPS ]
      </span>
    </div>
  );
}
