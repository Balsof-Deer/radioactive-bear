import { Image } from 'expo-image';
import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';

// Shared by every auth screen so the keyboard-avoidance/scroll behavior
// (fields staying visible above the keyboard, content scrollable when it
// doesn't fit) only needs to be correct in one place.
export function AuthScreenLayout({ children }: PropsWithChildren) {
  const isDark = useColorScheme() === 'dark';
  const { fontScale } = useWindowDimensions();
  // Logo height relative to the heading text (64 at default text size).
  const logoSize = Typography.display.lineHeight * fontScale * 2.1;
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.form}>
              <View style={styles.brand}>
                <Image
                  source={isDark ? require('@/assets/images/logo-dark.png') : require('@/assets/images/logo.png')}
                  style={{ width: logoSize, height: logoSize }}
                  contentFit="contain"
                  accessibilityIgnoresInvertColors
                  accessible={false}
                />
                <ThemedText type="subtitle" themeColor="primary" accessibilityRole="header">
                  DangerBear
                </ThemedText>
              </View>
              {children}
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  form: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
});
