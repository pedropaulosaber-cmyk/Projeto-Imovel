import type { CategoriaEmpreendimento, Regiao } from './tipos';

export const regioes: Regiao[] = [
  { slug: 'setor-serrinha', nome: 'Setor Serrinha', cidade: 'Goiânia', estado: 'GO' },
  { slug: 'setor-pedro-ludovico', nome: 'Setor Pedro Ludovico', cidade: 'Goiânia', estado: 'GO' },
  { slug: 'parque-amazonia', nome: 'Parque Amazônia', cidade: 'Goiânia', estado: 'GO' },
];

/**
 * "Serrinha, Pedro Ludovico e Parque Amazônia" a partir do catálogo.
 *
 * A copy da home e os metadados citavam as regiões à mão e ficaram mentindo
 * quando o catálogo mudou. Derivar custa uma função e resolve para sempre.
 */
export function regioesEmTexto(curto = false): string {
  const nomes = regioes.map((r) => (curto ? r.nome.replace(/^Setor /, '') : r.nome));
  if (nomes.length <= 1) return nomes[0] ?? '';
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

export function regiaoPorSlug(slug: string): Regiao | undefined {
  return regioes.find((r) => r.slug === slug);
}

export function nomeDaRegiao(slug: string): string {
  return regiaoPorSlug(slug)?.nome ?? slug;
}

/** Rótulos das três categorias, na ordem em que o design as apresenta. */
export const categorias: {
  slug: string;
  valor: CategoriaEmpreendimento;
  titulo: string;
  singular: string;
  texto: string;
}[] = [
  {
    slug: 'lancamento',
    valor: 'lancamento',
    titulo: 'Lançamentos',
    singular: 'Lançamento',
    texto: 'Primeira tabela, escolha livre de unidade e condições de pré-obra.',
  },
  {
    slug: 'na-planta',
    valor: 'na_planta',
    titulo: 'Na Planta',
    singular: 'Na Planta',
    texto: 'Obra em andamento, parcelamento direto com a incorporadora.',
  },
  {
    slug: 'remanescente',
    valor: 'remanescente',
    titulo: 'Remanescentes',
    singular: 'Remanescente',
    texto: 'Unidades prontas para morar, com escritura imediata.',
  },
];

export function categoriaPorSlug(slug: string) {
  return categorias.find((c) => c.slug === slug);
}

/** `na_planta` (banco) → `na-planta` (URL). */
export function slugDaCategoria(valor: CategoriaEmpreendimento): string {
  return valor.replace('_', '-');
}

export function rotuloDaCategoria(valor: CategoriaEmpreendimento): string {
  return categorias.find((c) => c.valor === valor)?.singular ?? valor;
}
