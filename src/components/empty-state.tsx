import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  icon: AndroidSymbol;
  // Keep it to a few words, e.g. "No reviews yet".
  message: string;
};

// Brief "nothing here" message, centred in the space left on the page,
// with a faint icon.
export function EmptyState({ icon, message }: EmptyStateProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const iconSize = Typography.display.lineHeight * fontScale * 1.4;

  return (
    <View style={styles.container} accessible accessibilityLabel={message}>
      <SymbolView name={{ android: icon, web: icon }} size={iconSize} tintColor={theme.outline} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  message: {
    textAlign: 'center',
  },
});
