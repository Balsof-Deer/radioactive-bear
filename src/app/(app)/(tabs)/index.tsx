import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocationListItem } from '@/components/map/location-list-item';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_RADIUS_KM } from '@/constants/map';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useNearbyLocations } from '@/hooks/use-nearby-locations';
import { useSession } from '@/lib/auth-context';

export default function HomeScreen() {
  const { profile, signOut } = useSession();
  const { permission, locations, isLoading, error } = useNearbyLocations(DEFAULT_RADIUS_KM);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.headerRow}>
            <ThemedView style={styles.greeting}>
              <ThemedText type="title" style={styles.title}>
                Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{profile?.email}</ThemedText>
            </ThemedView>
            <ThemedButton label="Settings" variant="secondary" onPress={() => router.push('/settings')} />
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="smallBold">Nearby locations (within {DEFAULT_RADIUS_KM} km)</ThemedText>

            {permission === 'denied' && (
              <ThemedText themeColor="textSecondary" type="small">
                Enable location access on the Explore tab to see what&apos;s nearby.
              </ThemedText>
            )}

            {(permission === 'checking' || (permission === 'granted' && isLoading)) && (
              <ActivityIndicator style={styles.loading} />
            )}

            {error && (
              <ThemedText themeColor="danger" type="small">
                {error}
              </ThemedText>
            )}

            {permission === 'granted' && !isLoading && !error && locations.length === 0 && (
              <ThemedText themeColor="textSecondary" type="small">
                No locations within {DEFAULT_RADIUS_KM} km yet. Add one from the Explore tab.
              </ThemedText>
            )}

            {locations.map((location) => (
              <LocationListItem
                key={location.id}
                location={location}
                onPress={(loc) => router.push(`/location/${loc.id}`)}
              />
            ))}
          </ThemedView>

          <ThemedButton label="Sign out" variant="secondary" onPress={signOut} />
        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    alignItems: 'center',
    gap: Spacing.four,
  },
  headerRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  greeting: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  section: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.two,
  },
  loading: {
    alignSelf: 'flex-start',
  },
});
