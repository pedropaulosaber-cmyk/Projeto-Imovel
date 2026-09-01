import Link from 'next/link';

import { site } from '@/config/site';

import { linksRodape } from './navegacao';

export function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="px-[18px] py-[26px] shadow-[0_-1px_0_rgba(246,243,236,0.16)] sm:px-5 sm:py-8 lg:px-14 lg:py-16">
      <div className="flex flex-wrap justify-between gap-8 pb-5 sm:pb-7">
        {/* Bloco de endereço: só desktop no design mobile, que abre direto nos links. */}
        <div className="hidden md:block">
          <p className="mb-3 text-[17px] font-bold tracking-[0.16em]">{site.nome}</p>
          <p className="text-sm leading-relaxed text-creme/60">
            {site.contato.endereco}
            <br />
            {site.contato.cidade} — {site.contato.estado} · {site.contato.telefoneExibicao}
          </p>
        </div>

        <nav className="grid w-full content-start gap-3 text-sm md:w-auto md:gap-[10px]">
          {linksRodape.map((l) => (
            <Link key={l.href} href={l.href} className="transition-opacity hover:opacity-75">
              {l.rotulo}
            </Link>
          ))}
        </nav>
      </div>

      {/*
        Resolução COFECI 1.065/2007: o CRECI acompanha toda divulgação de
        imóvel, e por isso vive no rodapé de todas as páginas do site.
      */}
      <p className="pt-5 font-mono text-[10px] leading-[1.7] text-creme/45 sm:text-[11px] md:shadow-[0_-1px_0_rgba(246,243,236,0.14)]">
        Corretor de imóveis · {site.creci}
        {site.conteudoDemonstracao
          ? ' · SITE EM CONFIGURAÇÃO — MARCA E CONTATOS PROVISÓRIOS'
          : ''}{' '}
        · © {ano}
      </p>
    </footer>
  );
}
