'use client';

import { useRouter } from 'next/navigation';

import { comParametros, type Filtros, ORDENS, paramsAtuais } from '@/lib/filtros';

/**
 * "Ordenar: mais recentes" no topo da listagem, como no desktop do design.
 * Navega na troca; o mesmo critério também está na barra de filtros, que é
 * onde a mão vai quando já se está rolando os resultados.
 */
export function SeletorOrdem({
  filtros,
  basePath,
  omitir,
}: {
  filtros: Filtros;
  basePath: string;
  /** Não repetir na query o que já está fixo no caminho da rota. */
  omitir?: { regiao?: boolean; categoria?: boolean };
}) {
  const router = useRouter();

  return (
    <>
      <label className="sr-only" htmlFor="ordenar-listagem">
        Ordenar resultados
      </label>
      <select
        id="ordenar-listagem"
        value={filtros.ordem}
        onChange={(e) =>
          router.push(
            `${basePath}${comParametros(paramsAtuais(filtros), {
              ordem: e.target.value === 'recentes' ? undefined : e.target.value,
              regiao: omitir?.regiao ? undefined : filtros.regiao,
              categoria: omitir?.categoria ? undefined : filtros.categoria,
            })}`,
          )
        }
        className="rounded border border-creme/[0.2] bg-creme/[0.06] px-4 py-[13px] text-sm text-creme outline-none focus:border-ouro"
      >
        {ORDENS.map((o) => (
          <option key={o.valor} value={o.valor} className="text-tinta">
            Ordenar: {o.rotulo.toLowerCase()}
          </option>
        ))}
      </select>
    </>
  );
}
