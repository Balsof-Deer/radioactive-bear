import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { PageScreen } from '@/components/page-screen';
import { StarRating } from '@/components/star-rating';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Shape, Spacing } from '@/constants/theme';
import { deleteLocation, fetchAllLocations, type AdminLocation } from '@/lib/admin';
import { useAdminBadges } from '@/lib/admin-badges';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_LABEL } from '@/lib/location-status';

export default function AllLocationsScreen() {
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { markChecked } = useAdminBadges();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setLocations(await fetchAllLocations());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load locations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Opening this page clears its badge for every admin and records who checked.
  useEffect(() => {
    markChecked('locations');
  }, [markChecked]);

  useEffect(() => {
    // Standard fetch-on-mount; `load` is also the refresh after a delete.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function confirmDelete(location: AdminLocation) {
    Alert.alert(
      'Delete location?',
      `"${location.name}" and all of its reviews and photos will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusyId(location.id);
            setError(null);
            try {
              await deleteLocation(location.id);
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not delete this location.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  }

  return (
    <PageScreen title="All locations" isLoading={isLoading} error={error}>
      {!isLoading && (
        <ThemedText themeColor="textSecondary" type="small">
          {locations.length} location{locations.length === 1 ? '' : 's'}, newest first. Pending ones are
          approved or rejected from Location approvals.
        </ThemedText>
      )}

      {locations.map((location) => {
        const isBusy = busyId === location.id;
        return (
          <ThemedView key={location.id} type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{location.name}</ThemedText>
            <ThemedText themeColor={LOCATION_STATUS_COLOR[location.status]} type="small">
              {LOCATION_STATUS_LABEL[location.status]}
            </ThemedText>
            {location.address && (
              <ThemedText themeColor="textSecondary" type="small">
                {location.address}
              </ThemedText>
            )}
            <ThemedView type="backgroundElement" style={styles.ratingRow}>
              {location.average_rating !== null && (
                <StarRating value={Math.round(Number(location.average_rating))} size={16} />
              )}
              <ThemedText themeColor="textSecondary" type="small">
                {location.review_count === 0
                  ? 'No reviews yet'
                  : `${Number(location.average_rating).toFixed(1)} from ${location.review_count} review${
                      location.review_count === 1 ? '' : 's'
                    }`}
              </ThemedText>
            </ThemedView>
            <ThemedText themeColor="textSecondary" type="small">
              Added {new Date(location.created_at).toLocaleDateString()} by{' '}
              {location.submitted_by === null ? 'a deleted user' : (location.submitter_email ?? 'unknown user')}
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.actions}>
              <ThemedButton
                label="View"
                variant="secondary"
                onPress={() => router.push(`/location/${location.id}`)}
                disabled={isBusy}
              />
              <ThemedButton
                label="Delete"
                variant="secondary"
                onPress={() => confirmDelete(location)}
                loading={isBusy}
                disabled={isBusy}
              />
            </ThemedView>
          </ThemedView>
        );
      })}
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Shape.extraLarge,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
