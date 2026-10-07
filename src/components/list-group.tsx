import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ListGroupItem = {
  key: string;
  icon: AndroidSymbol;
  title: string;
  subtitle?: string;
  // Extra line under the subtitle (e.g. "Last checked by...").
  detail?: string;
  // Shown before the chevron, e.g. a notification badge.
  trailing?: ReactNode;
  onPress: () => void;
};

// A group of tappable rows on one bordered card (the Warm Academic list),
// separated by hairlines, each with an icon on a soft circle.
export function ListGroup({ items }: { items: ListGroupItem[] }) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.bodyLarge.lineHeight * fontScale;
  const iconCircle = lineHeight * 1.7;

  return (
    <View style={[styles.group, { backgroundColor: theme.surfaceContainer, borderColor: theme.outlineVariant }]}>
      {items.map((item, index) => (
        <Pressable
          key={item.key}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          accessibilityHint={item.subtitle}
          onPress={item.onPress}
          android_ripple={{ color: withAlpha(theme.onSurface, 0.1) }}
          style={[
            styles.row,
            { paddingVertical: lineHeight * 0.6 },
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
          ]}>
          <View
            style={[
              styles.iconCircle,
              { width: iconCircle, height: iconCircle, backgroundColor: theme.secondaryContainer },
            ]}>
            <SymbolView
              name={{ android: item.icon, web: item.icon }}
              size={lineHeight * 0.9}
              tintColor={theme.onSurfaceVariant}
            />
          </View>
          <View style={styles.text}>
            <ThemedText type="heading">{item.title}</ThemedText>
            {item.subtitle && (
              <ThemedText type="small" themeColor="textSecondary">
                {item.subtitle}
              </ThemedText>
            )}
            {item.detail && (
              <ThemedText type="label" themeColor="textSecondary">
                {item.detail}
              </ThemedText>
            )}
          </View>
          {item.trailing}
          <SymbolView
            name={{ android: 'chevron_right', web: 'chevron_right' }}
            size={lineHeight}
            tintColor={theme.onSurfaceVariant}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
  },
  iconCircle: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
});
