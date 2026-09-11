import { rotas } from '@/lib/rotas';

export type ChaveNav = 'home' | 'imoveis' | 'parques' | 'escritorio' | 'corretor';

/** Barra desktop, na ordem do design. */
export const linksDesktop: { chave: ChaveNav; rotulo: string; href: string }[] = [
  { chave: 'home', rotulo: 'Home', href: rotas.home },
  { chave: 'imoveis', rotulo: 'Imóveis', href: rotas.imoveis },
  { chave: 'parques', rotulo: 'Parques', href: rotas.parque('parque-serrinha') },
];

/** Menu de tela cheia do mobile, na ordem do design. */
export const linksMobile: { rotulo: string; href: string; discreto?: boolean }[] = [
  { rotulo: 'Home', href: rotas.home },
  { rotulo: 'Imóveis', href: rotas.imoveis },
  { rotulo: 'Parque Serrinha', href: rotas.parque('parque-serrinha') },
  { rotulo: 'Parque Cascavel', href: rotas.parque('parque-cascavel') },
];

/** Colunas do rodapé. */
export const linksRodape = [
  { rotulo: 'Imóveis', href: rotas.imoveis },
  { rotulo: 'Parque Serrinha', href: rotas.parque('parque-serrinha') },
  { rotulo: 'Parque Cascavel', href: rotas.parque('parque-cascavel') },
  { rotulo: 'Política de Privacidade · LGPD', href: rotas.privacidade },
];
