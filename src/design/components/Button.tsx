/**
 * Botão do Lumo.
 *
 * Cinco variantes cobrem todo o app. Se uma tela "precisa" de uma sexta,
 * quase sempre o problema é a hierarquia da tela, não a falta de variante.
 */

import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { ActivityIndicator, type StyleProp, View, type ViewStyle } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { type HapticStyle, Touchable } from './Pressable';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Nome de ícone Ionicons exibido antes do texto. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Ícone exibido depois do texto. */
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  /** Ocupa toda a largura disponível — padrão para CTAs na zona do polegar. */
  fullWidth?: boolean;
  haptic?: HapticStyle;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const SIZE_SPEC: Record<ButtonSize, { height: number; paddingH: number; gap: number }> = {
  sm: { height: 38, paddingH: 14, gap: 6 },
  md: { height: 48, paddingH: 20, gap: 8 },
  lg: { height: 56, paddingH: 24, gap: 10 },
};

export const Button = memo(function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = 'medium',
  style,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const spec = SIZE_SPEC[size];

  const surface: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.colors.brand, fg: theme.colors.onBrand, border: theme.colors.brand },
    secondary: {
      bg: theme.colors.surfaceRaised,
      fg: theme.colors.textPrimary,
      border: theme.colors.border,
    },
    ghost: { bg: 'transparent', fg: theme.colors.brand, border: 'transparent' },
    danger: { bg: theme.colors.danger, fg: theme.colors.onDanger, border: theme.colors.danger },
    success: {
      bg: theme.colors.success,
      fg: theme.colors.onSuccess,
      border: theme.colors.success,
    },
  };

  const { bg, fg, border } = surface[variant];
  const isInert = disabled || loading;

  const textVariant = size === 'lg' ? 'headline' : size === 'sm' ? 'subhead' : 'headline';

  return (
    <Touchable
      onPress={onPress}
      disabled={isInert}
      haptic={isInert ? 'none' : haptic}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInert, busy: loading }}
      style={[
        {
          height: spec.height,
          paddingHorizontal: spec.paddingH,
          borderRadius: theme.radius.pill,
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: border,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        // Sombra apenas na ação primária: é o único botão que deve "flutuar".
        variant === 'primary' && !isInert
          ? { ...theme.elevation.sm, shadowColor: theme.colors.brand, shadowOpacity: 0.28 }
          : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spec.gap }}>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={fg} /> : null}
          <Text variant={textVariant} style={{ color: fg }} numberOfLines={1}>
            {label}
          </Text>
          {iconRight ? (
            <Ionicons name={iconRight} size={size === 'sm' ? 16 : 19} color={fg} />
          ) : null}
        </View>
      )}
    </Touchable>
  );
});
