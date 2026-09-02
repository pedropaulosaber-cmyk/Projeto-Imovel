'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

import { Portal } from '@/components/ui/portal';
import type { Midia, Planta } from '@/content/tipos';

/**
 * Seção de plantas: a lista de metragens do book e as plantas humanizadas.
 *
 * A imagem entra com `object-contain` sobre fundo claro, e não `cover`: planta
 * cortada não serve para nada, e o desenho foi feito sobre papel branco. Ao
 * clicar, abre em tela cheia com zoom — é onde o cliente vai de fato ler as
 * medidas dos cômodos.
 *
 * Clicar na metragem abre a planta daquela tipologia. O pareamento veio da
 * metragem impressa no próprio desenho ("FINAL 1 — 171M² — 3 SUÍTES"), lida
 * página a página; onde o book não publica o desenho — costuma faltar
 * penthouse e garden — `planta.imagem` é `null` e o card não vira botão, em vez
 * de abrir a planta do vizinho.
 */

export function Plantas({ plantas, imagens }: { plantas: Planta[]; imagens: Midia[] }) {
  const [aberta, setAberta] = useState<number | null>(null);

  const total = imagens.length;
  const ir = useCallback(
    (proximo: number) => setAberta((a) => (a === null ? a : (proximo + total) % total)),
    [total],
  );

  useEffect(() => {
    if (aberta === null) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberta(null);
      if (e.key === 'ArrowRight') ir(aberta + 1);
      if (e.key === 'ArrowLeft') ir(aberta - 1);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [aberta, ir]);

  const emFoco = aberta === null ? null : imagens[aberta];
  const indiceDe = (url: string | null) =>
    url === null ? -1 : imagens.findIndex((m) => m.url === url);

  const cartao =
    'w-[160px] shrink-0 rounded-[10px] border p-[14px] text-left md:w-auto md:shrink md:rounded-lg md:px-4 md:py-[14px]';

  return (
    <section className="mb-7 md:mb-[clamp(30px,4vw,60px)]">
      <h2 className="mb-[14px] text-2xl font-semibold tracking-[-0.03em] md:mb-5 md:text-[clamp(22px,2.8vw,36px)] md:leading-[1.08]">
        Plantas
      </h2>

      {plantas.length ? (
        <div className="-mx-[18px] mb-4 flex gap-3 overflow-x-auto px-[18px] pb-[6px] md:mx-0 md:mb-5 md:grid md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:gap-3 md:overflow-visible md:px-0 md:pb-0">
          {plantas.map((p, n) => {
            const alvo = indiceDe(p.imagem);
            const chave = `${p.area}-${p.tipo}-${n}`;
            const miolo = (
              <>
                <p className="mb-[5px] text-[18px] font-semibold tracking-[-0.025em] md:text-[19px]">
                  {p.area}
                </p>
                <p className="text-xs text-creme/60 md:text-[13px]">
                  {p.tipo} · {p.vagas}
                </p>
              </>
            );

            if (alvo < 0) {
              return (
                <div key={chave} className={`${cartao} border-creme/[0.16]`}>
                  {miolo}
                  <p className="mt-2 font-mono text-[9px] tracking-[0.08em] text-creme/35 md:text-[10px]">
                    SEM PLANTA NO BOOK
                  </p>
                </div>
              );
            }

            return (
              <button
                key={chave}
                type="button"
                onClick={() => setAberta(alvo)}
                aria-label={`Ver a planta de ${p.area} — ${p.tipo}`}
                className={`${cartao} cursor-pointer border-creme/[0.16] transition-colors hover:border-ouro`}
              >
                {miolo}
                <p className="mt-2 font-mono text-[9px] tracking-[0.08em] text-ouro md:text-[10px]">
                  VER PLANTA →
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      {total ? (
        <>
          <div className="-mx-[18px] flex gap-3 overflow-x-auto px-[18px] pb-[6px] md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] md:gap-4 md:overflow-visible md:px-0 md:pb-0">
            {imagens.map((m, n) => (
              <button
                key={m.url ?? n}
                type="button"
                onClick={() => setAberta(n)}
                aria-label={`Ampliar ${m.legenda}`}
                className="w-[230px] shrink-0 cursor-pointer overflow-hidden rounded-[10px] border border-creme/[0.16] bg-creme transition-colors hover:border-ouro md:w-auto md:shrink md:rounded-lg"
              >
                {m.url ? (
                  <Image
                    src={m.url}
                    alt={m.alt ?? m.legenda}
                    width={460}
                    height={259}
                    sizes="(max-width: 768px) 230px, 300px"
                    quality={92}
                    className="h-auto w-full object-contain"
                  />
                ) : null}
              </button>
            ))}
          </div>
          <p className="mt-[10px] font-mono text-[10px] text-creme/45 md:text-[11px]">
            [ TOQUE PARA AMPLIAR · METRAGENS E TIPOLOGIAS IMPRESSAS NA PRÓPRIA PLANTA ]
          </p>
        </>
      ) : null}

      {emFoco?.url ? (
        <Portal>
          <div
            className="fixed inset-0 z-[95] flex flex-col bg-preto p-3 md:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={emFoco.legenda}
            onClick={(e) => {
              if (e.target === e.currentTarget) setAberta(null);
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] tracking-[0.1em] text-creme/70">
                {emFoco.legenda.toUpperCase()} · {(aberta ?? 0) + 1}/{total}
              </span>
              <button
                type="button"
                onClick={() => setAberta(null)}
                aria-label="Fechar"
                className="grid h-10 w-10 place-items-center rounded-full border border-creme/25 text-lg text-creme"
              >
                ×
              </button>
            </div>

            {/*
              A planta precisa de largura para ser legível: num celular de
              390 px o desenho vira um borrão. Por isso a imagem nasce com no
              mínimo 760 px e o contêiner rola na horizontal — o zoom natural
              de quem está lendo medida de quarto.
            */}
            <div className="flex min-h-0 flex-1 flex-col overflow-auto">
              <div className="m-auto w-fit shrink-0 overflow-hidden rounded-lg bg-creme">
                <Image
                  src={emFoco.url}
                  alt={emFoco.alt ?? emFoco.legenda}
                  width={1500}
                  height={845}
                  sizes="100vw"
                  quality={92}
                  className="h-auto w-[min(1500px,max(760px,100vw))] max-w-none"
                />
              </div>
            </div>

            {total > 1 ? (
              <div className="mt-3 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => ir((aberta ?? 0) - 1)}
                  className="rounded-full border border-creme/25 px-5 py-[10px] text-sm text-creme"
                >
                  ‹ Anterior
                </button>
                <button
                  type="button"
                  onClick={() => ir((aberta ?? 0) + 1)}
                  className="rounded-full border border-creme/25 px-5 py-[10px] text-sm text-creme"
                >
                  Próxima ›
                </button>
              </div>
            ) : null}
          </div>
        </Portal>
      ) : null}
    </section>
  );
}
