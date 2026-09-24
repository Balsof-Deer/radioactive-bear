/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type ThemePalette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { readableTextOn } from '@/lib/color';
import { useThemePreference } from '@/lib/theme-preference';

export function useTheme(): ThemePalette {
  const scheme = useColorScheme();
  const { accent } = useThemePreference();
  const base = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return { ...base, tint: accent, onTint: readableTextOn(accent) };
}
