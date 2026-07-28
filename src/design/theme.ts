/**
 * Lumo — Tokens semânticos de tema (claro / escuro)
 *
 * Componentes nunca consomem `palette` direto. Eles pedem *função*
 * (`colors.textSecondary`, `colors.surfaceRaised`) e o tema resolve o valor.
 * É isso que garante que o modo escuro seja de verdade — não uma inversão —
 * e que um terceiro tema (alto contraste, daltonismo) seja um arquivo novo,
 * não uma varredura pela UI inteira.
 */

import { palette } from './tokens';

export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  /* Superfícies, do fundo para a frente */
  /** Fundo da aplicação. */
  background: string;
  /** Superfície padrão de card sobre o fundo. */
  surface: string;
  /** Card sobre card / estado hover. */
  surfaceRaised: string;
  /** Superfície recuada: campos de entrada, trilhos de progresso. */
  surfaceSunken: string;
  /** Folhas modais e popovers. */
  surfaceOverlay: string;
  /** Véu atrás de um modal. */
  scrim: string;

  /* Texto */
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  /** Texto sobre um preenchimento da cor da marca. */
  textOnBrand: string;
  textDisabled: string;

  /* Bordas */
  border: string;
  borderStrong: string;
  borderFocus: string;

  /* Marca */
  brand: string;
  brandHover: string;
  brandPressed: string;
  brandSubtle: string;
  brandBorder: string;
  onBrand: string;

  /* Estados semânticos */
  success: string;
  successSubtle: string;
  successBorder: string;
  onSuccess: string;

  danger: string;
  dangerSubtle: string;
  dangerBorder: string;
  onDanger: string;

  warning: string;
  warningSubtle: string;
  warningBorder: string;

  info: string;
  infoSubtle: string;
  infoBorder: string;

  /* Domínio: gamificação e status de aprendizado */
  /** Ofensiva / XP. */
  streak: string;
  streakSubtle: string;
  /** Assinatura premium. */
  premium: string;
  premiumSubtle: string;
  /** Palavra dominada no vocabulário. */
  mastered: string;
  /** Palavra em aprendizado. */
  learning: string;
  /** Item vencido para revisão. */
  due: string;

  /* Elementos avulsos */
  skeleton: string;
  divider: string;
  tabBarActive: string;
  tabBarInactive: string;
  shadow: string;
};

const lightColors: ThemeColors = {
  background: palette.ink[0],
  surface: palette.ink[0],
  surfaceRaised: palette.ink[50],
  surfaceSunken: palette.ink[100],
  surfaceOverlay: palette.ink[0],
  scrim: 'rgba(11, 12, 18, 0.45)',

  textPrimary: palette.ink[900],
  textSecondary: palette.ink[600],
  textTertiary: palette.ink[500],
  textOnBrand: palette.ink[0],
  textDisabled: palette.ink[400],

  border: palette.ink[200],
  borderStrong: palette.ink[300],
  borderFocus: palette.iris[500],

  brand: palette.iris[600],
  brandHover: palette.iris[700],
  brandPressed: palette.iris[800],
  brandSubtle: palette.iris[50],
  brandBorder: palette.iris[200],
  onBrand: palette.ink[0],

  success: palette.mint[600],
  successSubtle: palette.mint[50],
  successBorder: palette.mint[200],
  onSuccess: palette.ink[0],

  danger: palette.coral[600],
  dangerSubtle: palette.coral[50],
  dangerBorder: palette.coral[200],
  onDanger: palette.ink[0],

  warning: palette.ember[600],
  warningSubtle: palette.ember[50],
  warningBorder: palette.ember[200],

  info: palette.sky[600],
  infoSubtle: palette.sky[50],
  infoBorder: palette.sky[200],

  streak: palette.ember[500],
  streakSubtle: palette.ember[50],
  premium: palette.violet[600],
  premiumSubtle: palette.violet[50],
  mastered: palette.mint[600],
  learning: palette.iris[500],
  due: palette.ember[500],

  skeleton: palette.ink[100],
  divider: palette.ink[200],
  tabBarActive: palette.iris[600],
  tabBarInactive: palette.ink[400],
  shadow: '#0B0C12',
};

/**
 * Escuro não é o claro invertido.
 *
 * Duas regras deliberadas:
 *  1. O fundo é quase preto com viés azul (não #000), para que as superfícies
 *     elevadas possam ficar *mais claras* e criar hierarquia real.
 *  2. A cor da marca é deslocada para um tom mais claro (iris 400/500), porque
 *     o iris 600 não passa em contraste sobre fundo escuro.
 */
const darkColors: ThemeColors = {
  background: palette.ink[1000],
  surface: palette.ink[950],
  surfaceRaised: palette.ink[900],
  surfaceSunken: '#08090E',
  surfaceOverlay: palette.ink[900],
  scrim: 'rgba(0, 0, 0, 0.65)',

  textPrimary: palette.ink[25],
  textSecondary: palette.ink[400],
  textTertiary: palette.ink[500],
  textOnBrand: palette.ink[0],
  textDisabled: palette.ink[600],

  border: '#242835',
  borderStrong: '#333849',
  borderFocus: palette.iris[400],

  brand: palette.iris[400],
  brandHover: palette.iris[300],
  brandPressed: palette.iris[500],
  brandSubtle: 'rgba(99, 102, 241, 0.16)',
  brandBorder: 'rgba(130, 133, 248, 0.32)',
  onBrand: palette.ink[1000],

  success: palette.mint[400],
  successSubtle: 'rgba(16, 185, 129, 0.16)',
  successBorder: 'rgba(52, 211, 153, 0.32)',
  onSuccess: palette.ink[1000],

  danger: palette.coral[400],
  dangerSubtle: 'rgba(239, 68, 68, 0.16)',
  dangerBorder: 'rgba(248, 113, 113, 0.32)',
  onDanger: palette.ink[1000],

  warning: palette.ember[400],
  warningSubtle: 'rgba(245, 158, 11, 0.16)',
  warningBorder: 'rgba(252, 171, 32, 0.32)',

  info: palette.sky[400],
  infoSubtle: 'rgba(14, 165, 233, 0.16)',
  infoBorder: 'rgba(56, 189, 248, 0.32)',

  streak: palette.ember[400],
  streakSubtle: 'rgba(245, 158, 11, 0.16)',
  premium: palette.violet[400],
  premiumSubtle: 'rgba(168, 85, 247, 0.16)',
  mastered: palette.mint[400],
  learning: palette.iris[400],
  due: palette.ember[400],

  skeleton: palette.ink[800],
  divider: '#1D212C',
  tabBarActive: palette.iris[400],
  tabBarInactive: palette.ink[500],
  shadow: '#000000',
};

export const themes: Record<ColorScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

/**
 * Cores de bandeira por idioma. Usadas em seletores e cards de curso para
 * dar identidade a cada trilha sem depender de emoji de bandeira, que é
 * inconsistente entre Android, iOS e web.
 */
export const languageAccent: Record<string, { from: string; to: string }> = {
  en: { from: '#3B5BDB', to: '#5C7CFA' },
  es: { from: '#E8590C', to: '#FD7E14' },
  fr: { from: '#1864AB', to: '#4DABF7' },
  it: { from: '#2B8A3E', to: '#51CF66' },
  de: { from: '#343A40', to: '#868E96' },
  pt: { from: '#087F5B', to: '#20C997' },
  ja: { from: '#C92A2A', to: '#FF6B6B' },
};
