import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RADIUS_OPTIONS_KM } from '@/constants/map';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type RadiusSelectorProps = {
  value: number;
  onChange: (radiusKm: number) => void;
};

export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {RADIUS_OPTIONS_KM.map((radiusKm) => {
        const selected = radiusKm === value;
        return (
          <Pressable
            key={radiusKm}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(radiusKm)}
            style={[styles.pill, selected && { backgroundColor: theme.tint }]}>
            <ThemedText
              type="smallBold"
              style={selected ? styles.selectedLabel : undefined}
              themeColor={selected ? undefined : 'textSecondary'}>
              {radiusKm} km
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Spacing.five,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  selectedLabel: {
    color: '#ffffff',
  },
});
