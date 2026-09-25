import type { PropsWithChildren } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type PageScreenProps = PropsWithChildren<{
  title: string;
  isLoading?: boolean;
  error?: string | null;
}>;

export function PageScreen({ title, isLoading, error, children }: PageScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <ThemedView style={styles.headerRow}>
            <BackButton />
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>
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
