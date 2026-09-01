'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { linkWhatsApp, site } from '@/config/site';
import { rotas } from '@/lib/rotas';

import { type ChaveNav, linksDesktop, linksMobile } from './navegacao';

/**
 * Cabeçalho do site.
 *
 * O design tem três formas distintas, e não uma responsiva só:
 *   • desktop na home — pílula flutuante centrada, dentro do herói;
 *   • desktop nas internas — barra sólida grudada no topo;
 *   • mobile — barra compacta com "Buscar" e hambúrguer, e menu de tela cheia.
 *
 * A pílula da home é renderizada pela própria página (fica dentro da seção do
 * herói); aqui ficam a barra sólida e todo o mobile.
 */
export function Cabecalho({
  ativo,
  semBarraDesktop = false,
}: {
  ativo?: ChaveNav;
  semBarraDesktop?: boolean;
}) {
  return (
    <>
      {semBarraDesktop ? null : <BarraDesktop ativo={ativo} />}
      <BarraMobile />
    </>
  );
}

export function BarraDesktop({ ativo }: { ativo?: ChaveNav }) {
  return (
    <header className="sticky top-0 z-[60] hidden flex-wrap items-center justify-between gap-4 bg-[rgba(14,14,12,0.94)] px-5 py-[14px] shadow-[0_1px_0_rgba(246,243,236,0.16)] backdrop-blur-[14px] md:flex lg:px-14">
      <Link href={rotas.home} className="text-[16px] font-bold tracking-[0.16em]">
        {site.nome}
      </Link>

      <nav className="flex flex-wrap items-center justify-end gap-[10px] text-sm lg:gap-[22px]">
        {linksDesktop
          .filter((l) => l.chave !== 'home')
          .map((l) => (
            <Link
              key={l.chave}
              href={l.href}
              aria-current={ativo === l.chave ? 'page' : undefined}
              className={
                ativo === l.chave
                  ? 'font-medium text-ouro'
                  : 'transition-opacity hover:opacity-75'
              }
            >
              {l.rotulo}
            </Link>
          ))}
        <Link href={rotas.login} className="opacity-70 transition-opacity hover:opacity-50">
          Corretor
        </Link>
        <a
          href={linkWhatsApp()}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-ouro px-[22px] py-[11px] font-semibold text-tinta transition-opacity hover:opacity-[0.88]"
        >
          Falar agora
        </a>
      </nav>
    </header>
  );
}

function BarraMobile() {
  const [menuAberto, setMenuAberto] = useState(false);

  /* Menu de tela cheia trava o scroll do corpo; sem isso a página corre por
     baixo do overlay no iOS. */
  useEffect(() => {
    if (!menuAberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [menuAberto]);

  useEffect(() => {
    if (!menuAberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAberto(false);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [menuAberto]);

  return (
    <>
      <header className="sticky top-0 z-[70] flex items-center justify-between gap-3 bg-[rgba(14,14,12,0.92)] px-[18px] py-[14px] shadow-[0_1px_0_rgba(246,243,236,0.14)] backdrop-blur-[14px] md:hidden">
        <Link href={rotas.home} className="text-[15px] font-bold tracking-[0.16em]">
          {site.nome}
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={rotas.imoveis}
            className="rounded-full border border-creme/[0.22] px-[14px] py-2 text-xs"
          >
            Buscar
          </Link>
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className="grid gap-1 rounded-[10px] border border-creme/[0.22] px-[10px] py-[11px]"
          >
            <span className="block h-[1.5px] w-[18px] bg-creme" />
            <span className="block h-[1.5px] w-[18px] bg-creme" />
            <span className="block h-[1.5px] w-3 bg-ouro" />
          </button>
        </div>
      </header>

      {menuAberto ? (
        <div
          className="fixed inset-0 z-[90] flex justify-center bg-[rgba(10,10,9,0.97)] backdrop-blur-[6px] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex w-full max-w-[430px] flex-col p-[18px]">
            <div className="mb-[34px] flex items-center justify-between">
              <span className="text-[15px] font-bold tracking-[0.16em]">{site.nome}</span>
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                className="rounded-[10px] border border-creme/[0.22] px-[14px] py-[10px] text-sm text-creme"
              >
                Fechar
              </button>
            </div>

            <nav className="grid">
              {linksMobile.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuAberto(false)}
                  className={`py-[18px] text-[26px] font-semibold tracking-[-0.03em] ${
                    l.discreto ? 'text-creme/60' : ''
                  } ${i < linksMobile.length - 1 ? 'shadow-[0_1px_0_rgba(246,243,236,0.12)]' : ''}`}
                >
                  {l.rotulo}
                </Link>
              ))}
            </nav>

            <div className="mt-auto pt-[26px]">
              <p className="mb-[14px] font-mono text-[10px] tracking-[0.14em] text-creme/50">
                Corretor de imóveis · {site.creci} · {site.contato.telefoneExibicao}
              </p>
              <a
                href={linkWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-ouro p-[17px] text-center text-[15px] font-semibold text-tinta"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * A pílula de navegação do herói da home, só no desktop. Fica dentro da seção
 * do herói porque no design ela flutua sobre a foto, com `sticky top: 16px`.
 */
export function PilulaHome() {
  return (
    <div className="sticky top-4 z-20 mt-4 hidden max-w-[calc(100%-32px)] flex-wrap items-center justify-center gap-[6px] self-center rounded-full border border-creme/[0.22] bg-creme/[0.13] py-[10px] pr-3 pl-5 backdrop-blur-[16px] md:flex">
      <Link href={rotas.home} className="mr-[10px] text-[16px] font-bold tracking-[0.16em]">
        {site.nome}
      </Link>
      <Link
        href={rotas.home}
        aria-current="page"
        className="rounded-full bg-[rgba(255,255,255,0.94)] px-[18px] py-[9px] text-sm font-medium text-tinta"
      >
        Home
      </Link>
      {linksDesktop
        .filter((l) => l.chave !== 'home')
        .map((l) => (
          <Link
            key={l.chave}
            href={l.href}
            className="px-[14px] py-[9px] text-sm transition-opacity hover:opacity-75"
          >
            {l.rotulo}
          </Link>
        ))}
      <a href="#contato" className="px-[14px] py-[9px] text-sm transition-opacity hover:opacity-75">
        Contato
      </a>
      <Link
        href={rotas.login}
        className="px-[14px] py-[9px] text-sm opacity-75 transition-opacity hover:opacity-50"
      >
        Corretor
      </Link>
      <a
        href="#contato"
        className="ml-[6px] rounded-full bg-ouro px-[22px] py-[11px] text-sm font-semibold text-tinta transition-opacity hover:opacity-[0.88]"
      >
        Falar agora
      </a>
    </div>
  );
}
