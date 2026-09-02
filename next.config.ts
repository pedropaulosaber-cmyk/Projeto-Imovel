import type { NextConfig } from 'next';

/**
 * Content Security Policy.
 *
 * `script-src` inclui `'unsafe-inline'` por uma escolha explícita: a
 * alternativa correta — nonce por requisição gerado no middleware — obriga
 * toda página a ser renderizada sob demanda, e este site depende de SSG/ISR
 * para o SEO (CLAUDE.md §8). Trocar o ranqueamento das páginas de imóvel por
 * um endurecimento de CSP num site que não tem área autenticada de verdade
 * seria um mau negócio.
 *
 * Se a área do corretor passar a tratar dado sensível no navegador, a decisão
 * muda: aí vale nonce nas rotas de `/painel`, mantendo o resto estático.
 */
const csp = [
  "default-src 'self'",
  // connect.facebook.net: Pixel. As demais origens ficam de fora de propósito.
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
  // Tailwind compila para arquivo, mas o next/font injeta <style> inline.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.facebook.com",
  "font-src 'self' data:",
  "connect-src 'self' https://graph.facebook.com https://connect.facebook.net",
  "form-action 'self'",
  // Mapa da página do imóvel. Só é requisitado depois do clique do visitante.
  "frame-src 'self' https://www.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Só afeta quem já chegou por HTTPS; em http local é inerte.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // `frame-ancestors` é o mecanismo moderno; este fica pelos proxies antigos.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  // `X-Powered-By` só diz ao atacante qual stack procurar CVE.
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    /*
      O padrão do next/image é qualidade 75. Numa foto de apartamento em tela
      cheia isso aparece: o céu ganha faixa, a esquadria serrilha e o cliente
      vê o imóvel pior do que ele é. 92 custa alguns KB a mais e resolve.
      A lista existe porque o Next 16 recusa `quality` fora dela.
    */
    qualities: [75, 92],
    // Fotos de empreendimento virão do storage do Supabase; o host entra por
    // variável para o mesmo build servir staging e produção.
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
