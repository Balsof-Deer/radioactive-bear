import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { PillGroup } from '@/components/pill-group';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ColorSchemes, Radius, Spacing, Typography, withAlpha, type ColorSchemeName } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference, type ThemeMode } from '@/lib/theme-preference';

const MODES: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const SCHEME_NAMES = Object.keys(ColorSchemes) as ColorSchemeName[];

// Light / dark / system, and the colour scheme: the primary and accent pair
// the whole app uses (oxblood and sand by default, or navy and coral).
export function AppearanceSettings() {
  const theme = useTheme();
  const { mode, setMode, colorScheme, setColorScheme } = useThemePreference();
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.bodyMediumBold.lineHeight * fontScale;
  const swatchSize = lineHeight * 1.6;

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">Appearance</ThemedText>
      <PillGroup options={MODES} value={mode} onChange={setMode} accessibilityLabel="Appearance" />
      <ThemedText type="small" themeColor="textSecondary">
        {mode === 'system'
          ? 'Follows your phone’s light or dark setting.'
          : mode === 'dark'
            ? 'Always dark.'
            : 'Always light.'}
      </ThemedText>

      <ThemedText type="heading" style={styles.subheading}>
        Colours
      </ThemedText>
      <View accessibilityRole="radiogroup" accessibilityLabel="Colours" style={styles.schemes}>
        {SCHEME_NAMES.map((name) => {
          const scheme = ColorSchemes[name];
          const selected = name === colorScheme;
          return (
            <Pressable
              key={name}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={scheme.label}
              onPress={() => setColorScheme(name)}
              android_ripple={{ color: withAlpha(theme.onSurface, 0.1) }}
              style={[
                styles.scheme,
                {
                  backgroundColor: theme.surfaceContainer,
                  borderColor: selected ? theme.primary : theme.outlineVariant,
                  borderWidth: selected ? 2 : 1,
                  padding: lineHeight * 0.7 - (selected ? 1 : 0),
                },
              ]}>
              <View style={styles.swatches}>
                {/* The primary swatch overlaps the accent, like a pair of buttons. */}
                <View
                  style={[
                    styles.swatch,
                    {
                      width: swatchSize,
                      height: swatchSize,
                      backgroundColor: scheme.swatches.accent,
                      borderColor: theme.surfaceContainer,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.swatch,
                    {
                      width: swatchSize,
                      height: swatchSize,
                      marginLeft: -swatchSize * 0.35,
                      backgroundColor: scheme.swatches.primary,
                      borderColor: theme.surfaceContainer,
                    },
                  ]}
                />
              </View>
              <ThemedText type="smallBold" style={styles.schemeLabel}>
                {scheme.label}
              </ThemedText>
              {selected && (
                <SymbolView name={{ android: 'check', web: 'check' }} size={lineHeight} tintColor={theme.primary} />
              )}
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  subheading: {
    marginTop: Spacing.three,
  },
  schemes: {
    gap: Spacing.two,
  },
  scheme: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  swatches: {
    flexDirection: 'row',
  },
  swatch: {
    borderRadius: Radius.full,
    borderWidth: 2,
  },
  schemeLabel: {
    flex: 1,
  },
});
