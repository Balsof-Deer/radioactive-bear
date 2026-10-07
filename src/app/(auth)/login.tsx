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
  const { signIn, resendSignUpCode } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [, setError] = useErrorState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    const { error: signInError, code } = await signIn(email.trim(), password);
    if (code === 'email_not_confirmed') {
      // Signed up but never entered the code: send a fresh one and go
      // straight to the code screen instead of showing an error.
      const { error: resendError } = await resendSignUpCode(email.trim());
      setIsSubmitting(false);
      if (resendError) {
        setError(resendError);
        return;
      }
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } });
      return;
    }
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
        <View style={styles.forgot}>
          <ThemedButton
            label="Forgot password?"
            variant="text"
            onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: { email: email.trim() } })}
          />
        </View>
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
  // Sits under the password field, against the right edge.
  forgot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
