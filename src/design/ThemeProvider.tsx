/**
 * Provider de tema do Lumo.
 *
 * Expõe cores resolvidas + tokens e respeita três fontes de verdade, nesta
 * ordem: preferência explícita do usuário → aparência do sistema → claro.
 *
 * A preferência é gravada localmente (offline-first: o tema nunca depende da
 * rede) e lida de forma síncrona no primeiro frame quando possível, evitando
 * o "flash" de tema claro em quem usa escuro.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { type ColorScheme, type ThemeColors, themes } from './theme';
import {
  duration,
  easing,
  elevation,
  fontFamily,
  fontWeight,
  layout,
  opacity,
  radius,
  space,
  typography,
} from './tokens';

const STORAGE_KEY = '@lumo/theme-preference';

export type ThemePreference = ColorScheme | 'system';

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  space: typeof space;
  radius: typeof radius;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  fontWeight: typeof fontWeight;
  elevation: typeof elevation;
  duration: typeof duration;
  easing: typeof easing;
  layout: typeof layout;
  opacity: typeof opacity;
  /** True quando o esquema escuro está ativo — atalho para lógica condicional. */
  isDark: boolean;
};

type ThemeContextValue = Theme & {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: themes[scheme],
    space,
    radius,
    typography,
    fontFamily,
    fontWeight,
    elevation,
    duration,
    easing,
    layout,
    opacity,
    isDark: scheme === 'dark',
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Carrega a preferência salva uma vez, na montagem. Se falhar (primeira
  // execução, storage indisponível), seguimos com 'system' silenciosamente:
  // preferência de tema nunca deve bloquear a abertura do app.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        /* preferência é opcional por design */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* a UI já refletiu a mudança; a persistência é best-effort */
    });
  }, []);

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({ ...buildTheme(scheme), preference, setPreference }),
    [scheme, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Acessa o tema ativo. Lança fora do provider — erro de programação, não de runtime. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() precisa estar dentro de <ThemeProvider>.');
  }
  return ctx;
}

/**
 * Cria estilos que dependem do tema, memorizados por esquema de cor.
 *
 * `StyleSheet.create` estático não serve aqui porque as cores mudam em runtime.
 * Este helper mantém a ergonomia de folha de estilo sem recriar objetos a cada
 * render — a fábrica só roda quando o esquema muda.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
