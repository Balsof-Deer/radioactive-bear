import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Tag } from '@/lib/tags';

type TagPickerProps = {
  tags: Tag[];
  selectedTagIds: string[];
  onToggle: (tagId: string) => void;
};

export function TagPicker({ tags, selectedTagIds, onToggle }: TagPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {tags.map((tag) => {
        const selected = selectedTagIds.includes(tag.id);
        return (
          <Pressable
            key={tag.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onToggle(tag.id)}
            style={[
              styles.chip,
              { borderColor: theme.backgroundSelected },
              selected && { backgroundColor: theme.tint, borderColor: theme.tint },
            ]}>
            <ThemedText
              type="small"
              style={selected ? styles.selectedLabel : undefined}
              themeColor={selected ? undefined : 'textSecondary'}>
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
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  selectedLabel: {
    color: '#ffffff',
  },
});
