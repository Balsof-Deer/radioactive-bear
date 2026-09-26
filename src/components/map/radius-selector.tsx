import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { RADIUS_OPTIONS_KM } from '@/constants/map';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type RadiusSelectorProps = {
  value: number;
  onChange: (radiusKm: number) => void;
};

// Compact segmented control (same look as Appearance): cream track, sage
// selection. Segment height is relative to text size (44 at default).
export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.bodyMediumBold.lineHeight * fontScale;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Search radius"
      style={[styles.track, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
      {RADIUS_OPTIONS_KM.map((radiusKm) => {
        const selected = radiusKm === value;
        return (
          <Pressable
            key={radiusKm}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${radiusKm} kilometres`}
            onPress={() => onChange(radiusKm)}
            style={[
              styles.segment,
              { minHeight: lineHeight * 2, paddingHorizontal: lineHeight * 0.7 },
              selected && { backgroundColor: theme.primaryContainer },
            ]}>
            <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimaryContainer : theme.onSurfaceVariant }}>
              {radiusKm} km
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
});
