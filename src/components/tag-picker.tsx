import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Tag } from '@/lib/tags';

type TagPickerProps = {
  tags: Tag[];
  selectedTagIds: string[];
  onToggle: (tagId: string) => void;
};

// Filter chips in the Warm Academic look: outlined when off, filled in
// the primary colour with a check when on. At least 44 tall at default text size.
export function TagPicker({ tags, selectedTagIds, onToggle }: TagPickerProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.bodyMediumBold.lineHeight * fontScale;
  const chipHeight = lineHeight * 2.2;

  return (
    <View style={styles.row}>
      {tags.map((tag) => {
        const selected = selectedTagIds.includes(tag.id);
        return (
          <Pressable
            key={tag.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() => onToggle(tag.id)}
            android_ripple={{ color: withAlpha(theme.onSurface, 0.1), foreground: true }}
            style={[
              styles.chip,
              {
                minHeight: chipHeight,
                paddingHorizontal: lineHeight * 0.8,
                gap: lineHeight * 0.3,
                borderColor: selected ? theme.primary : theme.outlineVariant,
                backgroundColor: selected ? theme.primary : theme.surfaceContainerLowest,
              },
            ]}>
            {selected && (
              <SymbolView
                name={{ android: 'check', web: 'check' }}
                size={lineHeight * 0.9}
                tintColor={theme.onPrimary}
              />
            )}
            <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.onSurfaceVariant }}>
              {tag.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
});
