import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { Palettes, type ThemePalette } from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

const MODE_KEY = 'themeMode';
// No longer used: the accent picker was removed in the Warm Academic
// redesign. Cleared once so a stale value doesn't linger.
const LEGACY_ACCENT_KEY = 'themeAccent';

type ThemePreferenceValue = {
  mode: ThemeMode;
  // The fixed brand palette for the current light/dark mode.
  palette: ThemePalette;
  isReady: boolean;
  setMode: (mode: ThemeMode) => void;
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

export function useThemePreference() {
  const value = use(ThemePreferenceContext);
  if (!value) {
    throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  }
  return value;
}

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);
  const palette = useColorScheme() === 'dark' ? Palettes.dark : Palettes.light;

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(MODE_KEY)
      .then((storedMode) => {
        if (cancelled) return;
        if (isThemeMode(storedMode)) {
          setModeState(storedMode);
          applyMode(storedMode);
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
    palette,
    isReady,
    setMode(nextMode) {
      setModeState(nextMode);
      applyMode(nextMode);
      AsyncStorage.setItem(MODE_KEY, nextMode).catch(() => undefined);
    },
  };

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}
