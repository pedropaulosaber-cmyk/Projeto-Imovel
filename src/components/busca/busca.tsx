'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { categorias, regioes } from '@/content/regioes';
import { rotas } from '@/lib/rotas';
import { Portal } from '@/components/ui/portal';

export const FAIXAS_DE_PRECO = [
  { valor: '', rotulo: 'Sem limite' },
  { valor: '800000', rotulo: 'R$ 800 mil' },
  { valor: '1200000', rotulo: 'R$ 1,2 mi' },
  { valor: '2000000', rotulo: 'R$ 2 mi' },
];

export const FAIXAS_DE_QUARTOS = [
  { valor: '', rotulo: 'Qualquer' },
  { valor: '1-2', rotulo: '1 a 2' },
  { valor: '3', rotulo: '3' },
  { valor: '4+', rotulo: '4 ou mais' },
];

function paraListagem(dados: FormData): string {
  const params = new URLSearchParams();
  for (const chave of ['regiao', 'categoria', 'quartos', 'ate'] as const) {
    const valor = dados.get(chave);
    if (typeof valor === 'string' && valor) params.set(chave, valor);
  }
  const query = params.toString();
  return query ? `${rotas.imoveis}?${query}` : rotas.imoveis;
}

const estiloCampoEscuro =
  'min-h-[52px] w-full rounded-lg border border-creme/[0.18] bg-creme/[0.06] px-4 py-[14px] text-[15px] text-creme outline-none focus:border-ouro';

/**
 * Caixa de busca do herói, no desktop: uma pílula translúcida com desfoque, no
 * mesmo desenho da barra de navegação flutuante — três seletores lado a lado,
 * separados por um fio fino, e o botão dourado arredondado à direita.
 */
export function BuscaHeroDesktop() {
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(paraListagem(new FormData(e.currentTarget)));
      }}
      className="hidden w-fit max-w-full items-center rounded-full border border-creme/[0.22] bg-creme/[0.13] py-[10px] pr-[10px] pl-2 backdrop-blur-[16px] md:flex"
    >
      <SeletorHero nome="regiao" rotulo="REGIÃO" primeiro>
        <option value="">Todas</option>
        {regioes.map((r) => (
          <option key={r.slug} value={r.slug} className="text-tinta">
            {r.nome}
          </option>
        ))}
      </SeletorHero>

      <SeletorHero nome="quartos" rotulo="QUARTOS">
        {FAIXAS_DE_QUARTOS.map((f) => (
          <option key={f.rotulo} value={f.valor} className="text-tinta">
            {f.rotulo}
          </option>
        ))}
      </SeletorHero>

      <SeletorHero nome="ate" rotulo="ATÉ">
        {FAIXAS_DE_PRECO.map((f) => (
          <option key={f.rotulo} value={f.valor} className="text-tinta">
            {f.rotulo}
          </option>
        ))}
      </SeletorHero>

      <button
        type="submit"
        className="ml-[10px] shrink-0 rounded-full bg-ouro px-[22px] py-[11px] text-sm font-semibold text-tinta transition-opacity hover:opacity-[0.88]"
      >
        Buscar imóveis
      </button>
    </form>
  );
}

function SeletorHero({
  nome,
  rotulo,
  children,
  primeiro = false,
}: {
  nome: string;
  rotulo: string;
  children: React.ReactNode;
  primeiro?: boolean;
}) {
  return (
    <label className={`flex flex-col px-[16px] ${primeiro ? '' : 'border-l border-creme/[0.18]'}`}>
      <span className="mb-[2px] font-mono text-[9px] tracking-[0.14em] text-creme/60">{rotulo}</span>
      <select
        name={nome}
        aria-label={rotulo}
        className="cursor-pointer border-0 bg-transparent text-sm font-medium text-creme outline-none"
      >
        {children}
      </select>
    </label>
  );
}

/**
 * No mobile o herói tem um botão largo que abre uma folha vinda de baixo com
 * os mesmos três seletores — o padrão que o design usa para toda escolha
 * múltipla no celular.
 */
export function BuscaHeroMobile() {
  const router = useRouter();
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

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-full border border-creme/[0.22] bg-creme/[0.13] px-[18px] py-4 text-sm text-creme backdrop-blur-[16px] md:hidden"
      >
        <span className="text-creme/70">Região, categoria, valor…</span>
        <span className="rounded-full bg-ouro px-[14px] py-[7px] text-xs font-semibold text-tinta">
          Buscar
        </span>
      </button>

      {aberta ? (
        <Portal>
          <div
            className="fixed inset-0 z-[95] flex items-end justify-center bg-[rgba(10,10,9,0.7)] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Buscar imóveis"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAberta(false);
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAberta(false);
                router.push(paraListagem(new FormData(e.currentTarget)));
              }}
              className="w-full max-w-[430px] rounded-t-[18px] bg-carvao px-[18px] pt-5 pb-[26px] shadow-[0_-12px_40px_rgba(0,0,0,0.6)]"
            >
              <div className="mx-auto mb-5 h-1 w-[42px] rounded-full bg-creme/25" aria-hidden />
              <h2 className="mb-[18px] text-[22px] font-semibold tracking-[-0.03em]">
                Buscar imóveis
              </h2>

              <div className="grid gap-[10px]">
                <CampoSheet nome="regiao" rotulo="REGIÃO">
                  <option value="">Todas</option>
                  {regioes.map((r) => (
                    <option key={r.slug} value={r.slug} className="text-tinta">
                      {r.nome}
                    </option>
                  ))}
                </CampoSheet>

                <CampoSheet nome="categoria" rotulo="CATEGORIA">
                  <option value="">Todas</option>
                  {categorias.map((c) => (
                    <option key={c.slug} value={c.slug} className="text-tinta">
                      {c.singular}
                    </option>
                  ))}
                </CampoSheet>

                <CampoSheet nome="ate" rotulo="INVESTIMENTO ATÉ">
                  {FAIXAS_DE_PRECO.map((f) => (
                    <option key={f.rotulo} value={f.valor} className="text-tinta">
                      {f.rotulo}
                    </option>
                  ))}
                </CampoSheet>

                <button
                  type="submit"
                  className="min-h-[56px] rounded-lg bg-ouro p-[18px] text-[15px] font-semibold text-tinta"
                >
                  Ver resultados
                </button>
                <button
                  type="button"
                  onClick={() => setAberta(false)}
                  className="p-[6px] text-sm text-creme/60"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </Portal>
      ) : null}
    </>
  );
}

function CampoSheet({
  nome,
  rotulo,
  children,
}: {
  nome: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-[6px] block font-mono text-[10px] tracking-[0.14em] text-creme/55">
        {rotulo}
      </span>
      <select name={nome} aria-label={rotulo} className={estiloCampoEscuro}>
        {children}
      </select>
    </label>
  );
}
