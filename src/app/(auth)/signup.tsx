import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenLayout } from '@/components/auth-screen-layout';
import { LabeledField } from '@/components/labeled-field';
import { PasswordChecklist } from '@/components/password-checklist';
import { PasswordInput } from '@/components/password-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';
import { isStrongPassword } from '@/lib/password-rules';
import { useErrorState } from '@/lib/toast';

export default function SignupScreen() {
  const { signUp } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [, setError] = useErrorState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!isStrongPassword(password)) {
      setError('Choose a stronger password: it needs everything in the list under the password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const { error: signUpError } = await signUp(email.trim(), password);
    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }
    // Supabase has emailed a confirmation code (see the "Confirm signup"
    // email template); the code screen finishes sign-up.
    router.replace({ pathname: '/(auth)/verify', params: { email: email.trim() } });
  }

  const canSubmit =
    email.trim().length > 0 && isStrongPassword(password) && confirmPassword.length > 0 && !isSubmitting;

  return (
    <AuthScreenLayout>
      <View style={styles.heading}>
        <ThemedText type="title">Create an account</ThemedText>
        <ThemedText themeColor="textSecondary">Find, review, and add spots that work for you.</ThemedText>
      </View>

      <View style={styles.fields}>
        <LabeledField label="Email">
          <ThemedTextInput
            placeholder="you@example.com"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Email"
          />
        </LabeledField>
        <LabeledField label="Password">
          <PasswordInput
            placeholder="Choose a password"
            textContentType="newPassword"
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            accessibilityLabel="Password"
          />
          <PasswordChecklist password={password} />
        </LabeledField>
        <LabeledField label="Confirm password">
          <PasswordInput
            placeholder="Type it again"
            textContentType="newPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            accessibilityLabel="Confirm password"
          />
        </LabeledField>
      </View>

      <ThemedButton label="Sign up" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />

      <View style={styles.footer}>
        <ThemedText themeColor="textSecondary" type="small">
          Already have an account?
        </ThemedText>
        <ThemedButton label="Log in" variant="text" onPress={() => router.replace('/(auth)/login')} />
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
