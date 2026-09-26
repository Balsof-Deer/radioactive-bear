import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenLayout } from '@/components/auth-screen-layout';
import { LabeledField } from '@/components/labeled-field';
import { PasswordInput } from '@/components/password-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';
import { useErrorState } from '@/lib/toast';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [, setError] = useErrorState();
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
      <View style={styles.heading}>
        <ThemedText type="title">Welcome back</ThemedText>
        <ThemedText themeColor="textSecondary">Log in to find and review places near you.</ThemedText>
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
            placeholder="Your password"
            textContentType="password"
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
            accessibilityLabel="Password"
          />
        </LabeledField>
      </View>

      <ThemedButton label="Log in" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />

      <View style={styles.footer}>
        <ThemedText themeColor="textSecondary" type="small">
          Don&apos;t have an account?
        </ThemedText>
        <ThemedButton label="Sign up" variant="text" onPress={() => router.replace('/(auth)/signup')} />
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
