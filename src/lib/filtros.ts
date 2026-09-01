import { empreendimentosPublicados } from '@/content/empreendimentos';
import { categoriaPorSlug, nomeDaRegiao } from '@/content/regioes';
import type { Empreendimento } from '@/content/tipos';

export const ORDENS = [
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'menor-preco', rotulo: 'Menor preço' },
  { valor: 'maior-preco', rotulo: 'Maior preço' },
  { valor: 'maior-metragem', rotulo: 'Maior metragem' },
] as const;

export type Ordem = (typeof ORDENS)[number]['valor'];

export interface Filtros {
  busca?: string;
  categoria?: string;
  regiao?: string;
  quartos?: string;
  ate?: number;
  ordem: Ordem;
  vista: 'grade' | 'lista';
  pagina: number;
}

/** Quantos cards por página — "Carregar mais" avança de 4 em 4. */
export const POR_PAGINA = 4;

type ParamsBrutos = Record<string, string | string[] | undefined>;

function texto(v: string | string[] | undefined): string | undefined {
  const bruto = Array.isArray(v) ? v[0] : v;
  const limpo = bruto?.trim();
  return limpo ? limpo.slice(0, 120) : undefined;
}

export function lerFiltros(params: ParamsBrutos): Filtros {
  const ordemBruta = texto(params.ordem);
  const ordem = ORDENS.some((o) => o.valor === ordemBruta) ? (ordemBruta as Ordem) : 'recentes';

  const ate = Number(texto(params.ate));
  const pagina = Number(texto(params.pagina));

  return {
    busca: texto(params.busca),
    categoria: texto(params.categoria),
    regiao: texto(params.regiao),
    quartos: texto(params.quartos),
    ate: Number.isFinite(ate) && ate > 0 ? ate : undefined,
    ordem,
    vista: texto(params.vista) === 'lista' ? 'lista' : 'grade',
    pagina: Number.isInteger(pagina) && pagina > 0 ? Math.min(pagina, 50) : 1,
  };
}

/** Um filtro além de `vista` já torna a página uma variação — não indexável. */
export function temFiltroAtivo(f: Filtros): boolean {
  return Boolean(
    f.busca || f.categoria || f.regiao || f.quartos || f.ate || f.ordem !== 'recentes' || f.pagina > 1,
  );
}

/** "3 quartos" a partir de "2–3 quartos" e "4 suítes": lê o maior número do rótulo. */
function maxQuartos(e: Empreendimento): number {
  const numeros = e.quartos.match(/\d+/g);
  if (!numeros) return 0;
  return Math.max(...numeros.map(Number));
}

function casaComQuartos(e: Empreendimento, faixa: string): boolean {
  const q = maxQuartos(e);
  if (faixa === '1-2') return q > 0 && q <= 2;
  if (faixa === '3') return q === 3;
  if (faixa === '4+') return q >= 4;
  return true;
}

function normalizar(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function aplicarFiltros(f: Filtros): Empreendimento[] {
  let lista = empreendimentosPublicados();

  if (f.regiao) lista = lista.filter((e) => e.regiaoSlug === f.regiao);

  if (f.categoria) {
    const cat = categoriaPorSlug(f.categoria);
    if (cat) lista = lista.filter((e) => e.categoria === cat.valor);
    else lista = [];
  }

  if (f.quartos) lista = lista.filter((e) => casaComQuartos(e, f.quartos!));
  if (f.ate) lista = lista.filter((e) => e.precoAPartirDe <= f.ate!);

  if (f.busca) {
    const alvo = normalizar(f.busca);
    lista = lista.filter((e) =>
      normalizar(`${e.nome} ${nomeDaRegiao(e.regiaoSlug)} ${e.incorporadora}`).includes(alvo),
    );
  }

  const ordenada = [...lista];
  switch (f.ordem) {
    case 'menor-preco':
      ordenada.sort((a, b) => a.precoAPartirDe - b.precoAPartirDe);
      break;
    case 'maior-preco':
      ordenada.sort((a, b) => b.precoAPartirDe - a.precoAPartirDe);
      break;
    case 'maior-metragem':
      ordenada.sort((a, b) => b.metragemMax - a.metragemMax);
      break;
    default:
      break;
  }

  return ordenada;
}

/** Monta uma query preservando o que já está aplicado. */
export function comParametros(
  base: Record<string, string | number | undefined>,
  mudancas: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...mudancas })) {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Os filtros que valem a pena carregar de uma navegação para a outra. */
export function paramsAtuais(f: Filtros): Record<string, string | number | undefined> {
  return {
    busca: f.busca,
    categoria: f.categoria,
    regiao: f.regiao,
    quartos: f.quartos,
    ate: f.ate,
    ordem: f.ordem === 'recentes' ? undefined : f.ordem,
    vista: f.vista === 'grade' ? undefined : f.vista,
  };
}
