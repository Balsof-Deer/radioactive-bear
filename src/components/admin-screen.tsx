import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type AdminScreenProps = PropsWithChildren<{
  title: string;
  isLoading?: boolean;
  error?: string | null;
}>;

export function AdminScreen({ title, isLoading, error, children }: AdminScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <ThemedView style={styles.headerRow}>
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>
            <ThemedButton label="Back" variant="secondary" onPress={() => router.back()} />
          </ThemedView>
          {isLoading && <ActivityIndicator style={styles.loading} />}
          {error && (
            <ThemedText themeColor="danger" type="small">
              {error}
            </ThemedText>
          )}
          {children}
        </ScrollView>
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
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flexShrink: 1,
  },
  loading: {
    alignSelf: 'flex-start',
  },
});
