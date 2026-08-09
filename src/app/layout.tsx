import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';

import { publicEnv } from '@/config/env';

import './globals.css';

/**
 * Layout raiz.
 *
 * ## A fonte é auto-hospedada
 *
 * `next/font` baixa a Manrope no build e a serve do próprio domínio. Três
 * ganhos, nesta ordem de importância: nenhuma requisição ao Google em tempo de
 * execução (o que também resolve o problema de LGPD/GDPR de enviar o IP de
 * todo visitante para um terceiro), zero mudança de layout no carregamento
 * (`display: swap` com métricas de fallback ajustadas), e um DNS a menos no
 * caminho crítico.
 */
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
  title: {
    default: 'AUTOMATIZE — o marketplace de soluções de IA',
    // Toda página filha entra neste molde, então o nome da marca aparece na
    // aba e no resultado de busca sem ninguém precisar repetir a string.
    template: '%s · AUTOMATIZE',
  },
  description:
    'Compre agentes de IA, automações e workflows prontos, ou contrate especialistas para construir a solução que sua empresa precisa.',
  applicationName: 'AUTOMATIZE',
  authors: [{ name: 'AUTOMATIZE' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AUTOMATIZE',
    title: 'AUTOMATIZE — o marketplace de soluções de IA',
    description:
      'Compre agentes de IA, automações e workflows prontos, ou contrate especialistas para construir a sua.',
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  // `maximumScale` fica de fora de propósito: travar o zoom é uma barreira de
  // acessibilidade real para quem tem baixa visão, e o único problema que
  // resolve (zoom acidental no iOS) já não existe com alvos de toque de 44px.
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body className="min-h-dvh bg-paper antialiased">
        {/*
          Atalho para pular a navegação. Fica visualmente escondido até receber
          foco — quem navega por teclado o encontra no primeiro Tab e evita
          percorrer o menu inteiro em toda página.
        */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[var(--radius-btn)] focus:bg-brand focus:px-4 focus:py-2.5 focus:font-semibold focus:text-white"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
