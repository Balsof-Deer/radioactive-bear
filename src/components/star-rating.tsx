import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const label = (
          <ThemedText style={{ fontSize: size, color: filled ? theme.tint : theme.backgroundSelected }}>
            {'★'}
          </ThemedText>
        );
        if (!onChange) {
          return <View key={star}>{label}</View>;
        }
        return (
          <Pressable key={star} accessibilityRole="button" onPress={() => onChange(star)} hitSlop={4}>
            {label}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.half,
  },
});
