import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedView } from '@/components/themed-view';
import { AuthProvider, useSession } from '@/lib/auth-context';
import { ThemePreferenceProvider, useThemePreference } from '@/lib/theme-preference';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <ThemedRoot />
    </ThemePreferenceProvider>
  );
}

function ThemedRoot() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { session, profile, isLoading } = useSession();
  const { isReady: isThemeReady } = useThemePreference();

  // Wait for the saved theme (so the app doesn't flash the wrong mode),
  // the initial session check, and if a session exists, its profile
  // (which carries the role that decides which stack to show).
  if (!isThemeReady || isLoading || (session && !profile)) {
    return <ThemedView style={styles.loading} />;
  }

  const isStudent = !!session && profile?.role === 'student';
  const isAdmin = !!session && profile?.role === 'admin';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isStudent}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={isAdmin}>
        <Stack.Screen name="(admin)" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
  },
});
