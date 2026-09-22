import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';

export default function HomeScreen() {
  const { profile, signOut } = useSession();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{profile?.email}</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            Signed in as {profile?.role ?? 'loading...'}
          </ThemedText>

          <ThemedText themeColor="textSecondary" style={styles.placeholderNote}>
            The map, search, and review features build on this account. They come next.
          </ThemedText>

          <ThemedButton label="Sign out" variant="secondary" onPress={signOut} />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.two,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  placeholderNote: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
});
