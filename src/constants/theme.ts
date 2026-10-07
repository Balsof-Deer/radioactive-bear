import type { MaterialColors } from '@expo/ui/jetpack-compose';
import { Platform } from 'react-native';

/**
 * "Warm Academic" palette (the DangerBear Reimagined canvas, first page),
 * as Material 3 colour roles so M3 components and the app's own components
 * share one set of names. No gradients.
 *
 * It's built in two layers: warm neutrals shared by every colour scheme
 * (ivory surfaces, near-black ink, status colours), and a small set of
 * brand roles (primary and accent) per scheme. People pick the scheme in
 * Settings: oxblood and sand by default, or navy and coral.
 *
 * Text roles are checked against 4.5:1 on the surfaces they sit on (ratios
 * noted). The accent itself is decoration and fills only; accent-coloured
 * text uses the darker `tertiary`.
 */
type SpecTokens = {
  // The scheme's accent, for fills and decoration (the Add a spot button,
  // avatars, highlights), and the text/icon colour that sits on it.
  accent: string;
  onAccent: string;
  amber: string;
  // Semantic status pills (text on its container).
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

type Roles = MaterialColors & SpecTokens;
export type ThemePalette = Roles & AppAliases;
export type ThemeColor = keyof ThemePalette;

// The roles each colour scheme sets; everything else is a shared neutral.
type BrandRoles = Pick<
  Roles,
  | 'primary'
  | 'onPrimary'
  | 'primaryContainer'
  | 'onPrimaryContainer'
  | 'inversePrimary'
  | 'surfaceTint'
  | 'tertiary'
  | 'onTertiary'
  | 'tertiaryContainer'
  | 'onTertiaryContainer'
  | 'tertiaryFixed'
  | 'tertiaryFixedDim'
  | 'onTertiaryFixed'
  | 'onTertiaryFixedVariant'
  | 'accent'
  | 'onAccent'
>;

type Neutrals = Omit<Roles, keyof BrandRoles>;

const lightNeutrals: Neutrals = {
  secondary: '#5e5d59',
  onSecondary: '#ffffff',
  secondaryContainer: '#f0eee6',
  onSecondaryContainer: '#141413',
  background: '#faf9f5', // ivory
  onBackground: '#141413',
  surface: '#faf9f5',
  onSurface: '#141413', // near-black ink, 17.5:1
  surfaceVariant: '#f0eee6',
  onSurfaceVariant: '#5e5d59', // 6.3:1 on ivory
  inverseSurface: '#141413',
  inverseOnSurface: '#faf9f5',
  error: '#9c3a2a',
  onError: '#ffffff',
  errorContainer: '#f6e0db',
  onErrorContainer: '#8a2e20',
  outline: '#8a877e',
  outlineVariant: '#e3dfd4', // hairlines and card borders
  scrim: '#000000',
  surfaceBright: '#faf9f5',
  surfaceDim: '#e8e5db',
  surfaceContainer: '#ffffff', // cards, list groups
  surfaceContainerHigh: '#f0eee6',
  surfaceContainerHighest: '#e8e5db',
  surfaceContainerLow: '#f5f4ee',
  surfaceContainerLowest: '#ffffff',
  primaryFixed: '#f0eee6',
  primaryFixedDim: '#e3dfd4',
  onPrimaryFixed: '#141413',
  onPrimaryFixedVariant: '#3d3d3a',
  secondaryFixed: '#f0eee6',
  secondaryFixedDim: '#e3dfd4',
  onSecondaryFixed: '#141413',
  onSecondaryFixedVariant: '#5e5d59',
  amber: '#6b4e0e', // map "New" pin text
  statusGood: '#2f5a35',
  statusGoodContainer: '#e1ebdd',
  statusModerate: '#6b4e0e',
  statusModerateContainer: '#f5ebd3',
  statusBusy: '#8a2e20',
  statusBusyContainer: '#f6e0db',
  verified: '#2f5a35',
  textTertiary: '#8a877e', // 3.4:1: placeholders and inactive icons only
};

const darkNeutrals: Neutrals = {
  secondary: '#b7b4aa',
  onSecondary: '#262624',
  secondaryContainer: '#2b2a28',
  onSecondaryContainer: '#faf9f5',
  background: '#141413',
  onBackground: '#faf9f5',
  surface: '#141413',
  onSurface: '#faf9f5',
  surfaceVariant: '#2b2a28',
  onSurfaceVariant: '#b7b4aa', // 8.9:1 on the canvas
  inverseSurface: '#faf9f5',
  inverseOnSurface: '#141413',
  error: '#f2a493',
  onError: '#4a120a',
  errorContainer: '#5c1f14',
  onErrorContainer: '#f6e0db',
  outline: '#8a877e',
  outlineVariant: '#3d3d3a',
  scrim: '#000000',
  surfaceBright: '#3d3d3a',
  surfaceDim: '#0e0e0d',
  surfaceContainer: '#1f1e1d',
  surfaceContainerHigh: '#2b2a28',
  surfaceContainerHighest: '#353431',
  surfaceContainerLow: '#1a1918',
  surfaceContainerLowest: '#0e0e0d',
  primaryFixed: '#f0eee6',
  primaryFixedDim: '#e3dfd4',
  onPrimaryFixed: '#141413',
  onPrimaryFixedVariant: '#3d3d3a',
  secondaryFixed: '#f0eee6',
  secondaryFixedDim: '#e3dfd4',
  onSecondaryFixed: '#141413',
  onSecondaryFixedVariant: '#5e5d59',
  amber: '#e8c77a',
  statusGood: '#a9cfa0',
  statusGoodContainer: '#1e3320',
  statusModerate: '#e8c77a',
  statusModerateContainer: '#3a2f14',
  statusBusy: '#f2a493',
  statusBusyContainer: '#4a1e16',
  verified: '#a9cfa0',
  textTertiary: '#8a877e', // 5.1:1 on the canvas
};

export type ColorSchemeName = 'oxblood' | 'navy';

export const DEFAULT_COLOR_SCHEME: ColorSchemeName = 'oxblood';

type SchemeDefinition = {
  label: string;
  // Shown on the Settings swatches.
  swatches: { primary: string; accent: string };
  light: BrandRoles;
  dark: BrandRoles;
};

export const ColorSchemes: Record<ColorSchemeName, SchemeDefinition> = {
  oxblood: {
    label: 'Oxblood and sand',
    swatches: { primary: '#6b2230', accent: '#c9a66b' },
    light: {
      primary: '#6b2230', // oxblood, 10.5:1 on ivory
      onPrimary: '#ffffff',
      primaryContainer: '#f5dfe2',
      onPrimaryContainer: '#5a1a26', // 10.3:1
      inversePrimary: '#e8aeb8',
      surfaceTint: '#6b2230',
      tertiary: '#7a5a22', // dark sand, for accent text and links, 6.0:1
      onTertiary: '#ffffff',
      tertiaryContainer: '#f3e8d3',
      onTertiaryContainer: '#5c4416', // 7.5:1
      tertiaryFixed: '#f3e8d3',
      tertiaryFixedDim: '#c9a66b',
      onTertiaryFixed: '#3a2a0e',
      onTertiaryFixedVariant: '#5c4416',
      accent: '#c9a66b', // sand
      onAccent: '#3a2a0e', // 6.0:1
    },
    dark: {
      primary: '#e8aeb8', // light rose, 9.8:1 on the canvas
      onPrimary: '#4a1019', // 8.1:1
      primaryContainer: '#5a1a26',
      onPrimaryContainer: '#f5dfe2', // 10.3:1
      inversePrimary: '#6b2230',
      surfaceTint: '#e8aeb8',
      tertiary: '#e0c38e', // 10.9:1
      onTertiary: '#3a2a0e',
      tertiaryContainer: '#4a3a1a',
      onTertiaryContainer: '#f3e8d3', // 9.1:1
      tertiaryFixed: '#f3e8d3',
      tertiaryFixedDim: '#c9a66b',
      onTertiaryFixed: '#3a2a0e',
      onTertiaryFixedVariant: '#5c4416',
      accent: '#c9a66b',
      onAccent: '#3a2a0e',
    },
  },
  navy: {
    label: 'Navy and coral',
    swatches: { primary: '#1f3462', accent: '#e07a5f' },
    light: {
      primary: '#1f3462', // navy, 11.6:1 on ivory
      onPrimary: '#ffffff',
      primaryContainer: '#dce3f2',
      onPrimaryContainer: '#142448', // 11.9:1
      inversePrimary: '#b0c6ff',
      surfaceTint: '#1f3462',
      tertiary: '#a8452b', // dark coral, for accent text and links, 5.6:1
      onTertiary: '#ffffff',
      tertiaryContainer: '#f9e0d8',
      onTertiaryContainer: '#7a2e1a', // 7.5:1
      tertiaryFixed: '#f9e0d8',
      tertiaryFixedDim: '#e07a5f',
      onTertiaryFixed: '#3a140a',
      onTertiaryFixedVariant: '#7a2e1a',
      accent: '#e07a5f', // coral
      onAccent: '#3a140a', // 5.5:1
    },
    dark: {
      primary: '#b0c6ff', // 10.9:1 on the canvas
      onPrimary: '#162e60', // 7.8:1
      primaryContainer: '#2f4677',
      onPrimaryContainer: '#d8e2ff', // 7.2:1
      inversePrimary: '#1f3462',
      surfaceTint: '#b0c6ff',
      tertiary: '#f0a58f', // 9.2:1
      onTertiary: '#3a140a',
      tertiaryContainer: '#5a2a1c',
      onTertiaryContainer: '#f9e0d8', // 9.4:1
      tertiaryFixed: '#f9e0d8',
      tertiaryFixedDim: '#e07a5f',
      onTertiaryFixed: '#3a140a',
      onTertiaryFixedVariant: '#7a2e1a',
      accent: '#e07a5f',
      onAccent: '#3a140a',
    },
  },
};

function withAliases(roles: Roles): ThemePalette {
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

// Every scheme in both modes, ready to use: Palettes.oxblood.dark etc.
export const Palettes = Object.fromEntries(
  (Object.keys(ColorSchemes) as ColorSchemeName[]).map((name) => [
    name,
    {
      light: withAliases({ ...lightNeutrals, ...ColorSchemes[name].light }),
      dark: withAliases({ ...darkNeutrals, ...ColorSchemes[name].dark }),
    },
  ])
) as Record<ColorSchemeName, { light: ThemePalette; dark: ThemePalette }>;

// Source Serif 4 for titles and DM Sans for everything else, loaded in the
// root layout. Android picks weights by family name, so each weight is its
// own family.
export const Font = {
  serif: 'SourceSerif4_400Regular',
  serifSemiBold: 'SourceSerif4_600SemiBold',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
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

// Warm Academic type scale: a light serif for screen titles, a heavier serif
// for section headers, DM Sans for the rest.
export const Typography = {
  display: { fontFamily: Font.serif, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  heading2: { fontFamily: Font.serifSemiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  heading3: { fontFamily: Font.semiBold, fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  bodyLarge: { fontFamily: Font.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  bodyMedium: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  bodyMediumBold: { fontFamily: Font.semiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  labelSmall: { fontFamily: Font.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
  micro: { fontFamily: Font.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.3 },
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

// Warm Academic corner radii: soft cards, fully round buttons and pills.
export const Radius = {
  xs: 4, // inner corners of grouped rows
  sm: 10, // chips, status pills
  md: 16, // inputs, thumbnails
  lg: 20, // cards, list groups
  xl: 28, // sheets, dialogs
  full: 9999,
} as const;

// Soft warm shadows (React Native `boxShadow`, new architecture).
export const Elevation = {
  level1: '0px 1px 3px rgba(20, 20, 19, 0.06), 0px 1px 2px rgba(20, 20, 19, 0.04)',
  level2: '0px 6px 20px rgba(20, 20, 19, 0.14)',
  level3: '0px -8px 30px rgba(20, 20, 19, 0.08)',
} as const;

// Adds transparency to a palette color (#RRGGBB or #RRGGBBAA), as M3 does
// for state layers and disabled states (e.g. onSurface at 38%).
export function withAlpha(color: string, alpha: number): string {
  const hex = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color.slice(0, 7)}${hex}`;
}

export const MaxContentWidth = 800;
