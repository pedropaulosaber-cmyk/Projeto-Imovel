/**
 * Superfícies: Card, Screen, Divider, Skeleton.
 *
 * `Screen` é o container obrigatório de toda rota. Ele resolve, num só lugar,
 * três problemas que costumam ser resolvidos de forma inconsistente:
 * safe areas, largura máxima de leitura e o respiro da zona do polegar.
 */

import { type ReactNode, memo, useEffect } from 'react';
import {
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../ThemeProvider';
import { layout } from '../tokens';

/* ------------------------------------------------------------------ *
 * Card
 * ------------------------------------------------------------------ */

export type CardProps = {
  children: ReactNode;
  /** `flat` para listas densas, `raised` para itens destacáveis. */
  variant?: 'flat' | 'raised' | 'outlined' | 'subtle';
  padding?: keyof typeof import('../tokens').space;
  style?: StyleProp<ViewStyle>;
};

export const Card = memo(function Card({
  children,
  variant = 'flat',
  padding = 4,
  style,
}: CardProps) {
  const theme = useTheme();

  const variantStyle: Record<NonNullable<CardProps['variant']>, ViewStyle> = {
    flat: {
      backgroundColor: theme.colors.surfaceRaised,
    },
    raised: {
      backgroundColor: theme.colors.surface,
      ...theme.elevation.md,
      shadowColor: theme.colors.shadow,
      // No escuro a sombra some contra o fundo; uma borda sutil assume o
      // papel de separar a camada.
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    outlined: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    subtle: {
      backgroundColor: theme.colors.brandSubtle,
      borderWidth: 1,
      borderColor: theme.colors.brandBorder,
    },
  };

  return (
    <View
      style={[
        { borderRadius: theme.radius.xl, padding: theme.space[padding] },
        variantStyle[variant],
        style,
      ]}
    >
      {children}
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Screen
 * ------------------------------------------------------------------ */

export type ScreenProps = {
  children: ReactNode;
  /** Envolve o conteúdo num ScrollView com o padding correto. */
  scroll?: boolean;
  /** Aplica o padding horizontal padrão da tela. */
  padded?: boolean;
  /** Respeita a safe area superior (desligue quando houver header nativo). */
  edgeTop?: boolean;
  edgeBottom?: boolean;
  /** Reserva espaço para uma barra de ação fixa no rodapé. */
  footerSpace?: number;
  background?: 'default' | 'sunken';
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
};

export const Screen = memo(function Screen({
  children,
  scroll = false,
  padded = true,
  edgeTop = true,
  edgeBottom = true,
  footerSpace = 0,
  background = 'default',
  style,
  contentContainerStyle,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const backgroundColor =
    background === 'sunken' ? theme.colors.surfaceSunken : theme.colors.background;

  const innerPadding: ViewStyle = {
    paddingHorizontal: padded ? layout.screenPadding : 0,
    paddingTop: edgeTop ? insets.top : 0,
    paddingBottom: (edgeBottom ? insets.bottom : 0) + footerSpace,
  };

  // Centraliza e limita a largura em telas grandes. O app é mobile-first, mas
  // rodar em tablet e web não pode significar linhas de 1200px.
  const constrain: ViewStyle = {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  };

  if (scroll) {
    return (
      <View style={[{ flex: 1, backgroundColor }, style]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[innerPadding, constrain, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // Em iOS, mantém o comportamento de rolagem elástica sem "colar"
          // o conteúdo na borda quando há teclado aberto.
          keyboardDismissMode="on-drag"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor }, style]}>
      <View style={[{ flex: 1 }, innerPadding, constrain]}>{children}</View>
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Divider
 * ------------------------------------------------------------------ */

export const Divider = memo(function Divider({ inset = 0 }: { inset?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        marginLeft: inset,
        backgroundColor: theme.colors.divider,
      }}
    />
  );
});

/* ------------------------------------------------------------------ *
 * Skeleton
 * ------------------------------------------------------------------ */

/**
 * Placeholder de carregamento pulsante.
 *
 * Num app offline-first o skeleton aparece pouco (os dados vêm do disco em
 * milissegundos), mas ele existe para a primeira sincronização e para
 * downloads de conteúdo.
 */
export const Skeleton = memo(function Skeleton({
  width = '100%',
  height = 16,
  radius: r,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
      style={[
        {
          width,
          height,
          borderRadius: r ?? theme.radius.sm,
          backgroundColor: theme.colors.skeleton,
        },
        animated,
        style,
      ]}
    />
  );
});
