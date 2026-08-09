import type { MetadataRoute } from 'next';

import { publicEnv } from '@/config/env';

/**
 * robots.txt.
 *
 * As áreas privadas entram em `disallow` como sinalização, não como proteção —
 * `robots.txt` é uma convenção que crawlers educados respeitam e atacantes
 * leem como um índice do que existe. A proteção real é a autenticação; o
 * `noindex` nas próprias páginas é o que impede a indexação de fato.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/library', '/favorites', '/messages', '/checkout', '/api/'],
    },
    sitemap: `${publicEnv.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
