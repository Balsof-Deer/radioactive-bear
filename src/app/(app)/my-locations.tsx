import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { PageScreen } from '@/components/page-screen';
import { ThemedText } from '@/components/themed-text';
import { Shape, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-context';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import { fetchMyLocations, type MyLocation } from '@/lib/locations';

export default function MyLocationsScreen() {
  const theme = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;
  const [locations, setLocations] = useState<MyLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMyLocations(userId)
      .then((rows) => {
        if (!cancelled) setLocations(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your locations.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <PageScreen title="My locations" isLoading={isLoading} error={error}>
      {!isLoading && !error && locations.length === 0 && (
        <ThemedText themeColor="textSecondary" type="small">
          You haven&apos;t added any locations yet. Add one from the Explore tab.
        </ThemedText>
      )}

      {locations.map((location) => (
        <Pressable
          key={location.id}
          accessibilityRole="button"
          accessibilityHint="Opens this location"
          onPress={() => router.push(`/location/${location.id}`)}
          android_ripple={{ color: withAlpha(theme.onSurface, 0.1), foreground: true }}
          style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">{location.name}</ThemedText>
          <ThemedText themeColor={LOCATION_STATUS_COLOR[location.status]} type="small">
            {LOCATION_STATUS_LABEL[location.status]}
          </ThemedText>
          {location.address && (
            <ThemedText themeColor="textSecondary" type="small">
              {location.address}
            </ThemedText>
          )}
          <ThemedText themeColor="textSecondary" type="small">
            {location.review_count === 0
              ? 'No reviews yet'
              : `${Number(location.average_rating).toFixed(1)} from ${location.review_count} review${
                  location.review_count === 1 ? '' : 's'
                }`}
            {' · '}Added {new Date(location.created_at).toLocaleDateString()}
          </ThemedText>
        </Pressable>
      ))}
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Shape.extraLarge,
    overflow: 'hidden',
  },
});
