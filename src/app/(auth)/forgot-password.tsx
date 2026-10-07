import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenLayout } from '@/components/auth-screen-layout';
import { LabeledField } from '@/components/labeled-field';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';
import { useErrorState } from '@/lib/toast';

// Step 1 of resetting a forgotten password: email a code. Reached from
// "Forgot password?" on the login screen, with whatever email was typed.
export default function ForgotPasswordScreen() {
  const { email: typedEmail = '' } = useLocalSearchParams<{ email?: string }>();
  const { sendPasswordResetCode } = useSession();
  const [email, setEmail] = useState(typedEmail);
  const [, setError] = useErrorState();
  const [isSending, setIsSending] = useState(false);

  const canSend = email.trim().length > 0 && !isSending;

  async function handleSend() {
    setError(null);
    setIsSending(true);
    const { error } = await sendPasswordResetCode(email.trim());
    setIsSending(false);
    if (error) {
      setError(error);
      return;
    }
    router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim() } });
  }

  return (
    <AuthScreenLayout>
      <View style={styles.heading}>
        <ThemedText type="title">Forgot your password?</ThemedText>
        <ThemedText themeColor="textSecondary">
          Enter the email you signed up with and we&apos;ll send you a code to choose a new password.
        </ThemedText>
      </View>

      <LabeledField label="Email">
        <ThemedTextInput
          placeholder="you@example.com"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Email"
          autoFocus={!typedEmail}
          onSubmitEditing={() => canSend && handleSend()}
        />
      </LabeledField>

      <ThemedButton label="Send code" onPress={handleSend} disabled={!canSend} loading={isSending} />
      <ThemedButton label="Back to log in" variant="text" onPress={() => router.back()} />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.one,
  },
});
