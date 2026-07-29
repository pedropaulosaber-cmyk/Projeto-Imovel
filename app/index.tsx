/**
 * Rota raiz — decide para onde o usuário vai.
 *
 *  - App ainda carregando → tela de carregamento mínima (a splash cobre a
 *    maior parte deste tempo).
 *  - Já tem perfil → direto para a trilha. Ninguém deveria ver marketing
 *    depois de virar usuário.
 *  - Sem perfil, na web → landing page pública.
 *  - Sem perfil, no celular → onboarding direto. Quem baixou o app já foi
 *    convencido; mostrar landing de novo seria um passo desperdiçado.
 */

import { Redirect } from 'expo-router';
import { ActivityIndicator, Platform, View } from 'react-native';

import { Button, Text, useTheme } from '@/design';
import { Landing } from '@/features/marketing/Landing';
import { useAppStore } from '@/state/app-store';

export default function Index() {
  const theme = useTheme();
  const status = useAppStore((state) => state.status);
  const error = useAppStore((state) => state.error);
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useAppStore((state) => state.bootstrap);

  if (status === 'idle' || status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator color={theme.colors.brand} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space[4],
          padding: theme.space[6],
          backgroundColor: theme.colors.background,
        }}
      >
        <Text variant="title3" align="center">
          Não conseguimos abrir seus dados
        </Text>
        <Text variant="footnote" tone="secondary" align="center">
          {error ?? 'Erro desconhecido.'}
        </Text>
        <Button label="Tentar de novo" onPress={() => void bootstrap()} />
      </View>
    );
  }

  if (profile?.onboardingCompleted) {
    return <Redirect href="/(tabs)/learn" />;
  }

  if (Platform.OS === 'web') {
    return <Landing />;
  }

  return <Redirect href="/(onboarding)/welcome" />;
}
