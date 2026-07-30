/**
 * Spot — ilustração pequena para estado vazio e conclusão.
 *
 * Estado vazio é onde a ilustração mais se paga. Uma tela que diz apenas "nada
 * aqui" parece defeito; a mesma tela com uma forma desenhada parece um estado
 * previsto pelo produto. A diferença é entre o usuário achar que o app quebrou
 * e ele entender que chegou ao fim da lista.
 *
 * Todos os spots são desenhados no mesmo círculo de fundo e com a mesma
 * espessura de traço, pela razão de sempre: precisam parecer um conjunto.
 */

import { memo, useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useTheme } from '../ThemeProvider';
import { alpha, mix } from '../color';
import { svgId } from './primitives';

export type SpotName =
  /** Lista vazia, nada a mostrar ainda. */
  | 'empty'
  /** Tudo concluído — a recompensa do fim da fila. */
  | 'done'
  /** Busca sem resultado. */
  | 'search'
  /** Conteúdo bloqueado ou indisponível offline. */
  | 'locked';

/** Traços de cada spot, sobre o círculo de fundo (viewBox 0 0 64 64). */
const STROKES: Record<SpotName, string[]> = {
  empty: [
    // Caixa aberta, vista de frente.
    'M 18 28 L 32 22 L 46 28 L 46 44 L 32 50 L 18 44 Z',
    'M 18 28 L 32 34 L 46 28',
    'M 32 34 L 32 50',
  ],
  done: [
    // Marca de verificação dentro de um arco quase fechado.
    'M 22 33 L 29 40 L 43 26',
    'M 46 22 A 17 17 0 1 0 49 32',
  ],
  search: ['M 29 29 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0', 'M 37 37 L 46 46'],
  locked: ['M 22 30 L 42 30 L 42 46 L 22 46 Z', 'M 26 30 L 26 24 A 6 6 0 0 1 38 24 L 38 30'],
};

export type SpotProps = {
  name: SpotName;
  size?: number;
  /** Cor de acento. O padrão segue a marca. */
  tone?: 'brand' | 'success' | 'muted';
  label?: string;
};

export const Spot = memo(function Spot({ name, size = 96, tone = 'brand', label }: SpotProps) {
  const theme = useTheme();
  const reactId = useId();

  const accent = {
    brand: theme.colors.brand,
    success: theme.colors.success,
    muted: theme.colors.textTertiary,
  }[tone];

  const backdrop = svgId(reactId, 'backdrop');

  // O traço não usa o acento puro: sobre o círculo tingido ele vibraria. Puxar
  // o tom para o texto primário mantém contraste sem estridência.
  const stroke = theme.isDark
    ? mix(accent, '#FFFFFF', 0.4)
    : mix(accent, theme.colors.textPrimary, 0.32);

  return (
    <View
      accessible={Boolean(label)}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      style={{ width: size, height: size }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id={backdrop} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={alpha(accent, theme.isDark ? 0.26 : 0.16)} />
            <Stop offset="1" stopColor={alpha(accent, theme.isDark ? 0.08 : 0.05)} />
          </LinearGradient>
        </Defs>

        <Circle cx="32" cy="32" r="30" fill={`url(#${backdrop})`} />

        {STROKES[name].map((d) => (
          <Path
            key={d}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
});
