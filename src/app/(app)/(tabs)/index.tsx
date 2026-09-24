import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocationListItem } from '@/components/map/location-list-item';
import { RadiusSelector } from '@/components/map/radius-selector';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_RADIUS_KM } from '@/constants/map';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useNearbyLocations } from '@/hooks/use-nearby-locations';
import { usePreferenceFilter } from '@/hooks/use-preference-filter';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-context';

export default function HomeScreen() {
  const theme = useTheme();
  const { profile, signOut } = useSession();
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const { permission, locations, isLoading, error } = useNearbyLocations(radiusKm);
  const locationIds = useMemo(() => locations.map((location) => location.id), [locations]);
  const { enabled: preferencesEnabled, setEnabled: setPreferencesEnabled, matches, hasPreferences } =
    usePreferenceFilter(locationIds);

  const sortedLocations =
    preferencesEnabled && hasPreferences
      ? [...locations].sort((a, b) => Number(matches(b.id)) - Number(matches(a.id)))
      : locations;

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
            <ThemedView style={styles.sectionHeader}>
              <ThemedText type="smallBold">Nearby locations</ThemedText>
              <RadiusSelector value={radiusKm} onChange={setRadiusKm} />
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.preferenceToggleRow}>
              <ThemedText type="small">Match my preferences</ThemedText>
              <Switch
                value={preferencesEnabled}
                onValueChange={setPreferencesEnabled}
                trackColor={{ true: theme.tint }}
              />
            </ThemedView>

            {preferencesEnabled && !hasPreferences && (
              <ThemedText themeColor="textSecondary" type="small">
                Set your preferred amenities in Settings to use this.
              </ThemedText>
            )}

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
                No locations within {radiusKm} km yet. Add one from the Explore tab.
              </ThemedText>
            )}

            {sortedLocations.map((location) => (
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  preferenceToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  loading: {
    alignSelf: 'flex-start',
  },
});
