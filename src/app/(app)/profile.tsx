import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ProfileAvatar } from '@/components/profile-avatar';
import { TagPicker } from '@/components/tag-picker';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Shape, Spacing } from '@/constants/theme';
import { redeemAdminInvite } from '@/lib/admin';
import { useSession } from '@/lib/auth-context';
import { changePassword, deleteMyAccount, removeAvatar, updateDisplayName, uploadAvatar } from '@/lib/profile';
import { fetchMyPreferredTagIds, fetchTags, setMyPreferredTagIds, type Tag } from '@/lib/tags';

export default function ProfileScreen() {
  const { session, profile, refreshProfile } = useSession();

  const [isChangingPhoto, setIsChangingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

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

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const [inviteCode, setInviteCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleChangePassword() {
    if (!profile) return;
    setPasswordChanged(false);
    if (!currentPassword || !newPassword) {
      setPasswordError('Enter your current password and a new one.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setPasswordError(null);
    setIsChangingPassword(true);
    try {
      await changePassword(profile.email, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChanged(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not change your password.');
    } finally {
      setIsChangingPassword(false);
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
    Alert.alert(
      'Delete your account?',
      'Your account and profile photo will be permanently deleted. Reviews and locations you added stay in the app, shown as from a deleted user. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: handleDeleteAccount },
      ]
    );
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
          <ThemedView style={styles.headerRow}>
            <BackButton />
            <ThemedText type="subtitle">Profile</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedView type="backgroundElement" style={styles.photoRow}>
              <ProfileAvatar profile={profile} scale={3.5} />
              <ThemedView type="backgroundElement" style={styles.photoActions}>
                <ThemedButton
                  label={profile?.avatar_path ? 'Change photo' : 'Add photo'}
                  onPress={handlePickPhoto}
                  loading={isChangingPhoto}
                  disabled={isChangingPhoto}
                />
                {profile?.avatar_path && (
                  <ThemedButton
                    label="Remove photo"
                    variant="secondary"
                    onPress={handleRemovePhoto}
                    disabled={isChangingPhoto}
                  />
                )}
              </ThemedView>
            </ThemedView>
            {photoError && (
              <ThemedText themeColor="danger" type="small">
                {photoError}
              </ThemedText>
            )}
            <ThemedText themeColor="textSecondary" type="small">
              Only you and admins can see your photo.
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Display name</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              {profile?.email}
            </ThemedText>
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
            <ThemedButton label="Save" onPress={handleSaveName} loading={isSaving} disabled={isSaving} />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Preferred amenities</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              Used by the preference filter on the Home tab to surface locations that match what
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

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Change password</ThemedText>
            <ThemedTextInput
              placeholder="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              textContentType="password"
            />
            <ThemedTextInput
              placeholder="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              textContentType="newPassword"
            />
            <ThemedTextInput
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
            />
            {passwordError && (
              <ThemedText themeColor="danger" type="small">
                {passwordError}
              </ThemedText>
            )}
            {passwordChanged && !passwordError && (
              <ThemedText themeColor="tint" type="small">
                Password changed.
              </ThemedText>
            )}
            <ThemedButton
              label="Change password"
              onPress={handleChangePassword}
              loading={isChangingPassword}
              disabled={isChangingPassword}
            />
          </ThemedView>

          {profile?.role !== 'admin' && (
            <ThemedView type="backgroundElement" style={styles.card}>
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

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Delete account</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              Permanently deletes your account and profile photo. Reviews and locations you added stay,
              shown as from a deleted user.
            </ThemedText>
            {deleteError && (
              <ThemedText themeColor="danger" type="small">
                {deleteError}
              </ThemedText>
            )}
            <ThemedButton
              label="Delete account"
              variant="secondary"
              onPress={confirmDeleteAccount}
              loading={isDeleting}
              disabled={isDeleting}
            />
          </ThemedView>
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
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Shape.extraLarge,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  photoActions: {
    flex: 1,
    gap: Spacing.two,
  },
  loading: {
    alignSelf: 'flex-start',
  },
});
