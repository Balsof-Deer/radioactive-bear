import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function NotificationBadge({ count }: { count: number }) {
  const theme = useTheme();
  if (count <= 0) return null;

  return (
    <View
      accessibilityLabel={`${count} to review`}
      style={[styles.badge, { backgroundColor: theme.danger }]}>
      <ThemedText type="smallBold" style={styles.label}>
        {count > 99 ? '99+' : String(count)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
  },
});
