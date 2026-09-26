import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatusPillProps = {
  label: string;
  // Text colour and its matching container colour.
  color: ThemeColor;
  containerColor: ThemeColor;
};

// Small rounded tag for a status (the spec's semantic status pills).
export function StatusPill({ label, color, containerColor }: StatusPillProps) {
  const theme = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: theme[containerColor] }]}>
      <ThemedText type="label" themeColor={color}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
