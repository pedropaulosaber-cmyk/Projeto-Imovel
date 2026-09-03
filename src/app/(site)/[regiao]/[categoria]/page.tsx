import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Cabecalho } from '@/components/layout/cabecalho';
import { Listagem } from '@/components/listagem/listagem';
import { urlBase } from '@/config/site';
import { empreendimentosPorRegiaoECategoria, listagensComImovel } from '@/content/empreendimentos';
import { categoriaPorSlug, regiaoPorSlug, slugDaCategoria } from '@/content/regioes';
import { lerFiltros } from '@/lib/filtros';
import { jsonLdSeguro } from '@/lib/json-ld';
import { rotas } from '@/lib/rotas';
import { imagemSocialDoImovel, trilhaJsonLd } from '@/lib/seo';

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
  return listagensComImovel().map((l) => ({
    regiao: l.regiao,
    categoria: slugDaCategoria(l.categoria),
  }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { regiao: regiaoSlug, categoria: categoriaSlug } = await params;
  const regiao = regiaoPorSlug(regiaoSlug);
  const categoria = categoriaPorSlug(categoriaSlug);
  if (!regiao || !categoria) return {};

  const titulo = `${categoria.titulo} no ${regiao.nome}`;
  const imagem = empreendimentosPorRegiaoECategoria(regiao.slug, categoria.valor)
    .map(imagemSocialDoImovel)
    .find(Boolean);

  return {
    title: `${titulo} — ${regiao.cidade}`,
    description: `${categoria.texto} Apartamentos no ${regiao.nome}, ${regiao.cidade} — ${regiao.estado}, com registro de incorporação conferido.`,
    keywords: [
      `apartamento à venda ${regiao.nome}`,
      `${categoria.titulo} ${regiao.nome}`,
      `${categoria.titulo} ${regiao.cidade}`,
      `apartamento ${categoria.singular.toLowerCase()} ${regiao.cidade}`,
      `imóveis ${regiao.nome}`,
    ],
    alternates: { canonical: rotas.listagem(regiao.slug, categoria.slug) },
    openGraph: {
      title: `${titulo} — ${regiao.cidade}`,
      type: 'website',
      url: rotas.listagem(regiao.slug, categoria.slug),
      ...(imagem ? { images: [{ url: imagem, alt: titulo }] } : {}),
    },
  };
}

export default async function PaginaListagemPorRegiao({ params }: Params) {
  const { regiao: regiaoSlug, categoria: categoriaSlug } = await params;
  const regiao = regiaoPorSlug(regiaoSlug);
  const categoria = categoriaPorSlug(categoriaSlug);
  if (!regiao || !categoria) notFound();

  const imoveis = empreendimentosPorRegiaoECategoria(regiao.slug, categoria.valor);
  const titulo = `${categoria.titulo} no ${regiao.nome}`;

  return (
    <>
      <Cabecalho ativo="imoveis" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro(
            trilhaJsonLd([
              { nome: 'Início', caminho: rotas.home },
              { nome: 'Imóveis', caminho: rotas.imoveis },
              { nome: titulo, caminho: rotas.listagem(regiao.slug, categoria.slug) },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        /* A coleção e a lista ordenada de imóveis desta praça × momento. */
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${titulo}, ${regiao.cidade}`,
            url: `${urlBase()}${rotas.listagem(regiao.slug, categoria.slug)}`,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: imoveis.length,
              itemListElement: imoveis.map((e, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${urlBase()}${rotas.empreendimento(e)}`,
                name: e.nome,
              })),
            },
          }),
        }}
      />
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
