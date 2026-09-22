import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthScreenLayout } from '@/components/auth-screen-layout';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';

export default function SignupScreen() {
  const { signUp } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSubmit, setDidSubmit] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
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
    email.trim().length > 0 && password.length > 0 && confirmPassword.length > 0 && !isSubmitting;

  if (didSubmit) {
    return (
      <AuthScreenLayout>
        <ThemedText type="title" style={styles.title}>
          Check your email
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          We sent a confirmation link to {email.trim()}. Confirm your email, then log in.
        </ThemedText>
        <Link href="/(auth)/login" replace>
          <ThemedText type="linkPrimary">Back to log in</ThemedText>
        </Link>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout>
      <ThemedText type="title" style={styles.title}>
        Create an account
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Find, review, and add spots that work for you.
      </ThemedText>

      <ThemedView style={styles.fields}>
        <ThemedTextInput
          placeholder="Email"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />
        <ThemedTextInput
          placeholder="Password"
          secureTextEntry
          textContentType="newPassword"
          value={password}
          onChangeText={setPassword}
        />
        <ThemedTextInput
          placeholder="Confirm password"
          secureTextEntry
          textContentType="newPassword"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </ThemedView>

      {error && (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      )}

      <ThemedButton label="Sign up" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />

      <ThemedView style={styles.footer}>
        <ThemedText themeColor="textSecondary" type="small">
          Already have an account?
        </ThemedText>
        <Link href="/(auth)/login" replace>
          <ThemedText type="linkPrimary">Log in</ThemedText>
        </Link>
      </ThemedView>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    marginBottom: Spacing.two,
  },
  fields: {
    gap: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
