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

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setIsSubmitting(false);
    if (signInError) {
      setError(signInError);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  return (
    <AuthScreenLayout>
      <ThemedText type="title" style={styles.title}>
        Welcome back
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Log in to find and review places near you.
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
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />
      </ThemedView>

      {error && (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      )}

      <ThemedButton label="Log in" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />

      <ThemedView style={styles.footer}>
        <ThemedText themeColor="textSecondary" type="small">
          Don&apos;t have an account?
        </ThemedText>
        <Link href="/(auth)/signup" replace>
          <ThemedText type="linkPrimary">Sign up</ThemedText>
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
