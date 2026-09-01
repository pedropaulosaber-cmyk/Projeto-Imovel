import type { MetadataRoute } from 'next';

import { site, urlBase } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  /*
    Enquanto o catálogo for de demonstração, o site inteiro fica fora do índice.
    O motivo não é técnico: os imóveis são fictícios e o CRECI no rodapé é real.
    Deixar o Google indexar anúncio inventado sob uma inscrição verdadeira é
    problema de conselho regional, não de SEO.

    Virar `site.conteudoDemonstracao` para `false` — junto com os imóveis reais
    e o registro de incorporação conferido — libera a indexação.
  */
  if (site.conteudoDemonstracao) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Área do corretor e endpoints não têm o que indexar.
        disallow: ['/api/', '/login', '/painel'],
      },
    ],
    sitemap: `${urlBase()}/sitemap.xml`,
    host: urlBase(),
  };
}
