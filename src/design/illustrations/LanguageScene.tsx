/**
 * Cena de idioma — a ilustração de cabeçalho.
 *
 * Uma paisagem abstrata por idioma, derivada dos tokens do tema. Ver
 * `motifs.ts` para o vocabulário formal e o critério de escolha das formas.
 */

import { memo, useId } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { useTheme } from '../ThemeProvider';
import { alpha, mix } from '../color';
import { SCENE_HEIGHT, SCENE_WIDTH, sceneFor } from './motifs';
import { svgId } from './primitives';

export type LanguageSceneProps = {
  /** Código do idioma. Um código desconhecido cai na cena de reserva. */
  language: string;
  height?: number;
  /** Descrição para leitor de tela. Sem ela, a cena é ruído. */
  label?: string;
  /**
   * Cor em que a base da cena se dissolve — normalmente a superfície do card
   * que vem logo abaixo. Sem essa transição, a ilustração termina num corte
   * reto e a faixa de primeiro plano passa a ler como uma tarja de cor.
   */
  fadeTo?: string;
};

export const LanguageScene = memo(function LanguageScene({
  language,
  height = 132,
  label,
  fadeTo,
}: LanguageSceneProps) {
  const theme = useTheme();
  const reactId = useId();
  const scene = sceneFor(language);

  const dark = theme.isDark;

  // O céu vai de um tom de marca dessaturado até a própria superfície do card,
  // para que a cena se dissolva no conteúdo em vez de terminar numa borda dura.
  const skyTop = dark
    ? mix(theme.colors.background, theme.colors.brand, 0.34)
    : mix(theme.colors.brand, '#FFFFFF', 0.78);
  const skyBottom = dark
    ? mix(theme.colors.background, theme.colors.brand, 0.08)
    : mix(theme.colors.brand, '#FFFFFF', 0.94);

  // O disco é quente no claro (sol) e frio no escuro (lua) — a mesma forma
  // muda de significado com a hora do dia, sem precisar de dois desenhos.
  const disc = dark
    ? mix(theme.colors.info, '#FFFFFF', 0.55)
    : mix(theme.colors.streak, '#FFFFFF', 0.35);

  // Silhuetas: da mais clara (fundo) à mais escura (frente).
  const silhouetteFar = dark
    ? mix(theme.colors.background, theme.colors.brand, 0.2)
    : mix(theme.colors.brand, '#FFFFFF', 0.72);
  // A silhueta da frente não chega à marca pura. Saturação cheia no pé da cena
  // lê como tarja de cor, não como terreno — foi o que a primeira captura
  // mostrou, e nenhum ajuste de forma resolvia enquanto o tom estava errado.
  const silhouetteNear = dark
    ? mix(theme.colors.background, theme.colors.brand, 0.44)
    : mix(theme.colors.brand, '#FFFFFF', 0.18);

  const skyGradient = svgId(reactId, 'sky');
  const glowGradient = svgId(reactId, 'glow');
  const fadeGradient = svgId(reactId, 'fade');
  const fadeColor = fadeTo ?? theme.colors.surface;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label ?? 'Ilustração do idioma'}
      style={{ height, width: '100%' }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
        preserveAspectRatio="xMidYMax slice"
      >
        <Defs>
          <LinearGradient id={skyGradient} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={skyTop} />
            <Stop offset="1" stopColor={skyBottom} />
          </LinearGradient>
          {/*
            Radial, não linear. Com gradiente linear o halo desbota de cima
            para baixo e o círculo passa a ler como um retângulo claro atrás do
            sol — defeito que só apareceu na captura de tela, nunca no código.
          */}
          <RadialGradient id={glowGradient} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={alpha(disc, 0.45)} />
            <Stop offset="0.5" stopColor={alpha(disc, 0.18)} />
            <Stop offset="1" stopColor={alpha(disc, 0)} />
          </RadialGradient>
          <LinearGradient id={fadeGradient} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={alpha(fadeColor, 0)} />
            <Stop offset="1" stopColor={alpha(fadeColor, 1)} />
          </LinearGradient>
        </Defs>

        <Rect
          x="0"
          y="0"
          width={SCENE_WIDTH}
          height={SCENE_HEIGHT}
          fill={`url(#${skyGradient})`}
        />

        {/* Halo antes do disco: é o que faz a luz parecer vir de dentro da cena. */}
        <Circle
          cx={scene.disc.x}
          cy={scene.disc.y}
          r={scene.disc.r * 2.6}
          fill={`url(#${glowGradient})`}
        />
        <Circle cx={scene.disc.x} cy={scene.disc.y} r={scene.disc.r} fill={disc} />

        <G>
          {scene.layers.map((layer) => (
            <Path
              key={layer.path}
              d={layer.path}
              fill={mix(silhouetteFar, silhouetteNear, layer.depth)}
            />
          ))}
        </G>

        {/* Dissolve o pé da cena na superfície que vem abaixo. */}
        <Rect
          x="0"
          y={SCENE_HEIGHT * 0.72}
          width={SCENE_WIDTH}
          height={SCENE_HEIGHT * 0.28}
          fill={`url(#${fadeGradient})`}
        />
      </Svg>
    </View>
  );
});
