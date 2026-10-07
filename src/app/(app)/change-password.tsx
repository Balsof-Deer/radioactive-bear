import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LabeledField } from '@/components/labeled-field';
import { PageScreen } from '@/components/page-screen';
import { PasswordChecklist } from '@/components/password-checklist';
import { PasswordInput } from '@/components/password-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';
import { isStrongPassword } from '@/lib/password-rules';
import { changePassword } from '@/lib/profile';
import { useErrorState, useToast } from '@/lib/toast';

// Changing the password while signed in: the current one is checked first.
// (Forgotten passwords are reset from the login screen instead.)
export default function ChangePasswordScreen() {
  const { profile } = useSession();
  const { showSuccess } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [, setError] = useErrorState();

  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSave =
    currentPassword.length > 0 && isStrongPassword(newPassword) && confirmPassword === newPassword && !isSaving;

  async function handleSave() {
    if (!profile) return;
    setError(null);
    setIsSaving(true);
    try {
      await changePassword(profile.email, currentPassword, newPassword);
      showSuccess('Password changed.');
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.');
      setIsSaving(false);
    }
  }

  return (
    <PageScreen title="Change password">
      <View style={styles.fields}>
        <LabeledField label="Current password">
          <PasswordInput
            placeholder="Current password"
            textContentType="password"
            autoComplete="current-password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            accessibilityLabel="Current password"
          />
        </LabeledField>
        <LabeledField label="New password">
          <PasswordInput
            placeholder="Choose a new password"
            textContentType="newPassword"
            autoComplete="new-password"
            value={newPassword}
            onChangeText={setNewPassword}
            accessibilityLabel="New password"
          />
        </LabeledField>
        <PasswordChecklist password={newPassword} />
        <LabeledField label="Confirm new password">
          <PasswordInput
            placeholder="Type it again"
            textContentType="newPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            accessibilityLabel="Confirm new password"
          />
        </LabeledField>
        {mismatch && (
          <ThemedText type="small" themeColor="error">
            The new passwords do not match.
          </ThemedText>
        )}
      </View>
      <ThemedButton label="Change password" onPress={handleSave} disabled={!canSave} loading={isSaving} />
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: Spacing.three,
  },
});
