'use client';

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-svh place-items-center px-[18px] py-16 text-center">
      <div className="max-w-[46ch]">
        <p className="mb-4 font-mono text-[11px] tracking-[0.16em] text-ouro">ALGO QUEBROU</p>
        <h1 className="mb-4 text-[34px] leading-[0.98] font-bold tracking-[-0.045em] text-balance">
          Não conseguimos carregar esta página.
        </h1>
        <p className="mb-8 text-[15px] leading-[1.7] text-creme/70">
          Tente de novo. Se continuar, fale com a gente pelo WhatsApp — o atendimento não depende do
          site.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-ouro px-6 py-4 text-[15px] font-semibold text-tinta"
        >
          Tentar de novo
        </button>
      </div>
    </main>
  );
}
