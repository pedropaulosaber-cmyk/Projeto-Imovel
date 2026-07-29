/**
 * Superfície pressionável com a microinteração padrão do Lumo.
 *
 * Toda área tocável do app usa este componente, o que garante três coisas de
 * uma vez: escala de pressão consistente, feedback háptico consistente e alvo
 * de toque mínimo garantido.
 *
 * A animação roda em `react-native-reanimated`, ou seja, na thread de UI —
 * a resposta ao toque não trava nem quando a thread JS está ocupada corrigindo
 * um exercício. É esta escolha que sustenta a promessa de 60fps.
 */

import * as Haptics from 'expo-haptics';
import { type ReactNode, memo, useCallback } from 'react';
import {
  Platform,
  type PressableProps,
  Pressable as RNPressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type WithTimingConfig,
} from 'react-native-reanimated';

import { useTheme } from '../ThemeProvider';
import { layout } from '../tokens';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export type HapticStyle = 'none' | 'light' | 'medium' | 'success' | 'warning' | 'error';

export type TouchableProps = Omit<PressableProps, 'style'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Quanto o elemento encolhe ao ser pressionado. 1 desliga a escala. */
  pressedScale?: number;
  /** Opacidade no estado pressionado. */
  pressedOpacity?: number;
  haptic?: HapticStyle;
  /** Garante o alvo mínimo de toque de 44pt mesmo com conteúdo pequeno. */
  ensureTouchTarget?: boolean;
};

function triggerHaptic(style: HapticStyle) {
  // Háptico é enfeite: em web não existe e uma falha jamais pode
  // impedir o `onPress` de rodar.
  if (style === 'none' || Platform.OS === 'web') return;
  try {
    switch (style) {
      case 'light':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'success':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    /* dispositivo sem motor háptico */
  }
}

export const Touchable = memo(function Touchable({
  children,
  style,
  pressedScale = 0.97,
  pressedOpacity = 0.9,
  haptic = 'light',
  ensureTouchTarget = true,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: TouchableProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  // `duration` é um número primitivo estável, não um objeto recriado a cada
  // render. Extraí-lo assim mantém os callbacks abaixo com dependências
  // completas e honestas — sem precisar suprimir a regra de exaustividade.
  const pressDuration = theme.duration.instant;

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (event) => {
      const timing: WithTimingConfig = { duration: pressDuration };
      progress.value = withTiming(1, timing);
      triggerHaptic(haptic);
      onPressIn?.(event);
    },
    [haptic, onPressIn, pressDuration, progress],
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      const timing: WithTimingConfig = { duration: pressDuration };
      progress.value = withTiming(0, timing);
      onPressOut?.(event);
    },
    [onPressOut, pressDuration, progress],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - pressedScale) * progress.value }],
    opacity: 1 - (1 - pressedOpacity) * progress.value,
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      // Expande a área tocável sem mexer no layout visual — essencial para
      // ícones pequenos em uso com uma mão.
      hitSlop={ensureTouchTarget ? 8 : undefined}
      style={[
        ensureTouchTarget ? { minHeight: layout.minTouchTarget } : null,
        disabled ? { opacity: theme.opacity.disabled } : null,
        style,
        animatedStyle,
      ]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
});
