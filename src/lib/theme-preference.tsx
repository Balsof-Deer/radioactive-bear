import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { Appearance } from 'react-native';

import { DEFAULT_ACCENT } from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

const MODE_KEY = 'themeMode';
const ACCENT_KEY = 'themeAccent';

type ThemePreferenceValue = {
  mode: ThemeMode;
  accent: string;
  isReady: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: string) => void;
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
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([AsyncStorage.getItem(MODE_KEY), AsyncStorage.getItem(ACCENT_KEY)])
      .then(([storedMode, storedAccent]) => {
        if (cancelled) return;
        if (isThemeMode(storedMode)) {
          setModeState(storedMode);
          applyMode(storedMode);
        }
        if (storedAccent) {
          setAccentState(storedAccent);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value: ThemePreferenceValue = {
    mode,
    accent,
    isReady,
    setMode(nextMode) {
      setModeState(nextMode);
      applyMode(nextMode);
      AsyncStorage.setItem(MODE_KEY, nextMode).catch(() => undefined);
    },
    setAccent(nextAccent) {
      setAccentState(nextAccent);
      AsyncStorage.setItem(ACCENT_KEY, nextAccent).catch(() => undefined);
    },
  };

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}
