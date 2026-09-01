import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Cabecalho } from '@/components/layout/cabecalho';
import { Listagem } from '@/components/listagem/listagem';
import { categorias, categoriaPorSlug, regiaoPorSlug, regioes } from '@/content/regioes';
import { lerFiltros } from '@/lib/filtros';
import { rotas } from '@/lib/rotas';

/**
 * Esta é a rota que precisa ranquear, então ela é pré-renderizada e não lê
 * `searchParams` — ler tornaria a página dinâmica. O filtro interativo mora em
 * `/imoveis`, para onde a barra de filtros leva já com região e categoria
 * marcadas.
 *
 * `dynamicParams = false` faz qualquer combinação inexistente cair em 404 em
 * vez de gerar página vazia indexável.
 */
export const revalidate = 3600;
export const dynamicParams = false;

type Params = { params: Promise<{ regiao: string; categoria: string }> };

export function generateStaticParams() {
  return regioes.flatMap((r) => categorias.map((c) => ({ regiao: r.slug, categoria: c.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { regiao: regiaoSlug, categoria: categoriaSlug } = await params;
  const regiao = regiaoPorSlug(regiaoSlug);
  const categoria = categoriaPorSlug(categoriaSlug);
  if (!regiao || !categoria) return {};

  const titulo = `${categoria.titulo} no ${regiao.nome}`;

  return {
    title: `${titulo} — ${regiao.cidade}`,
    description: `${categoria.texto} Empreendimentos no ${regiao.nome}, ${regiao.cidade} — ${regiao.estado}, com registro de incorporação conferido.`,
    alternates: { canonical: rotas.listagem(regiao.slug, categoria.slug) },
  };
}

export default async function PaginaListagemPorRegiao({ params }: Params) {
  const { regiao: regiaoSlug, categoria: categoriaSlug } = await params;
  const regiao = regiaoPorSlug(regiaoSlug);
  const categoria = categoriaPorSlug(categoriaSlug);
  if (!regiao || !categoria) notFound();

  return (
    <>
      <Cabecalho ativo="imoveis" />
      <Listagem
        filtros={lerFiltros({})}
        interativo={false}
        basePath={rotas.listagem(regiao.slug, categoria.slug)}
        titulo={`${categoria.titulo} no ${regiao.nome}`}
        fixos={{ regiao: regiao.slug, categoria: categoria.slug }}
        migalhas={[
          { rotulo: 'HOME', href: rotas.home },
          { rotulo: regiao.nome.toUpperCase(), href: rotas.imoveis },
          { rotulo: categoria.titulo.toUpperCase() },
        ]}
      />
    </>
  );
}
