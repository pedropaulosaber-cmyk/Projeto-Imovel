'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Foto } from '@/components/ui/primitivas';
import type { Midia } from '@/content/tipos';

/**
 * Galeria do herói: a foto grande troca, a tira de miniaturas navega.
 *
 * A tira já existia, mas era decorativa — as miniaturas eram `<div>` sem
 * comportamento, e o visitante não tinha como ver a segunda foto. Agora cada
 * miniatura é botão, e a foto grande responde a seta do teclado e a arrasto
 * no celular.
 *
 * O bloco de título continua vindo do servidor por `children`: é ele que
 * carrega o `<h1>` e as migalhas, e nada disso deveria depender de JavaScript
 * para ser indexado.
 */

/* Arrasto menor que isso é toque, não gesto de navegação. */
const ARRASTO_MINIMO = 44;

/* Depois de trocar de foto, o texto e o escurecido voltam após esta pausa. */
const TEMPO_VISIVEL_APOS_NAVEGAR = 1500;

export function Galeria({
  midias,
  nome,
  children,
  acoes,
}: {
  midias: Midia[];
  nome: string;
  children: React.ReactNode;
  acoes?: React.ReactNode;
}) {
  const [i, setI] = useState(0);
  const [textoOculto, setTextoOculto] = useState(false);
  const tira = useRef<HTMLDivElement>(null);
  const toqueX = useRef<number | null>(null);
  const timerTexto = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jaMontou = useRef(false);

  const total = midias.length;
  const ir = useCallback(
    (proximo: number) => {
      if (total === 0) return;
      setI((proximo + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (total < 2) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') ir(i + 1);
      if (e.key === 'ArrowLeft') ir(i - 1);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [i, ir, total]);

  /* Mantém a miniatura ativa à vista quando a navegação vem da foto grande. */
  useEffect(() => {
    tira.current?.querySelector<HTMLElement>('[data-ativa="true"]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [i]);

  /*
   * Ao trocar de foto, some com o texto sobreposto e com o escurecido por um
   * instante, para o visitante ver a imagem inteira; ambos voltam sozinhos
   * quando ele para de navegar. Não roda na primeira renderização — o título
   * precisa aparecer de cara e continuar indexável.
   */
  useEffect(() => {
    if (!jaMontou.current) {
      jaMontou.current = true;
      return;
    }
    setTextoOculto(true);
    if (timerTexto.current) clearTimeout(timerTexto.current);
    timerTexto.current = setTimeout(() => setTextoOculto(false), TEMPO_VISIVEL_APOS_NAVEGAR);
    return () => {
      if (timerTexto.current) clearTimeout(timerTexto.current);
    };
  }, [i]);

  const atual = midias[i];

  return (
    <>
      <section
        className="relative flex h-[54svh] items-end md:h-[clamp(340px,72svh,780px)]"
        onTouchStart={(e) => {
          toqueX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const inicio = toqueX.current;
          const fim = e.changedTouches[0]?.clientX;
          toqueX.current = null;
          if (inicio == null || fim == null) return;
          const d = fim - inicio;
          if (Math.abs(d) < ARRASTO_MINIMO) return;
          ir(d < 0 ? i + 1 : i - 1);
        }}
      >
        <Foto
          url={atual?.url ?? null}
          alt={atual?.alt ?? `${nome} — ${atual?.legenda ?? 'foto'}`}
          legenda={`[ foto — ${nome} ]`}
          sizes="100vw"
          prioridade={i === 0}
        />
        <div
          aria-hidden
          className={`absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,12,0.35)_0%,rgba(14,14,12,0)_40%,rgba(14,14,12,0.95)_100%)] transition-opacity duration-500 md:bg-[linear-gradient(180deg,rgba(14,14,12,0.4)_0%,rgba(14,14,12,0)_42%,rgba(14,14,12,0.9)_100%)] ${
            textoOculto ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => ir(i - 1)}
              aria-label="Foto anterior"
              className="absolute top-1/2 left-[10px] z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-creme/25 bg-[rgba(10,10,9,0.55)] text-[19px] leading-none text-creme backdrop-blur-[6px] transition-colors hover:bg-[rgba(10,10,9,0.8)] md:left-5 lg:left-14"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => ir(i + 1)}
              aria-label="Próxima foto"
              className="absolute top-1/2 right-[10px] z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-creme/25 bg-[rgba(10,10,9,0.55)] text-[19px] leading-none text-creme backdrop-blur-[6px] transition-colors hover:bg-[rgba(10,10,9,0.8)] md:right-5 lg:right-14"
            >
              ›
            </button>
          </>
        ) : null}

        <div
          className={`relative w-full px-[18px] pb-[22px] transition-opacity duration-500 md:px-5 md:pb-[clamp(26px,3.4vw,46px)] lg:px-14 ${
            textoOculto ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          {children}
        </div>

        <div className="absolute top-[14px] right-[18px] flex items-center gap-2 md:top-[18px] md:right-5 lg:right-14">
          {acoes}
          {total > 1 ? (
            <span className="rounded-full border border-white/30 bg-[rgba(20,19,15,0.65)] px-[13px] py-[9px] font-mono text-[11px] text-creme/90 md:px-[15px] md:py-[10px]">
              {i + 1}/{total}
            </span>
          ) : null}
        </div>

        {atual?.legenda ? (
          <span className="pointer-events-none absolute bottom-[10px] right-[18px] hidden rounded-full bg-[rgba(10,10,9,0.6)] px-3 py-[6px] font-mono text-[10px] tracking-[0.08em] text-creme/75 md:block md:right-5 lg:right-14">
            {atual.legenda.toUpperCase()}
          </span>
        ) : null}
      </section>

      <div
        ref={tira}
        className="filete-topo flex gap-2 overflow-x-auto px-[18px] py-[10px] md:px-5 lg:px-14"
      >
        {midias.map((m, n) => (
          <button
            key={`${m.url ?? 'sem-foto'}-${n}`}
            type="button"
            data-ativa={n === i}
            aria-label={`Ver ${m.legenda}`}
            aria-current={n === i}
            onClick={() => setI(n)}
            className={`relative h-[72px] w-[110px] shrink-0 cursor-pointer overflow-hidden rounded-md transition-opacity md:h-[84px] md:w-[132px] md:rounded ${
              n === i ? 'border-2 border-ouro' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Foto url={m.url} alt="" legenda={m.legenda} sizes="132px" className="rounded-none" />
          </button>
        ))}
      </div>

      {/*
        As imagens vêm do book da incorporadora e são perspectivas de projeto,
        não fotos de obra pronta. Dizer isso na própria galeria é o que separa
        publicidade de propaganda enganosa (CDC, art. 37) — e é a primeira coisa
        que um comprador experiente procura.
      */}
      <p className="filete-topo px-[18px] py-[10px] font-mono text-[10px] tracking-[0.08em] text-creme/45 md:px-5 md:text-[11px] lg:px-14">
        [ PERSPECTIVAS ILUSTRADAS DO MATERIAL DA INCORPORADORA · MOBILIÁRIO E DECORAÇÃO NÃO INTEGRAM
        O CONTRATO ]
      </p>
    </>
  );
}
