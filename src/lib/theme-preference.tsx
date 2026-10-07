import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import {
  ColorSchemes,
  DEFAULT_COLOR_SCHEME,
  Palettes,
  type ColorSchemeName,
  type ThemePalette,
} from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

const MODE_KEY = 'themeMode';
const COLOR_SCHEME_KEY = 'themeColorScheme';
// No longer used: the old free accent picker. Cleared once so a stale value
// doesn't linger.
const LEGACY_ACCENT_KEY = 'themeAccent';

type ThemePreferenceValue = {
  mode: ThemeMode;
  // The chosen primary/accent pair (Settings > Appearance).
  colorScheme: ColorSchemeName;
  // That scheme's palette for the current light/dark mode.
  palette: ThemePalette;
  isReady: boolean;
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (colorScheme: ColorSchemeName) => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceValue | null>(null);

// Overriding Appearance (rather than threading a scheme through every
// component) makes every useColorScheme() in the app, plus native pieces
// like Switch and the keyboard, follow the user's choice.
function applyMode(mode: ThemeMode) {
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isColorSchemeName(value: string | null): value is ColorSchemeName {
  return value !== null && value in ColorSchemes;
}

export function useThemePreference() {
  const value = use(ThemePreferenceContext);
  if (!value) {
    throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  }
  return value;
}

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [colorScheme, setColorSchemeState] = useState<ColorSchemeName>(DEFAULT_COLOR_SCHEME);
  const [isReady, setIsReady] = useState(false);
  const palettes = Palettes[colorScheme];
  const palette = useColorScheme() === 'dark' ? palettes.dark : palettes.light;

  useEffect(() => {
    let cancelled = false;

    Promise.all([AsyncStorage.getItem(MODE_KEY), AsyncStorage.getItem(COLOR_SCHEME_KEY)])
      .then(([storedMode, storedColorScheme]) => {
        if (cancelled) return;
        if (isThemeMode(storedMode)) {
          setModeState(storedMode);
          applyMode(storedMode);
        }
        if (isColorSchemeName(storedColorScheme)) {
          setColorSchemeState(storedColorScheme);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    AsyncStorage.removeItem(LEGACY_ACCENT_KEY).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const value: ThemePreferenceValue = {
    mode,
    colorScheme,
    palette,
    isReady,
    setMode(nextMode) {
      setModeState(nextMode);
      applyMode(nextMode);
      AsyncStorage.setItem(MODE_KEY, nextMode).catch(() => undefined);
    },
    setColorScheme(nextColorScheme) {
      setColorSchemeState(nextColorScheme);
      AsyncStorage.setItem(COLOR_SCHEME_KEY, nextColorScheme).catch(() => undefined);
    },
  };

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}
