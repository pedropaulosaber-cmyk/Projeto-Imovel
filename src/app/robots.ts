import type { MetadataRoute } from 'next';

import { urlBase } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
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
