/**
 * Indicadores de progresso.
 *
 * Progresso é o principal mecanismo de retenção do Lumo: o usuário precisa
 * *ver* que avançou todo dia. Por isso estes componentes são animados na
 * thread de UI e nunca "pulam" — eles transicionam do valor anterior.
 */

import type React from 'react';
import { memo, useEffect } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../ThemeProvider';
import { Text } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function clamp01(value: number): number {
  'worklet';
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/* ------------------------------------------------------------------ *
 * Barra de progresso
 * ------------------------------------------------------------------ */

export type ProgressBarProps = {
  /** Progresso de 0 a 1. Valores fora da faixa são limitados. */
  value: number;
  height?: number;
  tone?: 'brand' | 'success' | 'streak' | 'premium';
  /** Desliga a animação — útil em listas longas. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export const ProgressBar = memo(function ProgressBar({
  value,
  height = 10,
  tone = 'brand',
  animated = true,
  style,
  accessibilityLabel,
}: ProgressBarProps) {
  const theme = useTheme();
  const progress = useSharedValue(animated ? 0 : clamp01(value));

  useEffect(() => {
    const target = clamp01(value);
    progress.value = animated
      ? withTiming(target, { duration: theme.duration.normal })
      : target;
  }, [value, animated, progress, theme.duration.normal]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const toneColor = {
    brand: theme.colors.brand,
    success: theme.colors.success,
    streak: theme.colors.streak,
    premium: theme.colors.premium,
  }[tone];

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(value) * 100) }}
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.surfaceSunken,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          { height: '100%', borderRadius: height / 2, backgroundColor: toneColor },
          fillStyle,
        ]}
      />
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Anel de progresso
 * ------------------------------------------------------------------ */

export type ProgressRingProps = {
  /** Progresso de 0 a 1. */
  value: number;
  size?: number;
  thickness?: number;
  tone?: 'brand' | 'success' | 'streak' | 'premium';
  /** Conteúdo central (normalmente o número da métrica). */
  children?: React.ReactNode;
  label?: string;
};

/**
 * Anel usado na meta diária. É o elemento visual mais importante do app:
 * fechar o anel é o "momento do dia" do Lumo.
 */
export const ProgressRing = memo(function ProgressRing({
  value,
  size = 120,
  thickness = 10,
  tone = 'brand',
  children,
  label,
}: ProgressRingProps) {
  const theme = useTheme();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamp01(value), { duration: theme.duration.slow });
  }, [value, progress, theme.duration.slow]);

  const dashOffset = useDerivedValue(() => circumference * (1 - progress.value));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const toneColor = {
    brand: theme.colors.brand,
    success: theme.colors.success,
    streak: theme.colors.streak,
    premium: theme.colors.premium,
  }[tone];

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(value) * 100) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.surfaceSunken}
          strokeWidth={thickness}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={toneColor}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          // Começa o arco no topo em vez de às 3 horas.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Progresso segmentado (barra de lição)
 * ------------------------------------------------------------------ */

/**
 * Barra segmentada do topo da lição — um traço por exercício.
 *
 * Preferida à barra contínua dentro da lição porque comunica quantos
 * exercícios *faltam*, e não apenas uma porcentagem abstrata. Saber que
 * "faltam 3" é o que impede o abandono no meio.
 */
export const SegmentedProgress = memo(function SegmentedProgress({
  total,
  completed,
  style,
}: {
  total: number;
  completed: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const safeTotal = Math.max(1, total);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Exercício ${Math.min(completed + 1, safeTotal)} de ${safeTotal}`}
      style={[{ flexDirection: 'row', gap: 4 }, style]}
    >
      {Array.from({ length: safeTotal }, (_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor:
              index < completed ? theme.colors.brand : theme.colors.surfaceSunken,
          }}
        />
      ))}
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Métrica
 * ------------------------------------------------------------------ */

export const Metric = memo(function Metric({
  value,
  label,
  tone = 'primary',
}: {
  value: string | number;
  label: string;
  tone?: 'primary' | 'brand' | 'streak' | 'success';
}) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="metric" tone={tone === 'primary' ? 'primary' : tone}>
        {value}
      </Text>
      <Text variant="footnote" tone="secondary">
        {label}
      </Text>
    </View>
  );
});
