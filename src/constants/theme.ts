import type { MaterialColors } from '@expo/ui/jetpack-compose';
import { Platform } from 'react-native';

/**
 * "Warm Academic Tactile" palette (the user's StudyNook DESIGN.md),
 * mapped onto Material 3 colour roles so M3 Expressive components and
 * the app's own components share one set of names.
 *
 * Values marked "derived" aren't in the spec: either the spec's colour
 * fails its own 4.5:1 text-contrast rule (checked, ratios noted), or the
 * spec doesn't define that role (all dark-theme roles beyond its three
 * dark values). They're here for the user to review.
 */
type SpecTokens = {
  // Spec accents, for graphics and decoration rather than text.
  terracotta: string;
  amber: string;
  // Spec semantic status pills (text on its container).
  statusGood: string;
  statusGoodContainer: string;
  statusModerate: string;
  statusModerateContainer: string;
  statusBusy: string;
  statusBusyContainer: string;
  verified: string;
  textTertiary: string;
};

type AppAliases = {
  text: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  textSecondary: string;
  tint: string;
  onTint: string;
  danger: string;
};

export type ThemePalette = MaterialColors & SpecTokens & AppAliases;
export type ThemeColor = keyof ThemePalette;

// The seed native @expo/ui components use to generate any colours they
// don't take explicitly (e.g. disabled states): the spec's forest green.
export const BRAND_SEED = '#2d4a34';

const light: MaterialColors & SpecTokens = {
  primary: '#2d4a34', // spec color-primary
  onPrimary: '#ffffff',
  primaryContainer: '#e8efe9', // spec sage
  onPrimaryContainer: '#1c3322', // spec
  inversePrimary: '#a9c9ae', // derived
  secondary: '#635b54', // spec walnut
  onSecondary: '#ffffff',
  // Tonal (secondary) buttons use sage so they read on both oat and white.
  secondaryContainer: '#e8efe9',
  onSecondaryContainer: '#1c3322',
  tertiary: '#a4472d', // derived terracotta for text: 5.68:1 (spec #e07a5f is 2.81:1)
  onTertiary: '#ffffff',
  tertiaryContainer: '#fceee8', // spec busy pill background
  onTertiaryContainer: '#7a2e1a', // derived
  background: '#fff8f4', // spec oat surface
  onBackground: '#231f1d', // spec espresso
  surface: '#fff8f4',
  onSurface: '#231f1d',
  surfaceVariant: '#f9f0e8', // spec surface-container-low
  onSurfaceVariant: '#635b54', // spec walnut, 6.33:1
  surfaceTint: '#2d4a34',
  inverseSurface: '#231f1d',
  inverseOnSurface: '#f5ede4',
  error: '#b3401f', // derived brick: 5.45:1 on oat, white text 5.72:1
  onError: '#ffffff',
  errorContainer: '#fceee8',
  onErrorContainer: '#7a2e1a',
  outline: '#948b82', // spec stone, 3.35:1 (UI components need 3:1)
  outlineVariant: '#eee2d6', // spec border
  scrim: '#000000',
  surfaceBright: '#fff8f4',
  surfaceDim: '#eee2d6',
  surfaceContainer: '#ffffff', // spec cards and sheets
  surfaceContainerHigh: '#f3e9df', // derived, between low and highest
  surfaceContainerHighest: '#eee2d6', // spec surface-container-high
  surfaceContainerLow: '#f9f0e8', // spec
  surfaceContainerLowest: '#ffffff',
  primaryFixed: '#e8efe9',
  primaryFixedDim: '#c5d6c8', // derived
  onPrimaryFixed: '#1c3322',
  onPrimaryFixedVariant: '#2d4a34',
  secondaryFixed: '#f9f0e8',
  secondaryFixedDim: '#eee2d6',
  onSecondaryFixed: '#231f1d',
  onSecondaryFixedVariant: '#635b54',
  tertiaryFixed: '#fceee8',
  tertiaryFixedDim: '#f5c9b8', // derived
  onTertiaryFixed: '#5a2213', // derived
  onTertiaryFixedVariant: '#8a3a24', // derived
  terracotta: '#e07a5f',
  amber: '#f4a261',
  statusGood: '#2d6a4f', // spec, 5.72:1
  statusGoodContainer: '#eaf5ee',
  statusModerate: '#8f6512', // derived: 4.89:1 (spec #b07d1a is 3.41:1)
  statusModerateContainer: '#fdf8e6',
  statusBusy: '#a8481b', // derived: 5.14:1 (spec #c05621 is 4.03:1)
  statusBusyContainer: '#fceee8',
  verified: '#1d7042',
  textTertiary: '#948b82', // spec stone: large text / placeholders only (3.19:1)
};

// Spec gives canvas #161a17, card #1f2420 and text #f5ede4; the rest is derived.
const dark: MaterialColors & SpecTokens = {
  primary: '#a9c9ae', // 9.76:1 on canvas
  onPrimary: '#13301c', // 7.94:1
  primaryContainer: '#2d4a34',
  onPrimaryContainer: '#d3e5d6', // 7.45:1
  inversePrimary: '#2d4a34',
  secondary: '#c9bfb4',
  onSecondary: '#2e2823',
  secondaryContainer: '#2f3d33',
  onSecondaryContainer: '#d3e5d6',
  tertiary: '#f0a07e',
  onTertiary: '#4a1c0c',
  tertiaryContainer: '#3d2319',
  onTertiaryContainer: '#ffdbd0',
  background: '#161a17', // spec
  onBackground: '#f5ede4', // spec
  surface: '#161a17',
  onSurface: '#f5ede4',
  surfaceVariant: '#272d28',
  onSurfaceVariant: '#c9bfb4', // 8.71:1 on card
  surfaceTint: '#a9c9ae',
  inverseSurface: '#f5ede4',
  inverseOnSurface: '#231f1d',
  error: '#ffb4a1', // 10.30:1
  onError: '#5c1a0a', // 7.65:1
  errorContainer: '#7a2e1a',
  onErrorContainer: '#ffdbd0',
  outline: '#8f877e', // 4.46:1 on card
  outlineVariant: '#3a403b',
  scrim: '#000000',
  surfaceBright: '#313832',
  surfaceDim: '#111412',
  surfaceContainer: '#1f2420', // spec card
  surfaceContainerHigh: '#272d28',
  surfaceContainerHighest: '#313832',
  surfaceContainerLow: '#1a1e1b',
  surfaceContainerLowest: '#111412',
  primaryFixed: '#e8efe9',
  primaryFixedDim: '#c5d6c8',
  onPrimaryFixed: '#1c3322',
  onPrimaryFixedVariant: '#2d4a34',
  secondaryFixed: '#f9f0e8',
  secondaryFixedDim: '#eee2d6',
  onSecondaryFixed: '#231f1d',
  onSecondaryFixedVariant: '#635b54',
  tertiaryFixed: '#fceee8',
  tertiaryFixedDim: '#f5c9b8',
  onTertiaryFixed: '#5a2213',
  onTertiaryFixedVariant: '#8a3a24',
  terracotta: '#e07a5f',
  amber: '#f4a261', // 8.53:1 on canvas
  statusGood: '#8fd1a8', // 7.63:1
  statusGoodContainer: '#1d3326',
  statusModerate: '#e6c170', // 7.56:1
  statusModerateContainer: '#3a3019',
  statusBusy: '#f0a07e', // 6.91:1
  statusBusyContainer: '#3d2319',
  verified: '#8fd1a8',
  textTertiary: '#948b82', // 5.25:1 on canvas
};

function withAliases(roles: MaterialColors & SpecTokens): ThemePalette {
  return {
    ...roles,
    text: roles.onSurface,
    background: roles.surface,
    backgroundElement: roles.surfaceContainer,
    backgroundSelected: roles.surfaceContainerHighest,
    textSecondary: roles.onSurfaceVariant,
    tint: roles.primary,
    onTint: roles.onPrimary,
    danger: roles.error,
  };
}

export const Palettes = {
  light: withAliases(light),
  dark: withAliases(dark),
} as const;

// Epilogue, loaded in the root layout. Android picks weights by family
// name, so each weight is its own family.
export const Font = {
  regular: 'Epilogue_400Regular',
  medium: 'Epilogue_500Medium',
  semiBold: 'Epilogue_600SemiBold',
  bold: 'Epilogue_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

// Spec mobile type scale (letter spacing converted from em to px).
export const Typography = {
  display: { fontFamily: Font.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.48 },
  heading2: { fontFamily: Font.semiBold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  heading3: { fontFamily: Font.semiBold, fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  bodyLarge: { fontFamily: Font.regular, fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  bodyMedium: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  bodyMediumBold: { fontFamily: Font.semiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  labelSmall: { fontFamily: Font.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.24 },
  micro: { fontFamily: Font.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.33 },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Spec corner radii. Buttons and chips are fully round (M3 Expressive and
// the spec agree there).
export const Radius = {
  sm: 6, // micro data tags
  md: 10, // inputs, spec pills, thumbnails
  lg: 16, // cards, dialogs
  xl: 24, // sheets (the sidebar panel, bottom sheets)
  full: 9999,
} as const;

// Spec warm shadows (React Native `boxShadow`, new architecture).
export const Elevation = {
  level1: '0px 1px 3px rgba(35, 31, 29, 0.06), 0px 1px 2px rgba(35, 31, 29, 0.04)',
  level2: '0px 4px 12px rgba(35, 31, 29, 0.08)',
  level3: '0px -4px 24px rgba(35, 31, 29, 0.12)',
} as const;

// Adds transparency to a palette color (#RRGGBB or #RRGGBBAA), as M3 does
// for state layers and disabled states (e.g. onSurface at 38%).
export function withAlpha(color: string, alpha: number): string {
  const hex = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color.slice(0, 7)}${hex}`;
}

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
