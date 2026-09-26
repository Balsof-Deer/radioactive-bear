import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference, type ThemeMode } from '@/lib/theme-preference';

const MODES: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

// Light / dark / system. The brand colour is fixed; the accent picker was
// removed in the Warm Academic redesign (a theme colour is to be decided).
export function AppearanceSettings() {
  const theme = useTheme();
  const { mode, setMode } = useThemePreference();
  const { fontScale } = useWindowDimensions();
  // At least a 44px touch target at default text size, growing with it.
  const segmentHeight = Typography.bodyMediumBold.lineHeight * fontScale * 2.2;

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">Appearance</ThemedText>
      <ThemedView style={[styles.segmented, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
        {MODES.map((option) => {
          const selected = option.value === mode;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setMode(option.value)}
              style={[
                styles.segment,
                { minHeight: segmentHeight },
                selected && { backgroundColor: theme.primaryContainer },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: selected ? theme.onPrimaryContainer : theme.onSurfaceVariant }}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
});
