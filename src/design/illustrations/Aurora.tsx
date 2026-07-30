/**
 * Aurora — fundo ambiente de cabeçalho.
 *
 * Três manchas de luz sobrepostas, em gradiente radial. É o recurso que dá
 * profundidade a uma tela sem acrescentar nada para o olho decodificar: a
 * pessoa percebe que a tela tem "ar", não que existe um desenho ali.
 *
 * ## Por que gradiente radial e não desfoque
 *
 * O caminho óbvio seria uma forma sólida com `feGaussianBlur`. Filtros SVG têm
 * suporte irregular no `react-native-svg` entre iOS, Android e web — e um
 * filtro que falha não degrada com elegância: aparece o retângulo cru. Três
 * gradientes radiais com parada final transparente produzem o mesmo efeito e
 * funcionam nas três plataformas.
 */

import { memo, useId } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '../ThemeProvider';
import { alpha } from '../color';
import { seedFrom, seededRandom, svgId } from './primitives';

export type AuroraProps = {
  /**
   * Semente da composição. Telas diferentes recebem sementes diferentes para
   * que o fundo não se repita idêntico de aba em aba — o que o olho nota.
   */
  seed?: string;
  height?: number;
  /** Intensidade geral. O padrão é deliberadamente discreto. */
  intensity?: number;
  style?: ViewStyle;
};

export const Aurora = memo(function Aurora({
  seed = 'lumo',
  height = 220,
  intensity = 1,
  style,
}: AuroraProps) {
  const theme = useTheme();
  const reactId = useId();
  const random = seededRandom(seedFrom(seed));

  // Três famílias de cor da marca. A ordem fixa mantém a identidade; a semente
  // move apenas a posição e o raio.
  const tints = [theme.colors.brand, theme.colors.info, theme.colors.premium];

  // No escuro a luz precisa ser mais forte para aparecer sobre o fundo quase
  // preto; no claro, mais fraca, ou vira mancha suja sobre o branco.
  const base = (theme.isDark ? 0.3 : 0.17) * intensity;

  const blobs = tints.map((tint, index) => ({
    id: svgId(reactId, `blob${index}`),
    tint,
    cx: 15 + random() * 70,
    cy: 8 + random() * 46,
    r: 34 + random() * 26,
  }));

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, height }, style]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          {blobs.map((blob) => (
            <RadialGradient key={blob.id} id={blob.id} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={alpha(blob.tint, base)} />
              <Stop offset="0.55" stopColor={alpha(blob.tint, base * 0.42)} />
              <Stop offset="1" stopColor={alpha(blob.tint, 0)} />
            </RadialGradient>
          ))}
        </Defs>

        {blobs.map((blob) => (
          <Circle
            key={blob.id}
            cx={blob.cx}
            cy={blob.cy}
            r={blob.r}
            fill={`url(#${blob.id})`}
          />
        ))}
      </Svg>
    </View>
  );
});
