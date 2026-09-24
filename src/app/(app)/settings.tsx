import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppearanceSettings } from '@/components/appearance-settings';
import { TagPicker } from '@/components/tag-picker';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { redeemAdminInvite } from '@/lib/admin';
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
  const [isPickingColor, setIsPickingColor] = useState(false);

  const [inviteCode, setInviteCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  async function handleRedeem() {
    if (!inviteCode.trim()) {
      setRedeemError('Enter an invite code.');
      return;
    }
    setRedeemError(null);
    setIsRedeeming(true);
    try {
      await redeemAdminInvite(inviteCode);
      setInviteCode('');
      await refreshProfile();
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Could not redeem this code.');
    } finally {
      setIsRedeeming(false);
    }
  }

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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={!isPickingColor}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
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

          <AppearanceSettings onPickingChange={setIsPickingColor} />

          {profile?.role !== 'admin' && (
            <ThemedView style={styles.fields}>
              <ThemedText type="smallBold">Admin invite</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                If an admin gave you an invite code, enter it here to get admin access.
              </ThemedText>
              <ThemedTextInput placeholder="Invite code" value={inviteCode} onChangeText={setInviteCode} />
              {redeemError && (
                <ThemedText themeColor="danger" type="small">
                  {redeemError}
                </ThemedText>
              )}
              <ThemedButton
                label="Redeem"
                variant="secondary"
                onPress={handleRedeem}
                loading={isRedeeming}
                disabled={isRedeeming}
              />
            </ThemedView>
          )}

          <ThemedText themeColor="textSecondary" type="small" style={styles.note}>
            More settings (account options) are coming in a later phase.
          </ThemedText>
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
