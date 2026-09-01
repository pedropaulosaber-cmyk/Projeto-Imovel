import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Poppins } from 'next/font/google';

import { MetaPixel } from '@/components/tracking/meta-pixel';
import { site, urlBase } from '@/config/site';

import './globals.css';

/* As duas famílias do design. Auto-hospedadas pelo next/font: sem request a
   fonts.googleapis.com no caminho crítico, e sem CLS na troca da fonte. */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--fonte-poppins',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--fonte-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(urlBase()),
  title: {
    default: `${site.nome} — Imóveis em Goiânia`,
    template: `%s · ${site.nome}`,
  },
  description:
    'Lançamentos, imóveis na planta e remanescentes no Setor Serrinha, Setor Pedro Ludovico e Jardim Atlântico. Registro de incorporação e cronograma abertos.',
  applicationName: site.nome,
  authors: [{ name: site.responsavelTecnico }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: site.nome,
    images: [{ url: '/imagens/escritorio-goiania.jpg', width: 1408, height: 768 }],
  },
  /* Mesmo interruptor do robots.ts: catálogo de demonstração não entra no
     índice do Google. Ver a justificativa em src/app/robots.ts. */
  robots: site.conteudoDemonstracao
    ? { index: false, follow: false }
    : { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#0e0e0c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${plexMono.variable}`}>
      <body className="bg-preto text-creme font-sans font-light antialiased">
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
