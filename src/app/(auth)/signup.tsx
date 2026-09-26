import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AuthScreenLayout } from '@/components/auth-screen-layout';
import { LabeledField } from '@/components/labeled-field';
import { PasswordChecklist } from '@/components/password-checklist';
import { PasswordInput } from '@/components/password-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-context';
import { isStrongPassword } from '@/lib/password-rules';
import { useErrorState } from '@/lib/toast';

export default function SignupScreen() {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const { signUp } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [, setError] = useErrorState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSubmit, setDidSubmit] = useState(false);

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
    setDidSubmit(true);
  }

  const canSubmit =
    email.trim().length > 0 && isStrongPassword(password) && confirmPassword.length > 0 && !isSubmitting;

  if (didSubmit) {
    return (
      <AuthScreenLayout>
        <View style={[styles.mailIcon, { backgroundColor: theme.primaryContainer }]}>
          <SymbolView
            name={{ android: 'mark_email_unread', web: 'mark_email_unread' }}
            size={Typography.display.lineHeight * fontScale}
            tintColor={theme.onPrimaryContainer}
          />
        </View>
        <View style={styles.heading}>
          <ThemedText type="title">Check your email</ThemedText>
          <ThemedText themeColor="textSecondary">
            We sent a confirmation link to {email.trim()}. Confirm your email, then log in.
          </ThemedText>
        </View>
        <ThemedButton label="Back to log in" onPress={() => router.replace('/(auth)/login')} />
      </AuthScreenLayout>
    );
  }

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
  mailIcon: {
    alignSelf: 'flex-start',
    padding: Spacing.three,
    borderRadius: Radius.full,
  },
});
