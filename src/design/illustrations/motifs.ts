/**
 * Motivos das cenas de idioma.
 *
 * Cada idioma recebe uma silhueta reconhecível **em forma abstrata**. A regra
 * que guiou a escolha: geometria, nunca folclore. Um sombrero no espanhol ou
 * um bigode enrolado no italiano seriam caricatura — e caricatura envelhece mal
 * e ofende antes disso. Um arco mourisco e um frontão são arquitetura: formas
 * que a própria cultura usa para se representar.
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
