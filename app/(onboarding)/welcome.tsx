/**
 * Boas-vindas.
 *
 * Uma tela, uma promessa, um botão. A tentação é explicar tudo aqui; a
 * conversão diz o contrário — quanto antes o usuário responde a primeira
 * pergunta, maior a chance de ele terminar o onboarding.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Button, Screen, Text, useTheme } from '@/design';

export default function Welcome() {
  const theme = useTheme();
  const router = useRouter();

  const appear = useSharedValue(0);

  useEffect(() => {
    appear.value = withTiming(1, { duration: theme.duration.slow });
  }, [appear, theme.duration.slow]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [{ scale: 0.9 + appear.value * 0.1 }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: withDelay(120, withTiming(appear.value, { duration: theme.duration.slow })),
    transform: [{ translateY: (1 - appear.value) * 16 }],
  }));

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.space[6] }}>
        <Animated.View style={logoStyle}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: theme.radius['2xl'],
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.brand,
              ...theme.elevation.lg,
              shadowColor: theme.colors.brand,
            }}
          >
            <Ionicons name="flash" size={38} color={theme.colors.onBrand} />
          </View>
        </Animated.View>

        <Animated.View style={[{ gap: theme.space[4] }, textStyle]}>
          <Text variant="display">Lumo</Text>
          <Text variant="title3" tone="secondary" style={{ maxWidth: 340 }}>
            Fluência, um dia de cada vez.
          </Text>
          <Text variant="body" tone="secondary" style={{ maxWidth: 360 }}>
            Vamos montar seu plano de estudos em cinco perguntas rápidas. Sem cadastro, sem
            cartão — você já começa a estudar hoje.
          </Text>
        </Animated.View>
      </View>

      {/* CTA na zona do polegar: o app é usado com uma mão só. */}
      <View style={{ gap: theme.space[3], paddingBottom: theme.space[4] }}>
        <Button
          label="Vamos começar"
          size="lg"
          fullWidth
          icon="arrow-forward"
          onPress={() => router.push('/(onboarding)/setup')}
        />
        <Text variant="caption" tone="tertiary" align="center">
          Leva menos de 2 minutos.
        </Text>
      </View>
    </Screen>
  );
}
