import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PageScreen } from '@/components/page-screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-context';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_CONTAINER, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import { fetchMyLocations, type MyLocation } from '@/lib/locations';
import { formatRating } from '@/lib/rating';

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

      <View>
        {locations.map((location, index) => {
          const hasRating = location.review_count > 0 && location.average_rating !== null;
          return (
            <Pressable
              key={location.id}
              accessibilityRole="button"
              accessibilityHint="Opens this location"
              onPress={() => router.push(`/location/${location.id}`)}
              android_ripple={{ color: withAlpha(theme.onSurface, 0.1) }}
              style={[
                styles.row,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
              ]}>
              <View style={styles.titleRow}>
                <ThemedText type="heading" style={styles.name}>
                  {location.name}
                </ThemedText>
                <ThemedText
                  type="heading"
                  themeColor={hasRating ? 'text' : 'textSecondary'}
                  accessibilityLabel={
                    hasRating
                      ? `Rated ${formatRating(location.average_rating)} out of 5 from ${location.review_count} review${location.review_count === 1 ? '' : 's'}`
                      : 'No reviews yet'
                  }>
                  {hasRating ? formatRating(location.average_rating) : 'New'}
                </ThemedText>
              </View>
              {location.address && (
                <ThemedText type="small" themeColor="textSecondary">
                  {location.address}
                </ThemedText>
              )}
              <View style={styles.metaRow}>
                <View style={[styles.pill, { backgroundColor: theme[LOCATION_STATUS_CONTAINER[location.status]] }]}>
                  <ThemedText type="label" themeColor={LOCATION_STATUS_COLOR[location.status]}>
                    {LOCATION_STATUS_LABEL[location.status]}
                  </ThemedText>
                </View>
                <ThemedText type="label" themeColor="textSecondary">
                  Added {new Date(location.created_at).toLocaleDateString()}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  pill: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
