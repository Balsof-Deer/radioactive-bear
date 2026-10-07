import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AuthScreenLayout } from '@/components/auth-screen-layout';
import { LabeledField } from '@/components/labeled-field';
import { PasswordChecklist } from '@/components/password-checklist';
import { PasswordInput } from '@/components/password-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Font, Spacing, Typography } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';
import { isStrongPassword } from '@/lib/password-rules';
import { useErrorState, useToast } from '@/lib/toast';

// Same code rules as sign-up (see verify.tsx): Supabase's code length is a
// project setting, and a new code can be sent once a minute.
const MIN_CODE_LENGTH = 6;
const MAX_CODE_LENGTH = 10;
const RESEND_WAIT_SECONDS = 60;

// Step 2 of resetting a forgotten password: the emailed code plus the new
// password, in one go. A correct code signs the user in, so the app opens
// on its own once the new password is saved.
export default function ResetPasswordScreen() {
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const { resetPasswordWithCode, sendPasswordResetCode } = useSession();
  const { showSuccess } = useToast();
  const { fontScale } = useWindowDimensions();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [, setError] = useErrorState();
  const [isResetting, setIsResetting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // A code was just sent when this screen opens, so start the wait.
  const [secondsLeft, setSecondsLeft] = useState(RESEND_WAIT_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const digits = code.replace(/\D/g, '');
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canReset =
    digits.length >= MIN_CODE_LENGTH &&
    isStrongPassword(newPassword) &&
    confirmPassword === newPassword &&
    !isResetting;

  async function handleReset() {
    setError(null);
    setIsResetting(true);
    const { error } = await resetPasswordWithCode(email, digits, newPassword);
    setIsResetting(false);
    if (error) {
      setError(
        /expired|invalid/i.test(error)
          ? 'That code is wrong or has expired. Check the latest email, or send a new code.'
          : error
      );
      return;
    }
    showSuccess('Password reset. You’re signed in.');
  }

  async function handleResend() {
    setError(null);
    setIsResending(true);
    const { error } = await sendPasswordResetCode(email);
    setIsResending(false);
    if (error) {
      setError(error);
      return;
    }
    setCode('');
    setSecondsLeft(RESEND_WAIT_SECONDS);
    showSuccess('New code sent.');
  }

  return (
    <AuthScreenLayout>
      <View style={styles.heading}>
        <ThemedText type="title">Choose a new password</ThemedText>
        <ThemedText themeColor="textSecondary">
          If there&apos;s an account for {email}, we&apos;ve sent it a code. Enter it here with your new password.
        </ThemedText>
      </View>

      <View style={styles.fields}>
        <LabeledField label="Code">
          <ThemedTextInput
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, MAX_CODE_LENGTH))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={MAX_CODE_LENGTH}
            autoFocus
            placeholder="123456"
            accessibilityLabel="Reset code"
            style={[
              styles.codeInput,
              {
                fontSize: Typography.display.fontSize * fontScale,
                lineHeight: Typography.display.lineHeight * fontScale,
                // Spreads the digits out, relative to the text size.
                letterSpacing: Typography.display.fontSize * fontScale * 0.25,
              },
            ]}
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

      <ThemedButton label="Reset password" onPress={handleReset} disabled={!canReset} loading={isResetting} />

      <View style={styles.secondary}>
        <ThemedButton
          label={secondsLeft > 0 ? `Resend code in ${secondsLeft} s` : 'Resend code'}
          variant="text"
          onPress={handleResend}
          disabled={secondsLeft > 0 || isResending}
          loading={isResending}
        />
        <ThemedButton label="Use a different email" variant="text" onPress={() => router.back()} />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.one,
  },
  fields: {
    gap: Spacing.three,
  },
  codeInput: {
    fontFamily: Font.serifSemiBold,
    textAlign: 'center',
  },
  secondary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
