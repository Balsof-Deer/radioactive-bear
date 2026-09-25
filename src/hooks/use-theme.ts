import type { ThemePalette } from '@/constants/theme';
import { useThemePreference } from '@/lib/theme-preference';

export function useTheme(): ThemePalette {
  return useThemePreference().palette;
}
