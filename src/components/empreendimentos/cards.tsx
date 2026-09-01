import Link from 'next/link';

import { nomeDaRegiao, rotuloDaCategoria } from '@/content/regioes';
import type { Empreendimento } from '@/content/tipos';
import { rotas } from '@/lib/rotas';
import { Foto } from '@/components/ui/primitivas';

function Seta({ tamanho = 34 }: { tamanho?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-ouro text-tinta"
      style={{ width: tamanho, height: tamanho, fontSize: tamanho > 34 ? 16 : 15 }}
    >
      →
    </span>
  );
}

function capaAlt(e: Empreendimento) {
  return `${e.nome} — ${rotuloDaCategoria(e.categoria)} em ${nomeDaRegiao(e.regiaoSlug)}, Goiânia`;
}

/**
 * Card de "Oportunidades da semana", na home.
 * Desktop: grade de 270px+ com elevação no hover. Mobile: coluna única.
 */
export function CardOportunidade({ e }: { e: Empreendimento }) {
  const capa = e.midias.find((m) => m.tipo === 'foto');

  return (
    <Link
      href={rotas.empreendimento(e)}
      className="block overflow-hidden rounded-[14px] border border-creme/[0.14] bg-carvao transition-[transform,box-shadow,border-color] duration-200 md:hover:-translate-y-[10px] md:hover:border-ouro md:hover:shadow-[0_24px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="relative aspect-[16/11]">
        <Foto
          url={capa?.url ?? null}
          alt={capaAlt(e)}
          legenda={`[ foto — ${e.nome} ]`}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
        />
        <span className="absolute top-3 left-3 rounded-full bg-[rgba(20,19,15,0.85)] px-[13px] py-[6px] text-[11px] font-semibold md:top-[14px] md:left-[14px] md:px-[14px] md:py-[7px]">
          {rotuloDaCategoria(e.categoria)}
        </span>
      </div>

      <div className="p-[18px] md:p-5">
        <p className="mb-2 text-xs font-medium text-ouro md:mb-[10px]">
          {nomeDaRegiao(e.regiaoSlug)}
        </p>
        <h3 className="mb-2 text-xl leading-[1.2] font-semibold tracking-[-0.025em] md:mb-[10px]">
          {e.nome}
        </h3>
        <p className="mb-[14px] text-[13px] leading-[1.55] font-light text-creme/62 md:mb-4 md:leading-[1.6]">
          {e.quartos} · {e.metragem} · {e.entrega}
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-semibold tracking-[-0.03em] md:text-[21px]">
            {e.precoExibicao}
          </span>
          <Seta />
        </div>
      </div>
    </Link>
  );
}

/** Card da listagem — o mais completo, com ficha rápida e "Ver detalhes". */
export function CardListagem({ e }: { e: Empreendimento }) {
  const capa = e.midias.find((m) => m.tipo === 'foto');

  return (
    <Link
      href={rotas.empreendimento(e)}
      className="block overflow-hidden rounded-[14px] border border-creme/[0.14] bg-carvao transition-[transform,box-shadow,border-color] duration-200 md:hover:-translate-y-[10px] md:hover:border-ouro md:hover:shadow-[0_24px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="relative aspect-[16/11]">
        <Foto
          url={capa?.url ?? null}
          alt={capaAlt(e)}
          legenda={`[ foto — ${e.nome} ]`}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <span className="absolute top-3 left-3 rounded-full bg-[rgba(20,19,15,0.85)] px-[13px] py-[6px] text-[11px] font-semibold md:top-[14px] md:left-[14px] md:px-[14px] md:py-[7px]">
          {rotuloDaCategoria(e.categoria)}
        </span>
        <span
          aria-hidden
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-[rgba(20,19,15,0.85)] text-sm md:top-[14px] md:right-[14px] md:h-[34px] md:w-[34px]"
        >
          ♡
        </span>
        {/* Bolinha da incorporadora, sobreposta na borda — só no desktop. */}
        <span
          aria-hidden
          className="absolute -bottom-[22px] right-[18px] hidden h-[46px] w-[46px] rounded-full border-2 border-carvao hachura md:block"
        />
      </div>

      <div className="p-[18px] md:p-[22px]">
        <p className="mb-2 text-xs font-medium text-ouro md:mb-[10px]">
          <span className="hidden md:inline">
            {rotuloDaCategoria(e.categoria)} <span className="text-creme/40">·</span>{' '}
          </span>
          <span className="font-normal text-creme/65 md:font-normal">
            {nomeDaRegiao(e.regiaoSlug)}, Goiânia
          </span>
        </p>
        <h3 className="mb-2 text-xl leading-[1.2] font-semibold tracking-[-0.025em] md:mb-[10px] md:text-[22px]">
          {e.nome}
        </h3>
        <p className="mb-[14px] text-[13px] leading-[1.55] font-light text-creme/62 md:mb-[18px] md:text-sm md:leading-[1.6] md:text-creme/66">
          {e.resumo}
        </p>
        <p className="mb-[14px] text-[22px] font-semibold tracking-[-0.03em] md:mb-4 md:text-2xl">
          {e.precoExibicao}
        </p>

        <div className="flex flex-wrap gap-[14px] rounded-[10px] border border-creme/[0.14] px-[14px] py-3 text-xs text-creme/75 md:gap-[18px] md:px-4 md:py-[13px] md:text-[13px]">
          <span>{e.quartos}</span>
          <span>{e.banheiros}</span>
          <span>{e.metragem}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 md:mt-[18px]">
          <span className="text-sm font-semibold">Ver detalhes</span>
          <span className="md:hidden">
            <Seta />
          </span>
          <span className="hidden md:block">
            <Seta tamanho={38} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Card de "Imóveis parecidos" — compacto, rola na horizontal no mobile. */
export function CardSimilar({ e }: { e: Empreendimento }) {
  const capa = e.midias.find((m) => m.tipo === 'foto');

  return (
    <Link
      href={rotas.empreendimento(e)}
      className="block w-[230px] shrink-0 overflow-hidden rounded-xl border border-creme/[0.14] bg-carvao md:w-auto md:shrink md:rounded-lg md:border-creme/[0.16] md:bg-transparent md:transition-colors md:hover:border-ouro"
    >
      <div className="relative aspect-[4/3]">
        <Foto
          url={capa?.url ?? null}
          alt={capaAlt(e)}
          legenda="[ foto ]"
          sizes="(max-width: 768px) 230px, 25vw"
        />
      </div>
      <div className="p-4 md:p-[18px]">
        <p className="mb-[6px] text-[11px] text-ouro md:mb-2 md:font-mono md:text-[10px] md:tracking-[0.14em] md:text-creme/55">
          {nomeDaRegiao(e.regiaoSlug)}
          <span className="hidden md:inline"> · {rotuloDaCategoria(e.categoria)}</span>
        </p>
        <h3 className="mb-2 text-[17px] leading-[1.2] font-semibold tracking-[-0.02em] md:mb-[10px] md:text-[19px] md:leading-[1.15] md:tracking-[-0.025em]">
          {e.nome}
        </h3>
        <p className="text-base font-semibold md:text-[18px] md:font-medium md:text-ouro">
          {e.precoExibicao}
        </p>
      </div>
    </Link>
  );
}

/** Card usado nas páginas de parque ("Empreendimentos no entorno"). */
export function CardVizinhoDoParque({ e }: { e: Empreendimento }) {
  const capa = e.midias.find((m) => m.tipo === 'foto');

  return (
    <Link
      href={rotas.empreendimento(e)}
      className="block overflow-hidden rounded-[14px] border border-creme/[0.14] bg-carvao transition-[transform,box-shadow,border-color] duration-200 md:rounded-lg md:border-creme/[0.16] md:bg-transparent md:hover:-translate-y-[6px] md:hover:border-ouro md:hover:shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
    >
      <div className="relative aspect-[16/11] md:aspect-[4/3]">
        <Foto
          url={capa?.url ?? null}
          alt={capaAlt(e)}
          legenda={`[ foto — ${e.nome} ]`}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="absolute top-3 left-3 rounded-full bg-[rgba(20,19,15,0.85)] px-[13px] py-[6px] text-[11px] font-semibold md:top-3 md:right-3 md:left-auto md:border md:border-creme/[0.24] md:bg-[rgba(20,19,15,0.8)] md:px-3 md:py-[6px] md:font-medium">
          {rotuloDaCategoria(e.categoria)}
        </span>
      </div>

      <div className="p-[18px] md:p-5">
        <p className="mb-2 text-xs font-medium text-ouro md:mb-[10px] md:font-mono md:text-[10px] md:tracking-[0.14em] md:font-normal md:text-creme/55">
          {nomeDaRegiao(e.regiaoSlug)}
        </p>
        <h3 className="mb-2 text-xl leading-[1.2] font-semibold tracking-[-0.025em] md:mb-[14px] md:text-[21px] md:leading-[1.15]">
          {e.nome}
        </h3>
        <p className="mb-[14px] text-[13px] font-light text-creme/62 md:mb-4 md:border-0 md:pb-4 md:text-sm md:text-creme/65 md:shadow-[0_1px_0_rgba(246,243,236,0.14)]">
          {e.quartos} · {e.metragem}
          <span className="hidden md:inline"> · {e.entrega}</span>
        </p>

        {/* Mobile: preço grande + seta. Desktop: "A partir de" + preço em ouro. */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          <span className="text-xl font-semibold tracking-[-0.03em]">{e.precoExibicao}</span>
          <Seta />
        </div>
        <div className="hidden items-baseline justify-between gap-3 md:flex">
          <span className="text-xs text-creme/55">A partir de</span>
          <span className="text-xl font-medium text-ouro">{e.precoExibicao}</span>
        </div>
      </div>
    </Link>
  );
}
