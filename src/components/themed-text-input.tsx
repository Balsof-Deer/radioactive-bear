import { useState } from 'react';
import { StyleSheet, TextInput, useWindowDimensions, type TextInputProps } from 'react-native';

import { Radius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Input: white field with a 1px warm border that becomes a 2px primary-colour outline
// while focused (the M3 focus behaviour). Padding
// shrinks by the same 1px so the text doesn't shift. Padding is relative to
// the text's line height x the phone's text size (48 tall at default).
export function ThemedTextInput({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.bodyLarge.lineHeight * fontScale;
  const borderWidth = isFocused ? 2 : 1;

  return (
    <TextInput
      style={[
        styles.input,
        {
          borderWidth,
          paddingVertical: lineHeight * VERTICAL_PADDING_RATIO - borderWidth,
          paddingHorizontal: lineHeight * HORIZONTAL_PADDING_RATIO - borderWidth,
        },
        {
          color: theme.onSurface,
          backgroundColor: theme.surfaceContainerLowest,
          borderColor: isFocused ? theme.primary : theme.outlineVariant,
        },
        style,
      ]}
      placeholderTextColor={theme.textTertiary}
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

const VERTICAL_PADDING_RATIO = 0.6;
const HORIZONTAL_PADDING_RATIO = 0.7;

const styles = StyleSheet.create({
  input: {
    ...Typography.bodyLarge,
    borderRadius: Radius.md,
  },
});
