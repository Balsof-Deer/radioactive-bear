import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loading } from '@/components/loading';
import { LocationListItem } from '@/components/map/location-list-item';
import { RadiusSelector } from '@/components/map/radius-selector';
import { MenuButton } from '@/components/menu-button';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_RADIUS_KM } from '@/constants/map';
import { Elevation, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useNearbyLocations } from '@/hooks/use-nearby-locations';
import { usePreferenceFilter } from '@/hooks/use-preference-filter';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-context';
import { distanceInMetres } from '@/lib/geo';
import { useErrorToast } from '@/lib/toast';

export default function HomeScreen() {
  const tabBarInset = useTabBarInset();
  const theme = useTheme();
  const { profile } = useSession();
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const { permission, userLocation, locations, isLoading, error } = useNearbyLocations(radiusKm);
  useErrorToast(error);
  const locationIds = useMemo(() => locations.map((location) => location.id), [locations]);
  const { enabled: preferencesEnabled, setEnabled: setPreferencesEnabled, matches, hasPreferences } =
    usePreferenceFilter(locationIds);
  const isMatching = preferencesEnabled && hasPreferences;

  const sortedLocations = isMatching
    ? [...locations].sort((a, b) => Number(matches(b.id)) - Number(matches(a.id)))
    : locations;

  const isChecking = permission === 'checking' || (permission === 'granted' && isLoading);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarInset + Spacing.three }]}>
          <View style={styles.headerRow}>
            <MenuButton />
            <ThemedText type="title" style={styles.greeting}>
              Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">Nearby</ThemedText>

            {/* Controls and results grouped in one container. */}
            <View style={[styles.group, { backgroundColor: theme.surfaceContainer }]}>
              <View style={styles.controls}>
                <RadiusSelector value={radiusKm} onChange={setRadiusKm} />
                <View style={styles.switchRow}>
                  <ThemedText type="small" style={styles.switchLabel}>
                    Match my preferences
                  </ThemedText>
                  <Switch
                    value={preferencesEnabled}
                    onValueChange={setPreferencesEnabled}
                    trackColor={{ true: theme.primary, false: theme.surfaceContainerHighest }}
                    thumbColor={preferencesEnabled ? theme.onPrimary : theme.outline}
                    accessibilityLabel="Match my preferences"
                  />
                </View>
                {preferencesEnabled && !hasPreferences && (
                  <ThemedText type="small" themeColor="textSecondary">
                    Choose your preferred amenities in Profile to use this.
                  </ThemedText>
                )}
              </View>

              {isChecking && (
                <View style={[styles.groupMessage, styles.divider, { borderColor: theme.outlineVariant }]}>
                  <Loading style={styles.loading} />
                </View>
              )}

              {permission === 'denied' && (
                <View style={[styles.groupMessage, styles.divider, { borderColor: theme.outlineVariant }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Turn on location access to see spots near you.
                  </ThemedText>
                  <ThemedButton label="Open Explore" variant="secondary" onPress={() => router.navigate('/explore')} />
                </View>
              )}

              {permission === 'granted' && !isLoading && !error && locations.length === 0 && (
                <View style={[styles.groupMessage, styles.divider, { borderColor: theme.outlineVariant }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    No spots within {radiusKm} km yet. Try a wider radius, or add one from Explore.
                  </ThemedText>
                  <ThemedButton label="Open Explore" variant="secondary" onPress={() => router.navigate('/explore')} />
                </View>
              )}

              {!isChecking &&
                sortedLocations.map((location) => (
                  <LocationListItem
                    key={location.id}
                    location={location}
                    showDivider
                    showTile
                    distanceMetres={userLocation ? distanceInMetres(userLocation, location) : null}
                    matchesPreferences={isMatching && matches(location.id)}
                    onPress={(loc) => router.push(`/location/${loc.id}`)}
                  />
                ))}
            </View>
          </View>
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
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  greeting: {
    flexShrink: 1,
  },
  section: {
    gap: Spacing.two,
  },
  // Spec card surface: white, radius 16, soft shadow; rows divide inside.
  group: {
    borderRadius: Radius.lg,
    boxShadow: Elevation.level1,
    overflow: 'hidden',
  },
  controls: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  groupMessage: {
    gap: Spacing.three,
    alignItems: 'flex-start',
    padding: Spacing.three,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  switchLabel: {
    flex: 1,
  },
  loading: {
    alignSelf: 'center',
  },
});
