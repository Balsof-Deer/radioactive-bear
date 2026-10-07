import { SymbolView } from 'expo-symbols';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PASSWORD_RULES } from '@/lib/password-rules';

// Live list of the password rules under a new-password field: each one
// ticks over to the success green as it's met.
export function PasswordChecklist({ password }: { password: string }) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const iconSize = Typography.labelSmall.lineHeight * fontScale;

  return (
    <View accessibilityLabel="Password requirements" style={styles.list}>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View
            key={rule.id}
            accessible
            accessibilityLabel={`${rule.label}: ${met ? 'done' : 'not yet'}`}
            style={styles.item}>
            <SymbolView
              name={{
                android: met ? 'check_circle' : 'radio_button_unchecked',
                web: met ? 'check_circle' : 'radio_button_unchecked',
              }}
              size={iconSize}
              tintColor={met ? theme.primary : theme.outline}
            />
            <ThemedText type="label" themeColor={met ? 'primary' : 'textSecondary'}>
              {rule.label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.one,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
