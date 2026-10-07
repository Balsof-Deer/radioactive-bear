import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts as useDMSans,
} from '@expo-google-fonts/dm-sans';
import {
  SourceSerif4_400Regular,
  SourceSerif4_600SemiBold,
  useFonts as useSourceSerif,
} from '@expo-google-fonts/source-serif-4';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, useColorScheme } from 'react-native';

import { SplashOverlay } from '@/components/splash-overlay';
import { ThemedView } from '@/components/themed-view';
import { AuthProvider, useSession } from '@/lib/auth-context';
import { ConfirmProvider } from '@/lib/confirm';
import { ThemePreferenceProvider, useThemePreference } from '@/lib/theme-preference';
import { ToastProvider } from '@/lib/toast';

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
  const { palette } = useThemePreference();
  const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  // Screen backgrounds during navigation transitions use the brand palette.
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surfaceContainer,
      text: palette.text,
      border: palette.outlineVariant,
      notification: palette.error,
    },
  };
  return (
    <ThemeProvider value={navigationTheme}>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <SplashOverlay />
            <RootNavigator />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { session, profile, isLoading } = useSession();
  const { isReady: isThemeReady } = useThemePreference();
  // The weights the type scale uses (see Font in constants/theme).
  const [sansLoaded, sansError] = useDMSans({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const [serifLoaded, serifError] = useSourceSerif({ SourceSerif4_400Regular, SourceSerif4_600SemiBold });
  // If a font fails to load, carry on with the system font.
  const areFontsSettled = (sansLoaded || !!sansError) && (serifLoaded || !!serifError);
  // Wait for the saved theme (so the app doesn't flash the wrong mode),
  // the initial session check, and if a session exists, its profile
  // (which carries the role that decides which stack to show).
  if (!isThemeReady || !areFontsSettled || isLoading || (session && !profile)) {
    return <ThemedView style={styles.loading} />;
  }

  // Students and admins share the main app; admin-only screens are an
  // extra tab plus an /admin/* stack inside it (see (app)/admin/_layout).
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
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
