'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { FAIXAS_DE_PRECO } from '@/components/busca/busca';
import { categorias, regioes } from '@/content/regioes';
import { comParametros, ORDENS, type Filtros, paramsAtuais } from '@/lib/filtros';

const pill =
  'rounded-full border border-creme/[0.2] bg-creme/[0.06] px-4 py-[11px] text-[13px] text-creme outline-none focus:border-ouro';

/**
 * Barra de filtros grudada abaixo do cabeçalho.
 *
 * É um `<form method="get">` de verdade: sem JavaScript, digitar e apertar
 * Enter continua filtrando. Com JavaScript, mudar um seletor já envia.
 */
export function BarraFiltros({ filtros, basePath }: { filtros: Filtros; basePath: string }) {
  const refFormulario = useRef<HTMLFormElement>(null);
  const enviar = () => refFormulario.current?.requestSubmit();

  return (
    <form
      ref={refFormulario}
      method="get"
      action={basePath}
      className="sticky top-[57px] z-[50] bg-[rgba(14,14,12,0.95)] py-3 shadow-[0_1px_0_rgba(246,243,236,0.14),0_-1px_0_rgba(246,243,236,0.14)] backdrop-blur-[12px] md:top-[56px] md:flex md:flex-wrap md:items-center md:gap-[10px] md:px-5 md:py-[14px] md:shadow-[0_1px_0_rgba(246,243,236,0.16),0_-1px_0_rgba(246,243,236,0.16)] lg:px-14"
    >
      {/* Campo de busca — pílula, igual nos dois artboards. */}
      <label className="mx-[18px] mb-[10px] flex items-center gap-[10px] rounded-full border border-creme/[0.2] bg-creme/[0.06] px-4 py-3 md:mx-0 md:mb-0 md:flex-[1_1_240px] md:px-[18px] md:py-[11px]">
        <span aria-hidden className="text-[15px] text-creme/50">
          ⌕
        </span>
        <span className="sr-only">Buscar por empreendimento ou setor</span>
        <input
          name="busca"
          type="search"
          defaultValue={filtros.busca ?? ''}
          placeholder="Buscar empreendimento ou setor"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-creme outline-none"
        />
      </label>

      {/* Seletores — só no desktop; no mobile eles moram na folha de filtros. */}
      <select
        name="categoria"
        aria-label="Categoria"
        defaultValue={filtros.categoria ?? ''}
        onChange={enviar}
        className={`hidden md:block ${pill}`}
      >
        <option value="">Todas as categorias</option>
        {categorias.map((c) => (
          <option key={c.slug} value={c.slug} className="text-tinta">
            {c.singular}
          </option>
        ))}
      </select>

      <select
        name="regiao"
        aria-label="Região"
        defaultValue={filtros.regiao ?? ''}
        onChange={enviar}
        className={`hidden md:block ${pill}`}
      >
        <option value="">Todas as regiões</option>
        {regioes.map((r) => (
          <option key={r.slug} value={r.slug} className="text-tinta">
            {r.nome}
          </option>
        ))}
      </select>

      <select
        name="ordem"
        aria-label="Ordenar"
        defaultValue={filtros.ordem}
        onChange={enviar}
        className={`hidden md:block ${pill}`}
      >
        {ORDENS.map((o) => (
          <option key={o.valor} value={o.valor} className="text-tinta">
            {o.rotulo}
          </option>
        ))}
      </select>

      {/* Chips do mobile: o primeiro abre a folha, os demais alternam filtros. */}
      <div className="flex gap-2 overflow-x-auto px-[18px] md:hidden">
        <FolhaFiltros filtros={filtros} basePath={basePath} />
        {categorias.map((c) => (
          <ChipMobile
            key={c.slug}
            href={`${basePath}${comParametros(paramsAtuais(filtros), {
              categoria: filtros.categoria === c.slug ? undefined : c.slug,
            })}`}
            ativo={filtros.categoria === c.slug}
          >
            {c.singular}
          </ChipMobile>
        ))}
        {regioes.map((r) => (
          <ChipMobile
            key={r.slug}
            href={`${basePath}${comParametros(paramsAtuais(filtros), {
              regiao: filtros.regiao === r.slug ? undefined : r.slug,
            })}`}
            ativo={filtros.regiao === r.slug}
          >
            {r.nome.replace('Setor ', '')}
          </ChipMobile>
        ))}
      </div>

      <span className="hidden flex-[1_1_10px] md:block" />

      <ControleDeVista filtros={filtros} basePath={basePath} />

      <Link href={basePath} className="hidden text-[13px] text-creme/60 underline md:block">
        Limpar
      </Link>

      {/* Sem JavaScript, este é o botão que envia o formulário. */}
      <noscript>
        <button type="submit" className={`${pill} md:ml-2`}>
          Filtrar
        </button>
      </noscript>
    </form>
  );
}

function ChipMobile({
  href,
  ativo,
  children,
}: {
  href: string;
  ativo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-pressed={ativo}
      className={`shrink-0 rounded-full px-4 py-[10px] text-[13px] whitespace-nowrap ${
        ativo ? 'bg-ouro font-semibold text-tinta' : 'border border-creme/[0.24]'
      }`}
    >
      {children}
    </Link>
  );
}

/**
 * Grade / Lista alternam o layout dos resultados. Mapa fica visível porque o
 * design o prevê, mas desabilitado enquanto não existe integração de mapa —
 * um botão que não faz nada é pior que um botão que diz por que não faz.
 */
function ControleDeVista({ filtros, basePath }: { filtros: Filtros; basePath: string }) {
  const base = paramsAtuais(filtros);

  return (
    <div className="ml-auto hidden gap-1 rounded-full border border-creme/[0.2] bg-creme/[0.06] p-1 md:flex">
      <Link
        href={`${basePath}${comParametros(base, { vista: undefined })}`}
        className={`rounded-full px-4 py-2 text-[13px] ${
          filtros.vista === 'grade' ? 'bg-ouro font-semibold text-tinta' : 'hover:opacity-70'
        }`}
      >
        Grade
      </Link>
      <Link
        href={`${basePath}${comParametros(base, { vista: 'lista' })}`}
        className={`rounded-full px-4 py-2 text-[13px] ${
          filtros.vista === 'lista' ? 'bg-ouro font-semibold text-tinta' : 'hover:opacity-70'
        }`}
      >
        Lista
      </Link>
      <span
        aria-disabled
        title="Disponível quando o mapa for integrado"
        className="cursor-not-allowed rounded-full px-4 py-2 text-[13px] opacity-40"
      >
        Mapa
      </span>
    </div>
  );
}

/** Folha vinda de baixo com todos os filtros — o padrão mobile do design. */
function FolhaFiltros({ filtros, basePath }: { filtros: Filtros; basePath: string }) {
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    if (!aberta) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberta(false);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [aberta]);

  const base = paramsAtuais(filtros);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        className="shrink-0 rounded-full bg-ouro px-4 py-[10px] text-[13px] font-semibold text-tinta"
      >
        ⚙ Filtros
      </button>

      {aberta ? (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-[rgba(10,10,9,0.7)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAberta(false);
          }}
        >
          <div className="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-t-[18px] bg-carvao px-[18px] pt-5 pb-[26px] shadow-[0_-12px_40px_rgba(0,0,0,0.6)]">
            <div className="mx-auto mb-5 h-1 w-[42px] rounded-full bg-creme/25" aria-hidden />
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Filtros</h2>
              <Link
                href={basePath}
                onClick={() => setAberta(false)}
                className="text-[13px] text-creme/60 underline"
              >
                Limpar tudo
              </Link>
            </div>

            <p className="mb-[10px] font-mono text-[10px] tracking-[0.14em] text-creme/55">
              CATEGORIA
            </p>
            <div className="mb-[22px] flex flex-wrap gap-2">
              {categorias.map((c) => (
                <Link
                  key={c.slug}
                  href={`${basePath}${comParametros(base, {
                    categoria: filtros.categoria === c.slug ? undefined : c.slug,
                  })}`}
                  onClick={() => setAberta(false)}
                  className={`rounded-full px-4 py-[10px] text-[13px] ${
                    filtros.categoria === c.slug
                      ? 'bg-ouro font-semibold text-tinta'
                      : 'border border-creme/[0.26]'
                  }`}
                >
                  {c.singular}
                </Link>
              ))}
            </div>

            <p className="mb-[10px] font-mono text-[10px] tracking-[0.14em] text-creme/55">
              REGIÃO
            </p>
            <div className="mb-[22px] grid gap-[10px] text-[15px]">
              {regioes.map((r) => (
                <Link
                  key={r.slug}
                  href={`${basePath}${comParametros(base, {
                    regiao: filtros.regiao === r.slug ? undefined : r.slug,
                  })}`}
                  onClick={() => setAberta(false)}
                  className="flex items-center gap-3"
                >
                  <span
                    aria-hidden
                    className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[3px] border text-[11px] ${
                      filtros.regiao === r.slug
                        ? 'border-ouro bg-ouro text-tinta'
                        : 'border-creme/40'
                    }`}
                  >
                    {filtros.regiao === r.slug ? '✓' : ''}
                  </span>
                  {r.nome}
                </Link>
              ))}
            </div>

            <p className="mb-[10px] font-mono text-[10px] tracking-[0.14em] text-creme/55">
              QUARTOS
            </p>
            <div className="mb-[22px] grid grid-cols-4 gap-2">
              {['1-2', '3', '4+'].map((q) => (
                <Link
                  key={q}
                  href={`${basePath}${comParametros(base, {
                    quartos: filtros.quartos === q ? undefined : q,
                  })}`}
                  onClick={() => setAberta(false)}
                  className={`rounded-lg py-[13px] text-center text-sm ${
                    filtros.quartos === q
                      ? 'bg-ouro font-semibold text-tinta'
                      : 'border border-creme/[0.26]'
                  }`}
                >
                  {q === '1-2' ? '1–2' : q}
                </Link>
              ))}
            </div>

            <p className="mb-[10px] font-mono text-[10px] tracking-[0.14em] text-creme/55">
              INVESTIMENTO ATÉ
            </p>
            <div className="mb-[22px] grid gap-[10px]">
              {FAIXAS_DE_PRECO.filter((f) => f.valor).map((f) => (
                <Link
                  key={f.valor}
                  href={`${basePath}${comParametros(base, {
                    ate: String(filtros.ate) === f.valor ? undefined : f.valor,
                  })}`}
                  onClick={() => setAberta(false)}
                  className={`rounded-lg px-4 py-[14px] text-[15px] ${
                    String(filtros.ate) === f.valor
                      ? 'bg-ouro font-semibold text-tinta'
                      : 'border border-creme/[0.18] bg-creme/[0.06]'
                  }`}
                >
                  {f.rotulo}
                </Link>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAberta(false)}
              className="min-h-[56px] w-full rounded-lg bg-ouro p-[18px] text-[15px] font-semibold text-tinta"
            >
              Ver resultados
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
