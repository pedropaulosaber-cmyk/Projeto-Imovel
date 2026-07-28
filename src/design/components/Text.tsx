/**
 * Primitiva de texto do Lumo.
 *
 * Todo texto do app passa por aqui. Isso garante que:
 *  - nenhum tamanho de fonte solto entre no código (só variantes da escala);
 *  - a cor venha sempre de um token semântico;
 *  - o ajuste de fonte do sistema seja respeitado de forma controlada.
 */

import { memo } from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '../ThemeProvider';
import type { typography } from '../tokens';

export type TextVariant = keyof typeof typography;

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'brand'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'streak'
  | 'premium'
  | 'onBrand'
  | 'disabled';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  /** Sobrescreve o peso da variante sem sair da escala de pesos. */
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  /** Deixa o texto ocupar o espaço disponível em uma linha flex. */
  flex?: boolean;
};

export const Text = memo(function Text({
  variant = 'body',
  tone = 'primary',
  weight,
  align,
  flex,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();

  const toneColor: Record<TextTone, string> = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    tertiary: theme.colors.textTertiary,
    brand: theme.colors.brand,
    success: theme.colors.success,
    danger: theme.colors.danger,
    warning: theme.colors.warning,
    info: theme.colors.info,
    streak: theme.colors.streak,
    premium: theme.colors.premium,
    onBrand: theme.colors.onBrand,
    disabled: theme.colors.textDisabled,
  };

  const base = theme.typography[variant] ?? theme.typography.body!;

  return (
    <RNText
      // Limita o quanto o ajuste de acessibilidade pode esticar o texto.
      // Deixar ilimitado quebra layouts de exercício; desligar seria hostil
      // com quem precisa de fonte maior. 1.6x é o meio-termo testado.
      maxFontSizeMultiplier={1.6}
      style={[
        {
          fontFamily: theme.fontFamily.sans,
          fontSize: base.fontSize,
          lineHeight: base.lineHeight,
          fontWeight: weight ?? base.fontWeight,
          letterSpacing: base.letterSpacing,
          textTransform: base.textTransform,
          color: toneColor[tone],
          textAlign: align,
          flex: flex ? 1 : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
});
