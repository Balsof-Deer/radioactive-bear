import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DismissKeyboardView } from '@/components/dismiss-keyboard-view';
import { TagPicker } from '@/components/tag-picker';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';
import { updateDisplayName } from '@/lib/profile';
import { fetchMyPreferredTagIds, fetchTags, setMyPreferredTagIds, type Tag } from '@/lib/tags';

export default function SettingsScreen() {
  const { session, profile, refreshProfile } = useSession();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [tags, setTags] = useState<Tag[]>([]);
  const [preferredTagIds, setPreferredTagIds] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    if (!session) return;
    setIsLoadingTags(true);
    try {
      const [allTags, myTagIds] = await Promise.all([fetchTags(), fetchMyPreferredTagIds(session.user.id)]);
      setTags(allTags);
      setPreferredTagIds(myTagIds);
    } catch (err) {
      setPreferencesError(err instanceof Error ? err.message : 'Could not load preferences.');
    } finally {
      setIsLoadingTags(false);
    }
  }, [session]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPreferences();
  }, [loadPreferences]);

  function togglePreferredTag(tagId: string) {
    setPreferencesSaved(false);
    setPreferredTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  }

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

  async function handleSavePreferences() {
    if (!session) return;
    setPreferencesError(null);
    setIsSavingPreferences(true);
    try {
      await setMyPreferredTagIds(session.user.id, preferredTagIds);
      setPreferencesSaved(true);
    } catch (err) {
      setPreferencesError(err instanceof Error ? err.message : 'Could not save preferences.');
    } finally {
      setIsSavingPreferences(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <DismissKeyboardView>
          <ScrollView contentContainerStyle={styles.scrollContent}>
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

            <ThemedView style={styles.fields}>
              <ThemedText type="smallBold">Preferred amenities</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Used by the preference filter on the Explore map to surface locations that match what
                you&apos;re looking for.
              </ThemedText>

              {isLoadingTags && <ActivityIndicator style={styles.loading} />}

              {!isLoadingTags && <TagPicker tags={tags} selectedTagIds={preferredTagIds} onToggle={togglePreferredTag} />}

              {preferencesError && (
                <ThemedText themeColor="danger" type="small">
                  {preferencesError}
                </ThemedText>
              )}
              {preferencesSaved && !preferencesError && (
                <ThemedText themeColor="tint" type="small">
                  Saved.
                </ThemedText>
              )}
              <ThemedButton
                label="Save preferences"
                onPress={handleSavePreferences}
                loading={isSavingPreferences}
                disabled={isSavingPreferences || isLoadingTags}
              />
            </ThemedView>

            <ThemedText themeColor="textSecondary" type="small" style={styles.note}>
              More settings (theme and account options) are coming in a later phase.
            </ThemedText>
          </ScrollView>
        </DismissKeyboardView>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
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
  loading: {
    alignSelf: 'flex-start',
  },
  note: {
    marginTop: Spacing.two,
  },
});
