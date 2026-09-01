import Link from 'next/link';

import { CardListagem } from '@/components/empreendimentos/cards';
import { BarraFiltros } from '@/components/listagem/barra-filtros';
import { SeletorOrdem } from '@/components/listagem/seletor-ordem';
import { linkWhatsApp } from '@/config/site';
import {
  aplicarFiltros,
  comParametros,
  type Filtros,
  paramsAtuais,
  POR_PAGINA,
} from '@/lib/filtros';
import { rotas } from '@/lib/rotas';

interface Props {
  filtros: Filtros;
  basePath: string;
  titulo: string;
  /** Migalhas já formatadas; a última é destacada em ouro. */
  migalhas: { rotulo: string; href?: string }[];
  /** Restringe a busca antes dos filtros da URL (rotas /[regiao]/[categoria]). */
  fixos?: Partial<Pick<Filtros, 'regiao' | 'categoria'>>;
  /**
   * `false` nas rotas indexáveis `/[regiao]/[categoria]`: elas são
   * pré-renderizadas e não leem `searchParams` — ler tornaria a página
   * dinâmica, e o CLAUDE.md exige SSG/ISR em tudo que é indexável. Ali a
   * barra de filtros manda o visitante para `/imoveis` já com a região e a
   * categoria escolhidas.
   */
  interativo?: boolean;
}

export function Listagem({
  filtros,
  basePath,
  titulo,
  migalhas,
  fixos,
  interativo = true,
}: Props) {
  const efetivos: Filtros = { ...filtros, ...fixos };
  const todos = aplicarFiltros(efetivos);
  const visiveis = interativo ? todos.slice(0, filtros.pagina * POR_PAGINA) : todos;
  const restam = todos.length - visiveis.length;

  /* Numa página estática os controles precisam levar para onde o filtro
     realmente funciona. */
  const destinoFiltros = interativo ? basePath : rotas.imoveis;
  const filtrosDaBarra: Filtros = interativo
    ? filtros
    : { ...filtros, regiao: fixos?.regiao, categoria: fixos?.categoria };

  return (
    <>
      <div className="px-[18px] pt-[22px] pb-[14px] md:px-5 md:pt-[clamp(24px,4vw,48px)] md:pb-[clamp(16px,2vw,26px)] lg:px-14">
        <nav
          aria-label="Você está em"
          className="mb-[14px] flex flex-wrap gap-[7px] font-mono text-[10px] tracking-[0.12em] text-creme/55 md:mb-[clamp(18px,2.4vw,30px)] md:gap-2 md:text-[11px] md:tracking-[0.1em]"
        >
          {migalhas.map((m, i) => (
            <span key={m.rotulo} className="flex gap-[7px] md:gap-2">
              {m.href ? (
                <Link href={m.href}>{m.rotulo}</Link>
              ) : (
                <span className={i === migalhas.length - 1 ? 'text-ouro' : undefined}>
                  {m.rotulo}
                </span>
              )}
              {i < migalhas.length - 1 ? <span aria-hidden>/</span> : null}
            </span>
          ))}
        </nav>

        <div className="md:flex md:flex-wrap md:items-end md:justify-between md:gap-6">
          <div>
            <h1 className="mb-2 text-[34px] leading-[0.98] font-bold tracking-[-0.04em] md:mb-3 md:text-[clamp(32px,5.4vw,76px)] md:leading-[0.94] md:tracking-[-0.045em]">
              {titulo}
            </h1>
            <p className="text-sm text-creme/65 md:text-base md:text-creme/68">
              {visiveis.length} de {todos.length}{' '}
              {todos.length === 1 ? 'resultado' : 'resultados'} · atualizado hoje
            </p>
          </div>

          {/* Ordenação no topo, como no desktop do design. */}
          {interativo ? (
            <div className="mt-4 hidden md:mt-0 md:block">
              <SeletorOrdem
                filtros={efetivos}
                basePath={basePath}
                omitir={{ regiao: Boolean(fixos?.regiao), categoria: Boolean(fixos?.categoria) }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <BarraFiltros filtros={filtrosDaBarra} basePath={destinoFiltros} />

      <main className="px-[18px] pt-[18px] pb-[34px] md:px-5 md:pt-[clamp(24px,3vw,44px)] md:pb-[clamp(48px,7vw,110px)] lg:px-14">
        {visiveis.length === 0 ? (
          <EstadoVazio basePath={destinoFiltros} />
        ) : (
          <>
            <div
              className={
                filtros.vista === 'lista'
                  ? 'grid gap-4 md:gap-[clamp(18px,2.2vw,28px)]'
                  : 'grid gap-4 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:gap-[clamp(18px,2.2vw,28px)]'
              }
            >
              {visiveis.map((e) => (
                <CardListagem key={e.slug} e={e} />
              ))}
            </div>

            <div className="filete-topo mt-6 grid gap-3 pt-5 md:mt-[clamp(28px,3.4vw,48px)] md:flex md:flex-wrap md:items-center md:justify-between md:gap-4 md:pt-6">
              <p className="text-center text-[13px] text-creme/60 md:text-left md:text-sm">
                Mostrando {visiveis.length} de {todos.length}
              </p>
              {restam > 0 ? (
                <Link
                  href={`${basePath}${comParametros(paramsAtuais(efetivos), {
                    pagina: filtros.pagina + 1,
                    regiao: fixos?.regiao ? undefined : efetivos.regiao,
                    categoria: fixos?.categoria ? undefined : efetivos.categoria,
                  })}`}
                  scroll={false}
                  className="min-h-[52px] rounded-lg border border-creme/40 p-4 text-center text-sm font-medium transition-colors md:rounded md:px-8 md:py-4 md:hover:border-ouro md:hover:bg-ouro md:hover:text-tinta"
                >
                  Carregar mais
                </Link>
              ) : null}
            </div>
          </>
        )}
      </main>
    </>
  );
}

/**
 * Vazio de verdade: acontece quando os filtros não casam com nada. O texto
 * do design faz o trabalho certo aqui — parte do estoque não é publicada, e
 * a saída é falar com o corretor, não desistir.
 */
function EstadoVazio({ basePath }: { basePath: string }) {
  return (
    <div className="rounded-xl border border-dashed border-creme/30 px-5 py-10 text-center md:rounded-lg md:px-[clamp(20px,4vw,56px)] md:py-[clamp(40px,7vw,90px)]">
      <h2 className="mb-3 text-[22px] leading-[1.2] font-semibold tracking-[-0.03em] md:mb-[14px] md:text-[clamp(24px,3.2vw,40px)] md:leading-[1.1]">
        Nenhum imóvel com esses filtros
      </h2>
      <p className="mx-auto mb-[22px] max-w-[46ch] text-sm leading-[1.6] text-creme/68 md:mb-7 md:text-base">
        Parte do nosso estoque não é publicada. Diga o que procura e o corretor responde com
        opções reais de unidades.
      </p>
      <div className="grid gap-[10px] md:flex md:justify-center">
        <Link
          href={basePath}
          className="min-h-[50px] rounded-lg border border-creme/40 p-[15px] text-center text-sm font-medium md:rounded md:px-6 md:py-[15px]"
        >
          Limpar filtros
        </Link>
        <a
          href={linkWhatsApp('Olá! Procuro um imóvel que não achei no site.')}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-ouro p-4 text-center text-sm font-semibold text-tinta md:rounded md:px-[26px] md:py-4"
        >
          Falar no WhatsApp
        </a>
      </div>
      <p className="mt-6 text-[13px] text-creme/50">
        Ou{' '}
        <Link href={rotas.imoveis} className="underline">
          veja todos os imóveis
        </Link>
        .
      </p>
    </div>
  );
}
