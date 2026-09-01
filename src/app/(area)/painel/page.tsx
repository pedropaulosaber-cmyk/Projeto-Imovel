import type { Metadata } from 'next';
import Link from 'next/link';

import { site } from '@/config/site';
import { painel } from '@/content/escritorio';
import { rotas } from '@/lib/rotas';

export const metadata: Metadata = {
  title: 'Painel do corretor',
  robots: { index: false, follow: false },
};

/**
 * Painel de leads.
 *
 * Prévia: os números vêm de `content/escritorio.ts`, não do Método CRM. A rota
 * fica aberta de propósito enquanto não há autenticação — e diz isso na tela,
 * para ninguém confundir dado de exemplo com dado real.
 */
export default function PaginaPainel() {
  return (
    <div className="pb-10">
      {/* Barra do painel — só no desktop; no mobile o cabeçalho do site já está. */}
      <header className="hidden flex-wrap items-center justify-between gap-[18px] px-5 py-[14px] shadow-[0_1px_0_rgba(246,243,236,0.16)] md:flex lg:px-14">
        <Link href={rotas.home} className="text-[16px] font-bold tracking-[0.16em]">
          {site.nome}
        </Link>
        <nav className="flex gap-[clamp(12px,2vw,24px)] text-sm">
          <span className="font-medium text-ouro">Leads</span>
          <Link href={rotas.imoveis}>Imóveis</Link>
          <span className="opacity-50">Relatórios</span>
        </nav>
        <div className="flex items-center gap-[10px]">
          <span className="text-sm text-creme/75">Rodrigo Alves</span>
          <Link
            href={rotas.login}
            className="rounded-full border border-creme/[0.28] px-4 py-[9px] text-xs"
          >
            Sair
          </Link>
        </div>
      </header>

      <div className="px-[18px] pt-5 md:px-5 md:pt-[clamp(22px,3vw,44px)] lg:px-14">
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-0">
          <div>
            <h1 className="mb-[6px] text-[30px] leading-none font-bold tracking-[-0.04em] md:mb-2 md:text-[clamp(28px,3.8vw,48px)]">
              Leads recebidos
            </h1>
            <p className="text-[13px] text-creme/55 md:mb-[clamp(20px,3vw,36px)] md:text-sm">
              <span className="md:hidden">Rodrigo Alves · há 4 minutos</span>
              <span className="hidden md:inline">Últimos 30 dias · atualizado há 4 minutos</span>
            </p>
          </div>
          <Link
            href={rotas.login}
            className="rounded-full border border-creme/[0.28] px-[15px] py-[9px] text-xs md:hidden"
          >
            Sair
          </Link>
        </div>

        <p className="mb-5 rounded-lg border border-ouro/40 bg-ouro/10 p-3 text-xs leading-[1.6] text-creme/85 md:mb-6 md:text-[13px]">
          Prévia do painel: os números abaixo são de exemplo. Os leads reais aparecem aqui quando a
          integração com o Método CRM e a autenticação forem ligadas.
        </p>
      </div>

      {/* KPIs -------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:mx-5 md:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] lg:mx-14">
        {painel.kpis.map((k) => (
          <div key={k.label} className="celula p-[18px] md:px-5 md:py-[22px]">
            <p className="mb-2 font-mono text-[9px] tracking-[0.14em] text-creme/55 md:mb-[10px] md:text-[10px]">
              {k.label}
            </p>
            <p className="text-[30px] leading-none font-semibold tracking-[-0.035em] md:text-[34px]">
              {k.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="px-[18px] pt-6 md:flex md:flex-wrap md:items-start md:gap-[clamp(18px,2.4vw,32px)] md:px-5 md:pt-[clamp(20px,3vw,34px)] lg:px-14">
        {/* Fila de atendimento --------------------------------------------- */}
        <section className="min-w-0 md:flex-[999_1_470px]">
          <p className="mb-[14px] font-mono text-[10px] tracking-[0.14em] md:hidden">
            FILA DE ATENDIMENTO
          </p>
          <div className="overflow-hidden rounded-xl border border-creme/[0.16] md:rounded-lg">
            <div className="hidden items-center justify-between gap-[14px] px-5 py-[17px] shadow-[0_1px_0_rgba(246,243,236,0.16)] md:flex">
              <p className="font-mono text-[11px] tracking-[0.14em]">FILA DE ATENDIMENTO</p>
              <span className="text-[13px] text-creme/55">{painel.leads.length} leads</span>
            </div>
            {painel.leads.map((l) => (
              <div
                key={l.nome}
                className="flex items-center justify-between gap-3 px-4 py-[15px] shadow-[0_1px_0_rgba(246,243,236,0.1)] md:gap-[14px] md:px-5"
              >
                <div className="min-w-0">
                  <p className="mb-1 text-[15px] font-medium">{l.nome}</p>
                  <p className="text-xs text-creme/55 md:text-[13px]">
                    {l.imovel}
                    <span className="hidden md:inline"> · {l.tipologia}</span> · {l.quando}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-creme/30 px-3 py-[6px] text-[11px] whitespace-nowrap md:px-[13px] md:text-xs">
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Leads por semana -------------------------------------------------- */}
        <section className="mt-6 rounded-xl border border-creme/[0.16] p-[18px] md:mt-0 md:flex-[1_1_290px] md:rounded-lg md:p-5">
          <p className="font-mono text-[10px] tracking-[0.14em] md:mb-1 md:text-[11px]">
            LEADS POR SEMANA
          </p>
          <p className="mb-5 text-xs text-creme/55 md:mb-6 md:text-[13px]">Agosto 2026</p>

          <div className="flex h-[140px] items-end gap-[6px] md:h-[170px] md:gap-2">
            {painel.grafico.map((g) => (
              <div
                key={g.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2 md:gap-[9px]"
              >
                <div
                  className="w-full rounded-t-[2px] bg-ouro"
                  style={{ height: `${g.altura}%` }}
                  role="img"
                  aria-label={`${g.label}: ${g.altura}% do pico`}
                />
                <span className="text-[10px] text-creme/50 md:text-[11px]">{g.label}</span>
              </div>
            ))}
          </div>

          <dl className="filete-topo mt-5 grid gap-[10px] pt-4 text-[13px] md:mt-[22px] md:gap-[11px] md:pt-[18px] md:text-sm">
            {painel.resumo.map((r) => (
              <div key={r.rotulo} className="flex justify-between">
                <dt className="text-creme/55">{r.rotulo}</dt>
                <dd className="m-0">{r.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
