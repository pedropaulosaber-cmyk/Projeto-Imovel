/**
 * Raiz da aplicação.
 *
 * Monta os provedores na ordem certa e faz o bootstrap offline-first: abre o
 * banco, semeia o conteúdo e carrega o usuário — tudo local, tudo sem rede.
 * A splash só sai quando há algo real para mostrar, o que evita o "flash" de
 * tela vazia que faz um app parecer lento mesmo sendo rápido.
 */

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import type React from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from '@/design';
import { useAppStore } from '@/state/app-store';
import { useSyncBootstrap } from '@/sync/useSyncBootstrap';

// Mantém a splash até o bootstrap terminar. O `catch` cobre o caso da
// splash já ter sido dispensada por um recarregamento em desenvolvimento.
void SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const theme = useTheme();
  const status = useAppStore((state) => state.status);

  useEffect(() => {
    if (status === 'ready' || status === 'error') {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [status]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          // Transição horizontal padrão de plataforma; em telas modais
          // sobrescrevemos por rota.
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="lesson/[id]"
          options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
        />
        <Stack.Screen name="review" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="paywall" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="downloads" />
        <Stack.Screen name="workbooks" />
        <Stack.Screen name="workbook/[id]" />
        <Stack.Screen name="idioms" />
        <Stack.Screen name="level" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="learning-mode" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </View>
  );
}

function Bootstrapper({ children }: { children: React.ReactNode }) {
  const bootstrap = useAppStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Liga o motor de sincronização assim que o app monta. Ele é inerte
  // enquanto não houver transporte configurado — a fila apenas acumula.
  useSyncBootstrap();

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Bootstrapper>
            <RootNavigator />
          </Bootstrapper>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
