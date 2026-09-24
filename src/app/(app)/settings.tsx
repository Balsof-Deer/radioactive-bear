import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';
import { updateDisplayName } from '@/lib/profile';

export default function SettingsScreen() {
  const { session, profile, refreshProfile } = useSession();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!session) return;
    setError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      await updateDisplayName(session.user.id, displayName.trim());
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your display name.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.content}>
          <ThemedView style={styles.headerRow}>
            <ThemedText type="subtitle">Settings</ThemedText>
            <ThemedButton label="Close" variant="secondary" onPress={() => router.back()} />
          </ThemedView>

          <ThemedView style={styles.fields}>
            <ThemedText type="smallBold">Display name</ThemedText>
            <ThemedTextInput
              placeholder="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            {error && (
              <ThemedText themeColor="danger" type="small">
                {error}
              </ThemedText>
            )}
            {saved && !error && (
              <ThemedText themeColor="tint" type="small">
                Saved.
              </ThemedText>
            )}
            <ThemedButton label="Save" onPress={handleSave} loading={isSaving} disabled={isSaving} />
          </ThemedView>

          <ThemedText themeColor="textSecondary" type="small" style={styles.note}>
            More settings (theme, preferences, and account options) are coming in a later phase.
          </ThemedText>
        </ThemedView>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fields: {
    gap: Spacing.two,
  },
  note: {
    marginTop: Spacing.two,
  },
});
