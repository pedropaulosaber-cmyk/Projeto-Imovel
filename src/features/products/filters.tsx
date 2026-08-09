'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { Chip } from '@/components/ui/primitives';
import { Select } from '@/components/ui/form';

/**
 * Filtros da vitrine.
 *
 * ## O estado mora na URL, não no componente
 *
 * Cada filtro reescreve a query string, e o servidor relê e refiltra. O ganho
 * é o que se costuma perder num filtro de `useState`: a URL fica
 * compartilhável, o botão voltar funciona, o resultado é indexável e um
 * recarregamento não zera a seleção do usuário.
 *
 * ## `useTransition` para não travar
 *
 * A navegação dispara render no servidor. Sem `startTransition`, a interface
 * congela até a resposta chegar e o clique parece perdido. Com ele, o chip já
 * responde e a lista atualiza quando puder — com `aria-busy` avisando quem usa
 * leitor de tela de que algo está em andamento.
 */

type Category = { slug: string; name: string };

const KINDS = [
  { value: 'AI_AGENT', label: 'Agentes de IA' },
  { value: 'AUTOMATION', label: 'Automações' },
  { value: 'WORKFLOW', label: 'Workflows' },
  { value: 'TEMPLATE', label: 'Templates' },
  { value: 'PROMPT_PACK', label: 'Prompts' },
  { value: 'DATASET', label: 'Datasets' },
  { value: 'INTEGRATION', label: 'Integrações' },
] as const;

const SORTS = [
  { value: 'relevance', label: 'Mais relevantes' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'sales', label: 'Mais vendidos' },
  { value: 'rating', label: 'Melhor avaliados' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
] as const;

export function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const term = searchParams.get('q') ?? '';

  function apply(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    }

    // Qualquer mudança de filtro volta para a primeira página: manter `page=7`
    // depois de trocar a categoria costuma cair num resultado vazio, e o
    // usuário conclui que não há nada — quando há.
    params.delete('page');

    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  const activeCategory = searchParams.get('category');
  const activeKind = searchParams.get('kind');

  return (
    <div aria-busy={pending} className="flex flex-col gap-4">
      {/*
        O campo é **não controlado**, com `key` amarrada ao termo da URL.

        Espelhar a query string num `useState` sincronizado por efeito é o
        padrão que o React desaconselha: gera render em cascata e desencontro
        entre o valor digitado e o navegado. Aqui a URL é a única fonte de
        verdade — a `key` remonta o input quando ela muda (voltar, link
        compartilhado) e o valor digitado só é lido no envio.
      */}
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          apply({ q: String(data.get('q') ?? '') });
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
          <input
            key={term}
            type="search"
            name="q"
            defaultValue={term}
            placeholder="Buscar por problema, ferramenta ou resultado"
            aria-label="Buscar soluções"
            className="w-full rounded-[var(--radius-field)] border border-line bg-paper py-2.5 pl-10 pr-3.5 text-[15px] placeholder:text-faint focus:border-brand"
          />
        </div>
        <button
          type="submit"
          className="rounded-[var(--radius-btn)] bg-brand px-5 text-[15px] font-semibold text-white hover:bg-brand-strong"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Chip active={!activeCategory} onClick={() => apply({ category: null })}>
          Todas
        </Chip>
        {categories.map((category) => (
          <Chip
            key={category.slug}
            active={activeCategory === category.slug}
            onClick={() =>
              apply({ category: activeCategory === category.slug ? null : category.slug })
            }
          >
            {category.name}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2">
          {KINDS.map((kind) => (
            <Chip
              key={kind.value}
              active={activeKind === kind.value}
              onClick={() => apply({ kind: activeKind === kind.value ? null : kind.value })}
            >
              {kind.label}
            </Chip>
          ))}
        </div>

        <label className="ml-auto flex items-center gap-2 text-[13.5px] text-muted">
          <span>Ordenar por</span>
          <Select
            value={searchParams.get('sort') ?? 'relevance'}
            onChange={(event) => apply({ sort: event.target.value })}
            className="w-auto py-2 text-[13.5px]"
            aria-label="Ordenar resultados"
          >
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </Select>
        </label>
      </div>
    </div>
  );
}
