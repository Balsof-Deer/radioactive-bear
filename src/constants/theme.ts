import type { MaterialColors } from '@expo/ui/jetpack-compose';
import { Platform } from 'react-native';

/**
 * Colors come from the Material 3 color scheme that @expo/ui generates
 * natively (Android), seeded from the user's accent or their wallpaper;
 * see ThemePreferenceProvider. The app-level names below map onto M3
 * roles so existing screens keep working, and every M3 role is also
 * available directly for Material-styled components.
 */
export type ThemePalette = MaterialColors & {
  text: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  textSecondary: string;
  tint: string;
  onTint: string;
  danger: string;
};

export type ThemeColor = keyof ThemePalette;

export function paletteFromMaterial(m3: MaterialColors): ThemePalette {
  return {
    ...m3,
    text: m3.onSurface,
    background: m3.surface,
    backgroundElement: m3.surfaceContainer,
    backgroundSelected: m3.surfaceContainerHighest,
    textSecondary: m3.onSurfaceVariant,
    tint: m3.primary,
    onTint: m3.onPrimary,
    danger: m3.error,
  };
}

// Stored in place of a hex accent when the user picks wallpaper colors.
export const WALLPAPER_ACCENT = 'wallpaper';

export const DEFAULT_ACCENT = '#3c87f7';

export const ACCENT_PRESETS = [
  { label: 'Blue', value: DEFAULT_ACCENT },
  { label: 'Green', value: '#1f9d7a' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Orange', value: '#f08c1a' },
  { label: 'Pink', value: '#e0578a' },
] as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Material 3 Expressive corner-radius scale.
export const Shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  largeIncreased: 20,
  extraLarge: 28,
  extraLargeIncreased: 32,
  extraExtraLarge: 48,
  full: 9999,
} as const;

// Material 3 type scale (Roboto, Android's system font).
export const Typography = {
  displayLarge: { fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
  displayMedium: { fontSize: 45, lineHeight: 52, letterSpacing: 0 },
  displaySmall: { fontSize: 36, lineHeight: 44, letterSpacing: 0 },
  headlineLarge: { fontSize: 32, lineHeight: 40, letterSpacing: 0 },
  headlineMedium: { fontSize: 28, lineHeight: 36, letterSpacing: 0 },
  headlineSmall: { fontSize: 24, lineHeight: 32, letterSpacing: 0 },
  titleLarge: { fontSize: 22, lineHeight: 28, letterSpacing: 0 },
  titleMedium: { fontSize: 16, lineHeight: 24, letterSpacing: 0.15, fontWeight: 500 },
  titleSmall: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontWeight: 500 },
  bodyLarge: { fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
  bodyMedium: { fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  bodySmall: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  labelLarge: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontWeight: 500 },
  labelMedium: { fontSize: 12, lineHeight: 16, letterSpacing: 0.5, fontWeight: 500 },
  labelSmall: { fontSize: 11, lineHeight: 16, letterSpacing: 0.5, fontWeight: 500 },
} as const;

// Adds transparency to a palette color (#RRGGBB or #RRGGBBAA), as M3 does
// for disabled states (e.g. onSurface at 38%).
export function withAlpha(color: string, alpha: number): string {
  const hex = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color.slice(0, 7)}${hex}`;
}

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
