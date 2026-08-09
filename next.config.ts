import type { NextConfig } from 'next';

/**
 * Cabeçalhos de segurança aplicados a toda resposta.
 *
 * A CSP **não** mora aqui: ela precisa de um nonce por requisição para permitir
 * os scripts inline do Next sem recorrer a `unsafe-inline`, e nonce por
 * requisição só existe no middleware. Ver `src/middleware.ts`.
 *
 * O que fica aqui é o que é estático — e o que é estático deve ser servido pela
 * borda, não recalculado a cada render.
 */
const securityHeaders = [
  // Só afeta navegadores que já chegaram por HTTPS; em desenvolvimento (http
  // local) é inerte, então não precisa de condicional.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // `frame-ancestors` na CSP é o mecanismo moderno; este continua por causa de
  // navegadores e proxies corporativos antigos que só entendem o header legado.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  // Isola o contexto de origem cruzada: sem isto, uma janela aberta por
  // `window.open` mantém referência ao `window` desta aplicação.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  // O header `X-Powered-By` só serve para dizer a um atacante qual stack
  // procurar CVE.
  poweredByHeader: false,
  reactStrictMode: true,

  // `standalone` empacota só o necessário para rodar, o que reduz a superfície
  // da imagem de produção e o tempo de cold start.
  output: 'standalone',

  experimental: {
    // Server Actions recebem corpo do usuário: sem teto explícito, um upload
    // grande vira negação de serviço barata.
    serverActions: { bodySizeLimit: '2mb' },
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    // Domínios de imagem entram por variável de ambiente para que o mesmo build
    // sirva staging e produção sem recompilar.
    remotePatterns: process.env.NEXT_PUBLIC_IMAGE_HOSTS
      ? process.env.NEXT_PUBLIC_IMAGE_HOSTS.split(',').map((hostname) => ({
          protocol: 'https' as const,
          hostname: hostname.trim(),
        }))
      : [],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
