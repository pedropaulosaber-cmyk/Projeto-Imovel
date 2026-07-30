/**
 * Motivos das cenas de idioma.
 *
 * Cada idioma recebe uma silhueta reconhecível **em forma abstrata**. A regra
 * que guiou a escolha: geometria, nunca folclore. Um sombrero no espanhol ou
 * uma gueixa no japonês seriam caricatura — e caricatura envelhece mal e ofende
 * antes disso. Um arco mourisco e um torii são arquitetura: formas que a
 * própria cultura usa para se representar.
 *
 * ## O sistema de coordenadas é uma faixa, não um quadrado
 *
 * As cenas são autoradas em **200 × 60** porque é isso que elas são na tela:
 * uma faixa de cabeçalho de proporção ~3,3:1.
 *
 * A primeira versão foi desenhada num quadrado 100 × 100 e escalada para
 * cobrir a faixa. O resultado, visto no navegador, era uma mancha roxa chapada:
 * cobrir a largura ampliava a cena a ponto de sobrar só a base — o sol, as
 * montanhas e o portal ficavam todos acima do recorte. Autorar na proporção
 * final é o que garante que a composição vista seja a composição desenhada.
 */

import { type Point, hillPath, ridgePath } from './primitives';

/* ------------------------------------------------------------------ *
 * Geradores de forma
 * ------------------------------------------------------------------ */

/** Arco de volta perfeita sobre dois pés — arquitetura mediterrânea e islâmica. */
export function arch(cx: number, baseY: number, width: number, height: number): string {
  const half = width / 2;
  const spring = baseY - height + half;
  return [
    `M ${cx - half} ${baseY}`,
    `L ${cx - half} ${spring}`,
    `A ${half} ${half} 0 0 1 ${cx + half} ${spring}`,
    `L ${cx + half} ${baseY}`,
    'Z',
  ].join(' ');
}

/** Conífera — triângulo. Floresta alpina e nórdica. */
export function pine(cx: number, baseY: number, width: number, height: number): string {
  const half = width / 2;
  return `M ${cx} ${baseY - height} L ${cx + half} ${baseY} L ${cx - half} ${baseY} Z`;
}

/** Cipreste — a vertical estreita da paisagem toscana. */
export function cypress(cx: number, baseY: number, width: number, height: number): string {
  const half = width / 2;
  const mid = baseY - height / 2;
  return [
    `M ${cx} ${baseY - height}`,
    `Q ${cx + half} ${mid} ${cx} ${baseY}`,
    `Q ${cx - half} ${mid} ${cx} ${baseY - height}`,
    'Z',
  ].join(' ');
}

/** Torii — dois pilares e duas travessas. O portal japonês. */
export function torii(cx: number, baseY: number, width: number, height: number): string {
  const half = width / 2;
  const post = Math.max(1.2, width * 0.09);
  const topY = baseY - height;
  const beamY = topY + height * 0.2;
  const overhang = half * 0.22;

  return [
    // Pilar esquerdo
    `M ${cx - half} ${baseY} L ${cx - half} ${topY} L ${cx - half + post} ${topY} L ${cx - half + post} ${baseY} Z`,
    // Pilar direito
    `M ${cx + half - post} ${baseY} L ${cx + half - post} ${topY} L ${cx + half} ${topY} L ${cx + half} ${baseY} Z`,
    // Travessa superior, com beiral para fora
    `M ${cx - half - overhang} ${topY} L ${cx + half + overhang} ${topY} L ${cx + half + overhang} ${topY + post} L ${cx - half - overhang} ${topY + post} Z`,
    // Travessa inferior
    `M ${cx - half} ${beamY} L ${cx + half} ${beamY} L ${cx + half} ${beamY + post * 0.8} L ${cx - half} ${beamY + post * 0.8} Z`,
  ].join(' ');
}

/** Arco de ponte — vão sobre a água. */
export function bridge(cx: number, baseY: number, width: number, height: number): string {
  const half = width / 2;
  const deck = Math.max(1.5, height * 0.22);
  return [
    `M ${cx - half} ${baseY}`,
    `Q ${cx} ${baseY - height * 2} ${cx + half} ${baseY}`,
    `L ${cx + half} ${baseY - deck}`,
    `Q ${cx} ${baseY - height * 2 - deck} ${cx - half} ${baseY - deck}`,
    'Z',
  ].join(' ');
}

/** Telhado de duas águas — a casa de enxaimel, reduzida ao essencial. */
export function gable(cx: number, baseY: number, width: number, height: number): string {
  const half = width / 2;
  const wall = height * 0.45;
  return [
    `M ${cx - half} ${baseY}`,
    `L ${cx - half} ${baseY - wall}`,
    `L ${cx} ${baseY - height}`,
    `L ${cx + half} ${baseY - wall}`,
    `L ${cx + half} ${baseY}`,
    'Z',
  ].join(' ');
}

/** Pagode em camadas — beirais que diminuem para cima. */
export function pagoda(cx: number, baseY: number, width: number, height: number): string {
  const tiers = 3;
  const parts: string[] = [];
  for (let tier = 0; tier < tiers; tier += 1) {
    const shrink = 1 - tier * 0.24;
    const half = (width / 2) * shrink;
    const y = baseY - (height / tiers) * tier;
    const thickness = Math.max(1.1, height * 0.07);
    parts.push(
      `M ${cx - half} ${y} Q ${cx} ${y - thickness * 1.8} ${cx + half} ${y} L ${cx + half * 0.72} ${y - thickness} L ${cx - half * 0.72} ${y - thickness} Z`,
    );
  }
  const shaft = Math.max(1.2, width * 0.07);
  parts.push(
    `M ${cx - shaft} ${baseY} L ${cx - shaft} ${baseY - height} L ${cx + shaft} ${baseY - height} L ${cx + shaft} ${baseY} Z`,
  );
  return parts.join(' ');
}

/* ------------------------------------------------------------------ *
 * Cenas
 * ------------------------------------------------------------------ */

export type SceneLayer = {
  /** Caminho SVG no sistema 200 × 60. */
  path: string;
  /**
   * Profundidade 0–1. Zero é o fundo (mais claro, mais próximo do céu), um é a
   * frente (mais escuro). É o que cria a sensação de distância sem sombra.
   */
  depth: number;
};

export type Scene = {
  /** Disco de sol ou lua. */
  disc: { x: number; y: number; r: number };
  layers: SceneLayer[];
};

/** Dimensões do canvas das cenas. Ver a nota de proporção no topo do arquivo. */
export const SCENE_WIDTH = 200;
export const SCENE_HEIGHT = 60;

const ridge = (peaks: Point[]) => ridgePath(peaks, SCENE_HEIGHT);
const hill = (peaks: Point[]) => hillPath(peaks, SCENE_HEIGHT);

/**
 * As oito cenas.
 *
 * Cada uma tem entre duas e quatro camadas. Menos que duas não cria
 * profundidade; mais que quatro vira ruído num card de 140px de altura.
 */
export const SCENES: Record<string, Scene> = {
  /** Inglês — colinas suaves e o vão de uma ponte. */
  en: {
    disc: { x: 150, y: 15, r: 9 },
    layers: [
      {
        path: hill([
          { x: -5, y: 42 },
          { x: 45, y: 32 },
          { x: 105, y: 40 },
          { x: 205, y: 30 },
        ]),
        depth: 0.25,
      },
      { path: bridge(64, 50, 68, 8), depth: 0.82 },
      {
        path: hill([
          { x: -5, y: 57 },
          { x: 52, y: 44 },
          { x: 112, y: 55 },
          { x: 168, y: 43 },
          { x: 205, y: 51 },
        ]),
        depth: 1,
      },
    ],
  },

  /** Espanhol — a arcada mourisca do pátio. */
  es: {
    disc: { x: 40, y: 14, r: 10 },
    layers: [
      {
        path: hill([
          { x: -5, y: 44 },
          { x: 80, y: 34 },
          { x: 205, y: 42 },
        ]),
        depth: 0.22,
      },
      {
        path: [
          arch(96, 54, 22, 20),
          arch(124, 54, 22, 20),
          arch(152, 54, 22, 20),
          arch(180, 54, 22, 20),
        ].join(' '),
        depth: 0.66,
      },
      {
        path: hill([
          { x: -5, y: 57 },
          { x: 60, y: 50 },
          { x: 130, y: 56 },
          { x: 205, y: 50 },
        ]),
        depth: 1,
      },
    ],
  },

  /** Francês — a vertical afilada sobre a cidade baixa. */
  fr: {
    disc: { x: 150, y: 14, r: 9 },
    layers: [
      {
        path: hill([
          { x: -5, y: 44 },
          { x: 90, y: 36 },
          { x: 205, y: 43 },
        ]),
        depth: 0.24,
      },
      {
        path: 'M 46 54 L 52 20 L 58 54 Z M 42 54 L 62 54 L 62 51 L 42 51 Z M 47 36 L 57 36 L 57 33 L 47 33 Z',
        depth: 0.7,
      },
      {
        path: hill([
          { x: -5, y: 58 },
          { x: 66, y: 48 },
          { x: 138, y: 56 },
          { x: 205, y: 47 },
        ]),
        depth: 1,
      },
    ],
  },

  /** Italiano — cúpula e ciprestes. */
  it: {
    disc: { x: 36, y: 15, r: 10 },
    layers: [
      {
        path: hill([
          { x: -5, y: 42 },
          { x: 100, y: 32 },
          { x: 205, y: 40 },
        ]),
        depth: 0.22,
      },
      {
        path: [
          'M 104 54 A 16 18 0 0 1 136 54 Z',
          'M 118 35 L 122 35 L 122 30 L 118 30 Z',
          cypress(62, 54, 11, 26),
          cypress(78, 54, 9, 20),
        ].join(' '),
        depth: 0.68,
      },
      {
        path: hill([
          { x: -5, y: 58 },
          { x: 70, y: 49 },
          { x: 142, y: 57 },
          { x: 205, y: 48 },
        ]),
        depth: 1,
      },
    ],
  },

  /** Alemão — floresta de coníferas e o telhado de duas águas. */
  de: {
    disc: { x: 156, y: 15, r: 9 },
    layers: [
      {
        path: ridge([
          { x: -5, y: 40 },
          { x: 40, y: 22 },
          { x: 90, y: 36 },
          { x: 140, y: 20 },
          { x: 205, y: 38 },
        ]),
        depth: 0.24,
      },
      {
        path: [
          pine(28, 55, 22, 28),
          pine(52, 55, 18, 22),
          gable(110, 55, 28, 24),
          pine(170, 55, 20, 26),
        ].join(' '),
        depth: 0.7,
      },
      {
        path: hill([
          { x: -5, y: 58 },
          { x: 62, y: 50 },
          { x: 132, y: 57 },
          { x: 205, y: 49 },
        ]),
        depth: 1,
      },
    ],
  },

  /** Japonês — o cone truncado do Fuji e o torii. */
  ja: {
    disc: { x: 146, y: 14, r: 11 },
    layers: [
      {
        path: ridge([
          { x: 20, y: 46 },
          { x: 62, y: 16 },
          { x: 80, y: 12 },
          { x: 98, y: 16 },
          { x: 140, y: 46 },
        ]),
        depth: 0.28,
      },
      {
        path: hill([
          { x: -5, y: 48 },
          { x: 80, y: 44 },
          { x: 205, y: 47 },
        ]),
        depth: 0.55,
      },
      { path: torii(150, 56, 34, 24), depth: 0.92 },
      {
        path: hill([
          { x: -5, y: 57 },
          { x: 74, y: 50 },
          { x: 146, y: 56 },
          { x: 205, y: 50 },
        ]),
        depth: 1,
      },
    ],
  },

  /** Coreano — cordilheiras em camadas, a paisagem de tinta. */
  ko: {
    disc: { x: 44, y: 13, r: 10 },
    layers: [
      {
        path: hill([
          { x: -5, y: 36 },
          { x: 50, y: 24 },
          { x: 110, y: 34 },
          { x: 205, y: 22 },
        ]),
        depth: 0.2,
      },
      {
        path: hill([
          { x: -5, y: 44 },
          { x: 66, y: 32 },
          { x: 136, y: 42 },
          { x: 205, y: 34 },
        ]),
        depth: 0.5,
      },
      {
        path: hill([
          { x: -5, y: 52 },
          { x: 82, y: 42 },
          { x: 160, y: 50 },
          { x: 205, y: 44 },
        ]),
        depth: 0.78,
      },
      {
        path: hill([
          { x: -5, y: 58 },
          { x: 68, y: 50 },
          { x: 140, y: 57 },
          { x: 205, y: 49 },
        ]),
        depth: 1,
      },
    ],
  },

  /** Mandarim — os picos verticais de Guilin e o pagode. */
  zh: {
    disc: { x: 156, y: 13, r: 9 },
    layers: [
      {
        path: ridge([
          { x: 8, y: 46 },
          { x: 22, y: 16 },
          { x: 36, y: 46 },
          { x: 54, y: 24 },
          { x: 72, y: 46 },
        ]),
        depth: 0.26,
      },
      {
        path: ridge([
          { x: 80, y: 48 },
          { x: 98, y: 20 },
          { x: 112, y: 48 },
          { x: 132, y: 28 },
          { x: 150, y: 48 },
        ]),
        depth: 0.5,
      },
      { path: pagoda(52, 56, 24, 26), depth: 0.9 },
      {
        path: hill([
          { x: -5, y: 58 },
          { x: 78, y: 50 },
          { x: 150, y: 57 },
          { x: 205, y: 49 },
        ]),
        depth: 1,
      },
    ],
  },
};

/** Cena de reserva — usada se um idioma novo entrar antes da arte. */
export const FALLBACK_SCENE: Scene = {
  disc: { x: 150, y: 15, r: 9 },
  layers: [
    {
      path: hill([
        { x: -5, y: 40 },
        { x: 80, y: 30 },
        { x: 205, y: 38 },
      ]),
      depth: 0.3,
    },
    {
      path: hill([
        { x: -5, y: 54 },
        { x: 100, y: 46 },
        { x: 205, y: 52 },
      ]),
      depth: 1,
    },
  ],
};

export function sceneFor(language: string): Scene {
  return SCENES[language] ?? FALLBACK_SCENE;
}
