import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AuthScreenLayout } from '@/components/auth-screen-layout';
import { LabeledField } from '@/components/labeled-field';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing, Typography } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';
import { useErrorState, useToast } from '@/lib/toast';

// Supabase's email code length is a project setting (6 to 10 digits), so
// the field accepts that range rather than assuming one length.
const MIN_CODE_LENGTH = 6;
const MAX_CODE_LENGTH = 10;
// Supabase allows a new code once every 60 seconds by default.
const RESEND_WAIT_SECONDS = 60;

// Confirms a new account with the code from the sign-up email. Reached
// after signing up, or after trying to log in before confirming.
export default function VerifyScreen() {
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const { verifySignUpCode, resendSignUpCode } = useSession();
  const { showSuccess } = useToast();
  const { fontScale } = useWindowDimensions();
  const [code, setCode] = useState('');
  const [, setError] = useErrorState();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // A code was just sent when this screen opens, so start the wait.
  const [secondsLeft, setSecondsLeft] = useState(RESEND_WAIT_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const digits = code.replace(/\D/g, '');
  const canVerify = digits.length >= MIN_CODE_LENGTH && !isVerifying;

  async function handleVerify() {
    setError(null);
    setIsVerifying(true);
    const { error } = await verifySignUpCode(email, digits);
    setIsVerifying(false);
    if (error) {
      setError(
        /expired|invalid/i.test(error)
          ? 'That code is wrong or has expired. Check the latest email, or send a new code.'
          : error
      );
    }
    // On success the auth listener signs in and opens the app.
  }

  async function handleResend() {
    setError(null);
    setIsResending(true);
    const { error } = await resendSignUpCode(email);
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
        <ThemedText type="title">Enter your code</ThemedText>
        <ThemedText themeColor="textSecondary">
          We sent a code to {email}. Enter it here to confirm your account.
        </ThemedText>
      </View>

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
          accessibilityLabel="Confirmation code"
          onSubmitEditing={() => canVerify && handleVerify()}
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

      <ThemedButton label="Verify" onPress={handleVerify} disabled={!canVerify} loading={isVerifying} />

      <View style={styles.secondary}>
        <ThemedButton
          label={secondsLeft > 0 ? `Resend code in ${secondsLeft} s` : 'Resend code'}
          variant="text"
          onPress={handleResend}
          disabled={secondsLeft > 0 || isResending}
          loading={isResending}
        />
        <ThemedButton label="Use a different email" variant="text" onPress={() => router.replace('/(auth)/signup')} />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.one,
  },
  codeInput: {
    fontFamily: Typography.display.fontFamily,
    textAlign: 'center',
  },
  secondary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
