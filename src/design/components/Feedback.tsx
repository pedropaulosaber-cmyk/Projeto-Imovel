/**
 * Badge, Chip, SegmentedControl, EmptyState, ListRow.
 * Componentes de baixo nível usados por praticamente toda tela.
 */

import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, memo } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { Touchable } from './Pressable';
import { Text } from './Text';

/* ------------------------------------------------------------------ *
 * Badge
 * ------------------------------------------------------------------ */

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'streak'
  | 'premium';

export const Badge = memo(function Badge({
  label,
  tone = 'neutral',
  icon,
  style,
}: {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: theme.colors.surfaceSunken, fg: theme.colors.textSecondary },
    brand: { bg: theme.colors.brandSubtle, fg: theme.colors.brand },
    success: { bg: theme.colors.successSubtle, fg: theme.colors.success },
    danger: { bg: theme.colors.dangerSubtle, fg: theme.colors.danger },
    warning: { bg: theme.colors.warningSubtle, fg: theme.colors.warning },
    info: { bg: theme.colors.infoSubtle, fg: theme.colors.info },
    streak: { bg: theme.colors.streakSubtle, fg: theme.colors.streak },
    premium: { bg: theme.colors.premiumSubtle, fg: theme.colors.premium },
  };

  const { bg, fg } = map[tone];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: theme.radius.pill,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={13} color={fg} /> : null}
      <Text variant="caption" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Chip selecionável
 * ------------------------------------------------------------------ */

export const Chip = memo(function Chip({
  label,
  selected = false,
  icon,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <Touchable
      onPress={onPress}
      haptic="light"
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      pressedScale={0.96}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingHorizontal: 16,
          height: 42,
          borderRadius: theme.radius.pill,
          borderWidth: 1.5,
          backgroundColor: selected ? theme.colors.brandSubtle : theme.colors.surface,
          borderColor: selected ? theme.colors.brand : theme.colors.border,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? theme.colors.brand : theme.colors.textSecondary}
        />
      ) : null}
      <Text variant="subhead" tone={selected ? 'brand' : 'secondary'}>
        {label}
      </Text>
    </Touchable>
  );
});

/* ------------------------------------------------------------------ *
 * Cartão de opção (onboarding)
 * ------------------------------------------------------------------ */

/**
 * Opção grande de escolha única, usada em todo o onboarding.
 *
 * Alvo generoso e seleção com borda + fundo (não só cor de texto) porque a
 * seleção precisa ser óbvia para daltônicos e sob luz do sol.
 */
export const OptionCard = memo(function OptionCard({
  title,
  description,
  icon,
  selected = false,
  onPress,
  trailing,
}: {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Touchable
      onPress={onPress}
      haptic="light"
      pressedScale={0.985}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        padding: theme.space[4],
        borderRadius: theme.radius.xl,
        borderWidth: 2,
        backgroundColor: selected ? theme.colors.brandSubtle : theme.colors.surface,
        borderColor: selected ? theme.colors.brand : theme.colors.border,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: theme.radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? theme.colors.brand : theme.colors.surfaceSunken,
          }}
        >
          <Ionicons
            name={icon}
            size={22}
            color={selected ? theme.colors.onBrand : theme.colors.textSecondary}
          />
        </View>
      ) : null}

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="headline">{title}</Text>
        {description ? (
          <Text variant="footnote" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>

      {trailing ?? (
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={selected ? theme.colors.brand : theme.colors.borderStrong}
        />
      )}
    </Touchable>
  );
});

/* ------------------------------------------------------------------ *
 * Segmented control
 * ------------------------------------------------------------------ */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          padding: 3,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceSunken,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Touchable
            key={option.value}
            onPress={() => onChange(option.value)}
            haptic="light"
            pressedScale={0.98}
            ensureTouchTarget={false}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              height: 34,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.pill,
              backgroundColor: active ? theme.colors.surface : 'transparent',
              ...(active ? theme.elevation.sm : {}),
            }}
          >
            <Text variant="subhead" tone={active ? 'primary' : 'secondary'}>
              {option.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Estado vazio
 * ------------------------------------------------------------------ */

export const EmptyState = memo(function EmptyState({
  icon = 'sparkles-outline',
  title,
  description,
  action,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View
      style={{ alignItems: 'center', gap: theme.space[3], paddingVertical: theme.space[10] }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: theme.radius['2xl'],
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.brandSubtle,
        }}
      >
        <Ionicons name={icon} size={30} color={theme.colors.brand} />
      </View>
      <Text variant="title3" align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="callout" tone="secondary" align="center" style={{ maxWidth: 300 }}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: theme.space[2] }}>{action}</View> : null}
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Linha de lista
 * ------------------------------------------------------------------ */

export const ListRow = memo(function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  trailing,
  onPress,
  destructive = false,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();
  const tint = destructive ? theme.colors.danger : (iconColor ?? theme.colors.textSecondary);

  return (
    <Touchable
      onPress={onPress}
      disabled={!onPress}
      haptic="light"
      pressedScale={0.99}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        paddingVertical: theme.space[3],
      }}
    >
      {icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceSunken,
          }}
        >
          <Ionicons name={icon} size={17} color={tint} />
        </View>
      ) : null}

      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="callout" tone={destructive ? 'danger' : 'primary'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
        ) : null)}
    </Touchable>
  );
});
