import type { MetadataRoute } from 'next';

import { urlBase } from '@/config/site';
import { empreendimentosPublicados, listagensComImovel } from '@/content/empreendimentos';
import { parques } from '@/content/parques';
import { slugDaCategoria } from '@/content/regioes';
import { rotas } from '@/lib/rotas';

/**
 * Só entram URLs indexáveis e estáveis.
 *
 * `/imoveis` com filtro fica de fora: são variações da mesma lista, marcadas
 * como `noindex` na própria página. E `empreendimentosPublicados()` garante
 * que nenhum rascunho — imóvel sem registro de incorporação — vaze para cá.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlBase();
  const agora = new Date();

  const fixas: MetadataRoute.Sitemap = [
    { url: `${base}${rotas.home}`, lastModified: agora, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${base}${rotas.imoveis}`,
      lastModified: agora,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}${rotas.escritorio}`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${base}${rotas.privacidade}`,
      lastModified: agora,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  const paginasDeParque: MetadataRoute.Sitemap = parques.map((p) => ({
    url: `${base}${rotas.parque(p.slug)}`,
    lastModified: agora,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  /* Só listagem com estoque: combinação sem imóvel não existe como página. */
  const listagens: MetadataRoute.Sitemap = listagensComImovel().map((l) => ({
    url: `${base}${rotas.listagem(l.regiao, slugDaCategoria(l.categoria))}`,
    lastModified: agora,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const imoveis: MetadataRoute.Sitemap = empreendimentosPublicados().map((e) => {
    /* Extensão de imagem do sitemap: leva a foto de capa de cada imóvel para o
       Google Imagens junto com a URL da página. */
    const foto = e.midias.find((m) => m.tipo === 'foto' && m.url)?.url;
    return {
      url: `${base}${rotas.empreendimento(e)}`,
      lastModified: agora,
      changeFrequency: 'weekly',
      priority: 0.9,
      ...(foto ? { images: [`${base}${foto}`] } : {}),
    };
  });

  return [...fixas, ...paginasDeParque, ...listagens, ...imoveis];
}
