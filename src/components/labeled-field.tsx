import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type LabeledFieldProps = PropsWithChildren<{
  label: string;
  // Guidance under the field, e.g. a password rule.
  hint?: string;
}>;

// A visible label above a form field (placeholders disappear once you
// type), with optional guidance underneath.
export function LabeledField({ label, hint, children }: LabeledFieldProps) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
      {hint && (
        <ThemedText type="label" themeColor="textSecondary">
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
});
