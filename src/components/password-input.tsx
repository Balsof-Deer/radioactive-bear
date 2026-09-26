import { useState } from 'react';
import { StyleSheet, View, type TextInputProps } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { ThemedTextInput } from '@/components/themed-text-input';

// Password field with an eye button to show or hide what's typed.
export function PasswordInput({ style, ...rest }: Omit<TextInputProps, 'secureTextEntry'>) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <ThemedTextInput {...rest} secureTextEntry={!isVisible} style={[styles.input, style]} />
      <View style={styles.toggle}>
        <IconButton
          icon={isVisible ? 'visibility_off' : 'visibility'}
          label={isVisible ? 'Hide password' : 'Show password'}
          onPress={() => setIsVisible((value) => !value)}
          scale={1.8}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
  },
  // Leaves room on the right for the eye button (1.8 x the line height).
  input: {
    paddingRight: '15%',
  },
  toggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
