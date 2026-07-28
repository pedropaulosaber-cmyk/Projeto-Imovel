/**
 * Lumo — Design Tokens
 * =====================
 * Fonte única de verdade da linguagem visual. Nenhum valor cru (cor, espaço,
 * raio, duração) deve ser escrito direto em componentes: tudo vem daqui.
 *
 * Marca:   Lumo
 * Slogan:  "Fluência, um dia de cada vez."
 * Conceito: luz. Cada sessão de estudo acende um pouco mais o idioma.
 *
 * A paleta é definida em escalas cruas (`palette`) e consumida apenas através
 * dos tokens semânticos do tema (ver `theme.ts`). Isso permite trocar a marca
 * inteira, ou adicionar temas (alto contraste, sazonais), sem tocar em UI.
 */

/* ------------------------------------------------------------------ *
 * Escalas de cor cruas
 * ------------------------------------------------------------------ */

export const palette = {
  /** Iris — cor primária da marca. Confiança + foco, sem o clichê do verde. */
  iris: {
    50: '#EEF0FF',
    100: '#E0E3FF',
    200: '#C7CCFE',
    300: '#A5ABFC',
    400: '#8285F8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B',
  },

  /** Ember — acento quente. Ofensiva, XP, energia, recompensa. */
  ember: {
    50: '#FFF8EB',
    100: '#FFEFC6',
    200: '#FEDD88',
    300: '#FDC44A',
    400: '#FCAB20',
    500: '#F59E0B',
    600: '#DA6602',
    700: '#B54606',
    800: '#93360C',
    900: '#792D0D',
    950: '#461502',
  },

  /** Mint — acerto, progresso concluído, estado saudável. */
  mint: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22',
  },

  /** Coral — erro. Nunca punitivo: sinaliza, não repreende. */
  coral: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },

  /** Sky — informação, dicas do tutor, conteúdo de escuta. */
  sky: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
    950: '#082F49',
  },

  /** Violet — premium, assinatura, conteúdo exclusivo. */
  violet: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
    950: '#3B0764',
  },

  /**
   * Ink — neutros levemente frios. A base de quase toda a interface.
   * Um neutro puro (cinza 50%) parece sujo ao lado do Iris; estes têm um
   * leve viés azul para harmonizar com a primária.
   */
  ink: {
    0: '#FFFFFF',
    25: '#FCFCFD',
    50: '#F8F9FC',
    100: '#F1F2F7',
    200: '#E5E7EF',
    300: '#D2D6E2',
    400: '#9BA1B4',
    500: '#6E7488',
    600: '#4E5468',
    700: '#3A3F50',
    800: '#242835',
    900: '#171A24',
    950: '#0F1119',
    1000: '#0B0C12',
  },

  transparent: 'transparent',
} as const;

/* ------------------------------------------------------------------ *
 * Espaçamento — escala de 4pt
 * ------------------------------------------------------------------ */

/**
 * Escala de 4pt. Os nomes são numéricos e previsíveis (space[4] = 16px)
 * para que a densidade de qualquer tela possa ser lida no código.
 */
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

/* ------------------------------------------------------------------ *
 * Raios
 * ------------------------------------------------------------------ */

export const radius = {
  none: 0,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  '3xl': 36,
  pill: 999,
} as const;

/* ------------------------------------------------------------------ *
 * Tipografia
 * ------------------------------------------------------------------ */

/**
 * Estratégia de fonte: **system-first**.
 *
 * Usamos a fonte do sistema (SF Pro no iOS, Roboto no Android, stack nativa na
 * web) em vez de uma webfont. Motivos:
 *  1. Zero bytes baixados e zero flash de texto invisível — o app abre mais rápido,
 *     o que importa mais que uma fonte "de marca" num app usado diariamente.
 *  2. Herda automaticamente o ajuste de tamanho de fonte de acessibilidade do SO.
 *  3. É exatamente o que a Apple faz. Tipografia impecável aqui significa escala,
 *     ritmo e tracking corretos — não uma fonte exótica.
 *
 * A personalidade da marca vem da cor, do espaço e do movimento.
 */
export const fontFamily = {
  /** Texto de interface. */
  sans: 'System',
  /** Conteúdo do idioma-alvo: mesma família, diferenciado por peso/cor. */
  reading: 'System',
  /** Transcrições fonéticas e código. */
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export type TypeStyle = {
  fontSize: number;
  lineHeight: number;
  fontWeight: (typeof fontWeight)[keyof typeof fontWeight];
  letterSpacing: number;
  textTransform?: 'uppercase';
};

/**
 * Escala tipográfica.
 *
 * Tamanhos maiores recebem tracking negativo (as letras "abrem" naturalmente
 * ao crescer) e tamanhos pequenos recebem tracking positivo, que é a regra que
 * faz uma tela parecer desenhada em vez de montada.
 */
export const typography: Record<string, TypeStyle> = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: -1.0 },
  title1: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 },
  title2: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  title3: { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 23, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 17, lineHeight: 25, fontWeight: '400', letterSpacing: -0.1 },
  callout: { fontSize: 16, lineHeight: 22, fontWeight: '400', letterSpacing: -0.1 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '500', letterSpacing: 0 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0.1 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.2 },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  /** Frases no idioma-alvo: maior e mais aberto, feito para leitura em voz alta. */
  target: { fontSize: 26, lineHeight: 36, fontWeight: '600', letterSpacing: -0.3 },
  /** Números de destaque (XP, ofensiva, precisão). */
  metric: { fontSize: 32, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
};

/* ------------------------------------------------------------------ *
 * Movimento
 * ------------------------------------------------------------------ */

/**
 * Um app usado todo dia não pode ter animações longas. A regra do Lumo:
 * nada acima de 320ms num caminho crítico. Feedback deve parecer instantâneo;
 * a animação existe para explicar a mudança, não para exibir-se.
 */
export const duration = {
  /** Estados de pressão, ripple, toggle. */
  instant: 90,
  /** Padrão para a maioria das transições de estado. */
  fast: 160,
  /** Entrada de conteúdo, expansão de cards. */
  normal: 240,
  /** Transições de tela, celebrações. */
  slow: 320,
  /** Somente celebrações de conclusão. */
  celebrate: 620,
} as const;

/** Curvas de easing como coeficientes de Bézier (compartilhadas RN/web). */
export const easing = {
  /** Padrão — sai rápido, chega suave. */
  standard: [0.2, 0.0, 0.0, 1.0] as const,
  /** Elementos entrando na tela. */
  enter: [0.05, 0.7, 0.1, 1.0] as const,
  /** Elementos saindo. */
  exit: [0.3, 0.0, 0.8, 0.15] as const,
  /** Micro-overshoot para recompensas. Usar com moderação. */
  spring: [0.34, 1.56, 0.64, 1.0] as const,
} as const;

/* ------------------------------------------------------------------ *
 * Elevação
 * ------------------------------------------------------------------ */

export type Elevation = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
};

/**
 * Sombras são sutis de propósito. Profundidade no Lumo vem principalmente de
 * cor de superfície e espaçamento; a sombra apenas separa camadas realmente
 * flutuantes (modais, barras fixas, cards arrastáveis).
 */
export const elevation: Record<'none' | 'sm' | 'md' | 'lg' | 'xl', Elevation> = {
  none: {
    shadowColor: '#000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sm: {
    shadowColor: '#0B0C12',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#0B0C12',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  lg: {
    shadowColor: '#0B0C12',
    shadowOpacity: 0.12,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  xl: {
    shadowColor: '#0B0C12',
    shadowOpacity: 0.18,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
    elevation: 18,
  },
};

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */

export const layout = {
  /** Largura máxima de conteúdo legível — evita linhas gigantes em tablet/web. */
  maxContentWidth: 560,
  /** Respiro horizontal padrão das telas. */
  screenPadding: space[5],
  /**
   * Alvo mínimo de toque. 44pt é a diretriz da Apple; usamos como piso absoluto
   * e ficamos em 48 nos controles primários por causa do uso com uma mão.
   */
  minTouchTarget: 44,
  primaryTouchTarget: 48,
  /**
   * Zona de alcance do polegar. Ações primárias vivem abaixo desta fração da
   * altura da tela, porque >95% do uso é móvel e com uma mão só.
   */
  thumbZoneStart: 0.62,
  tabBarHeight: 58,
} as const;

/** Pontos de quebra. Mobile-first: a base é o telefone, o resto é progressivo. */
export const breakpoint = {
  phone: 0,
  phoneLarge: 400,
  tablet: 768,
  desktop: 1080,
} as const;

export const opacity = {
  disabled: 0.4,
  pressed: 0.85,
  muted: 0.65,
  overlay: 0.55,
} as const;
