import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { PageScreen } from '@/components/page-screen';
import { StatusPill } from '@/components/status-pill';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deleteLocation, fetchAllLocations, type AdminLocation } from '@/lib/admin';
import { useAdminBadges } from '@/lib/admin-badges';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_CONTAINER, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import { formatRating } from '@/lib/rating';
import { useConfirm } from '@/lib/confirm';

export default function AllLocationsScreen() {
  const confirm = useConfirm();
  const theme = useTheme();
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
    confirm({
      title: 'Delete location?',
      message: `"${location.name}" and all of its reviews and photos will be permanently removed.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
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
    });
  }

  return (
    <PageScreen title="All locations" isLoading={isLoading} error={error}>
      {!isLoading && locations.length > 0 && (
        <ThemedText themeColor="textSecondary" type="small">
          {locations.length} location{locations.length === 1 ? '' : 's'}, newest first. Pending ones are
          approved or rejected from Location approvals.
        </ThemedText>
      )}

      {!isLoading && locations.length === 0 && <EmptyState icon="map" message="No locations yet" />}

      <View>
        {locations.map((location, index) => {
          const isBusy = busyId === location.id;
          const hasRating = location.review_count > 0 && location.average_rating !== null;
          return (
            <View
              key={location.id}
              style={[
                styles.item,
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
              <StatusPill
                label={LOCATION_STATUS_LABEL[location.status]}
                color={LOCATION_STATUS_COLOR[location.status]}
                containerColor={LOCATION_STATUS_CONTAINER[location.status]}
              />
              {location.address && (
                <ThemedText type="small" themeColor="textSecondary">
                  {location.address}
                </ThemedText>
              )}
              <ThemedText type="label" themeColor="textSecondary">
                Added {new Date(location.created_at).toLocaleDateString()} by{' '}
                {location.submitted_by === null ? 'a deleted user' : (location.submitter_email ?? 'unknown user')}
              </ThemedText>
              <View style={styles.actions}>
                <ThemedButton
                  label="View"
                  variant="text"
                  onPress={() => router.push(`/location/${location.id}`)}
                  disabled={isBusy}
                />
                <ThemedButton
                  label="Delete"
                  variant="textDanger"
                  onPress={() => confirmDelete(location)}
                  loading={isBusy}
                  disabled={isBusy}
                />
              </View>
            </View>
          );
        })}
      </View>
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  item: {
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.one,
  },
});
