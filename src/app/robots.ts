import type { MetadataRoute } from 'next';

import { site, urlBase } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  /*
    Trava de publicação: enquanto ligada, o site inteiro fica fora do índice.

    Os imóveis já são reais e com registro de incorporação conferido. O que
    ainda segura é a marca e o telefone, que continuam sendo os do design —
    indexar anúncio sob um número que não atende queima o anúncio e o CRECI
    que assina embaixo.

    Trocar marca e contatos em `src/config/site.ts` e virar o interruptor
    libera a indexação de uma vez.
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
