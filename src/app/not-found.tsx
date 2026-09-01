import Link from 'next/link';

import { rotas } from '@/lib/rotas';

export default function NaoEncontrado() {
  return (
    <main className="grid min-h-svh place-items-center px-[18px] py-16 text-center">
      <div className="max-w-[46ch]">
        <p className="mb-4 font-mono text-[11px] tracking-[0.16em] text-ouro">ERRO 404</p>
        <h1 className="mb-4 text-[38px] leading-[0.96] font-bold tracking-[-0.045em] text-balance md:text-[clamp(38px,5vw,64px)]">
          Esta página não existe.
        </h1>
        <p className="mb-8 text-[15px] leading-[1.7] text-creme/70 md:text-[17px]">
          Pode ser um imóvel que saiu do catálogo ou um link antigo. O estoque atual está todo na
          listagem.
        </p>
        <div className="grid gap-3 sm:flex sm:justify-center">
          <Link
            href={rotas.imoveis}
            className="rounded-lg bg-ouro px-6 py-4 text-[15px] font-semibold text-tinta"
          >
            Ver imóveis
          </Link>
          <Link
            href={rotas.home}
            className="rounded-lg border border-creme/40 px-6 py-4 text-[15px] font-medium"
          >
            Voltar para a home
          </Link>
        </div>
      </div>
    </main>
  );
}
