import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { IconButton } from '@/components/icon-button';
import { ListGroup } from '@/components/list-group';
import { Loading } from '@/components/loading';
import { ProfileAvatar } from '@/components/profile-avatar';
import { TagPicker } from '@/components/tag-picker';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { redeemAdminInvite } from '@/lib/admin';
import { useSession } from '@/lib/auth-context';
import { deleteMyAccount, removeAvatar, updateDisplayName, uploadAvatar } from '@/lib/profile';
import { fetchMyPreferredTagIds, fetchTags, setMyPreferredTagIds, type Tag } from '@/lib/tags';
import { useErrorState, useToast } from '@/lib/toast';
import { useConfirm } from '@/lib/confirm';

export default function ProfileScreen() {
  const confirm = useConfirm();
  const theme = useTheme();
  const { session, profile, refreshProfile, signOut } = useSession();
  const { showSuccess } = useToast();

  const [isChangingPhoto, setIsChangingPhoto] = useState(false);
  const [, setPhotoError] = useErrorState();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [, setError] = useErrorState();

  const [tags, setTags] = useState<Tag[]>([]);
  const [preferredTagIds, setPreferredTagIds] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [, setPreferencesError] = useErrorState();

  const [inviteCode, setInviteCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [, setRedeemError] = useErrorState();

  const [isDeleting, setIsDeleting] = useState(false);
  const [, setDeleteError] = useErrorState();

  async function handlePickPhoto() {
    if (!session) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    setPhotoError(null);
    setIsChangingPhoto(true);
    try {
      await uploadAvatar(session.user.id, result.assets[0].uri, profile?.avatar_path ?? null);
      await refreshProfile();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not upload your photo.');
    } finally {
      setIsChangingPhoto(false);
    }
  }

  async function handleRemovePhoto() {
    if (!session || !profile?.avatar_path) return;
    setPhotoError(null);
    setIsChangingPhoto(true);
    try {
      await removeAvatar(session.user.id, profile.avatar_path);
      await refreshProfile();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not remove your photo.');
    } finally {
      setIsChangingPhoto(false);
    }
  }

  async function handleSaveName() {
    if (!session) return;
    setError(null);
    setIsSaving(true);
    try {
      await updateDisplayName(session.user.id, displayName.trim());
      await refreshProfile();
      showSuccess('Display name saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your display name.');
    } finally {
      setIsSaving(false);
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
  }, [session, setPreferencesError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPreferences();
  }, [loadPreferences]);

  function togglePreferredTag(tagId: string) {
    setPreferredTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  }

  async function handleSavePreferences() {
    if (!session) return;
    setPreferencesError(null);
    setIsSavingPreferences(true);
    try {
      await setMyPreferredTagIds(session.user.id, preferredTagIds);
      showSuccess('Preferred amenities saved.');
    } catch (err) {
      setPreferencesError(err instanceof Error ? err.message : 'Could not save preferences.');
    } finally {
      setIsSavingPreferences(false);
    }
  }

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

  function confirmDeleteAccount() {
    confirm({
      title: 'Delete your account?',
      message:
        'Your account and profile photo will be permanently deleted. Reviews and locations you added stay in the app, shown as from a deleted user. This cannot be undone.',
      confirmLabel: 'Delete account',
      onConfirm: handleDeleteAccount,
    });
  }

  async function handleDeleteAccount() {
    if (!session) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      // Signing out afterwards sends the app back to the login screen.
      await deleteMyAccount(session.user.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete your account.');
      setIsDeleting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.headerRow}>
            <BackButton />
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Profile
            </ThemedText>
            <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
          </View>

          <View style={styles.identity}>
            <ProfileAvatar profile={profile} scale={4} />
            <View style={styles.identityText}>
              <ThemedText type="title" style={styles.centerText}>
                {profile?.display_name || 'No display name yet'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                {profile?.email}
              </ThemedText>
            </View>
            <View style={styles.photoActions}>
              <ThemedButton
                label={profile?.avatar_path ? 'Change photo' : 'Add photo'}
                variant="text"
                onPress={handlePickPhoto}
                loading={isChangingPhoto}
                disabled={isChangingPhoto}
              />
              {profile?.avatar_path && (
                <ThemedButton
                  label="Remove photo"
                  variant="text"
                  onPress={handleRemovePhoto}
                  disabled={isChangingPhoto}
                />
              )}
            </View>
            <ThemedText type="label" themeColor="textSecondary">
              Only you and admins can see your photo.
            </ThemedText>
          </View>

          <View style={[styles.section, styles.card, { backgroundColor: theme.surfaceContainerLow }]}>
            <ThemedText type="heading">Display name</ThemedText>
            <ThemedTextInput
              placeholder="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              accessibilityLabel="Display name"
            />
            <View style={styles.actionRow}>
              <ThemedButton label="Save" onPress={handleSaveName} loading={isSaving} disabled={isSaving} />
            </View>
          </View>

          <View style={[styles.section, styles.card, { backgroundColor: theme.surfaceContainerLow }]}>
            <ThemedText type="heading">Preferred amenities</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Spots with these are sorted first on Home when &quot;Match my preferences&quot; is on.
            </ThemedText>
            {isLoadingTags ? (
              <Loading scale={1.4} style={styles.loading} />
            ) : (
              <TagPicker tags={tags} selectedTagIds={preferredTagIds} onToggle={togglePreferredTag} />
            )}
            <View style={styles.actionRow}>
              <ThemedButton
                label="Save"
                onPress={handleSavePreferences}
                loading={isSavingPreferences}
                disabled={isSavingPreferences || isLoadingTags}
              />
            </View>
          </View>

          {profile?.role !== 'admin' && (
            <View style={[styles.section, styles.card, { backgroundColor: theme.surfaceContainerLow }]}>
              <ThemedText type="heading">Admin invite</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                If an admin gave you an invite code, enter it here to get admin access.
              </ThemedText>
              <ThemedTextInput
                placeholder="Invite code"
                value={inviteCode}
                onChangeText={setInviteCode}
                accessibilityLabel="Invite code"
              />
              <View style={styles.actionRow}>
                <ThemedButton
                  label="Redeem"
                  variant="secondary"
                  onPress={handleRedeem}
                  loading={isRedeeming}
                  disabled={isRedeeming}
                />
              </View>
            </View>
          )}

          <ListGroup
            items={[
              {
                key: 'password',
                icon: 'lock',
                title: 'Change password',
                subtitle: 'Needs your current password',
                onPress: () => router.push('/change-password'),
              },
              {
                key: 'settings',
                icon: 'settings',
                title: 'Settings',
                subtitle: 'Appearance and about',
                onPress: () => router.push('/settings'),
              },
            ]}
          />

          <ThemedButton label="Sign out" variant="secondary" onPress={signOut} />

          <View style={[styles.section, styles.card, { backgroundColor: theme.surfaceContainerLow }]}>
            <ThemedText type="heading">Delete account</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Permanently deletes your account and profile photo. Reviews and locations you added stay, shown as from a
              deleted user.
            </ThemedText>
            <View style={styles.startRow}>
              <ThemedButton
                label="Delete account"
                variant="textDanger"
                onPress={confirmDeleteAccount}
                loading={isDeleting}
                disabled={isDeleting}
              />
            </View>
          </View>
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitle: {
    flex: 1,
  },
  identity: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  identityText: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  centerText: {
    textAlign: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  // Each settings group sits on its own tonal card.
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  startRow: {
    flexDirection: 'row',
  },
  loading: {
    alignSelf: 'flex-start',
  },
});
