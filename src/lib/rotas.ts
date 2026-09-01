import type { Empreendimento } from '@/content/tipos';
import { slugDaCategoria } from '@/content/regioes';

/**
 * URLs em um lugar só. A estrutura `/[regiao]/[categoria]/[slug]` é a do
 * CLAUDE.md: semântica, indexável e legível — o caminho já diz onde fica e em
 * que momento de compra o imóvel está.
 */
export const rotas = {
  home: '/',
  imoveis: '/imoveis',
  escritorio: '/escritorio',
  privacidade: '/privacidade',
  login: '/login',
  painel: '/painel',
  parque: (slug: string) => `/parques/${slug}`,
  listagem: (regiaoSlug: string, categoriaSlug: string) => `/${regiaoSlug}/${categoriaSlug}`,
  empreendimento: (e: Pick<Empreendimento, 'regiaoSlug' | 'categoria' | 'slug'>) =>
    `/${e.regiaoSlug}/${slugDaCategoria(e.categoria)}/${e.slug}`,
} as const;

/** Segmentos reservados: nunca podem virar slug de região. */
export const segmentosReservados = [
  'imoveis',
  'parques',
  'escritorio',
  'privacidade',
  'login',
  'painel',
  'api',
];
