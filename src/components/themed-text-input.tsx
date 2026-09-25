import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Shape, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Material 3 outlined text field: a 1px outline at rest that thickens to
// 2px in the primary color while focused. Padding shrinks by the same 1px
// so the text doesn't shift.
export function ThemedTextInput({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      style={[
        styles.input,
        isFocused ? styles.focused : styles.resting,
        { color: theme.onSurface, borderColor: isFocused ? theme.primary : theme.outline },
        style,
      ]}
      placeholderTextColor={theme.onSurfaceVariant}
      cursorColor={theme.primary}
      selectionColor={theme.primary}
      autoCapitalize="none"
      autoCorrect={false}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...Typography.bodyLarge,
    minHeight: 56,
    borderRadius: Shape.extraSmall,
    backgroundColor: 'transparent',
  },
  resting: {
    borderWidth: 1,
    paddingHorizontal: Spacing.three - 1,
    paddingVertical: Spacing.two - 1,
  },
  focused: {
    borderWidth: 2,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two - 2,
  },
});
