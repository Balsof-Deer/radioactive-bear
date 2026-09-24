import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  approveLocation,
  deleteLocation,
  fetchPendingLocations,
  makeLocationVisibleNow,
  rejectLocation,
  type PendingLocation,
} from '@/lib/admin';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_LABEL } from '@/lib/location-status';

export default function ApprovalsScreen() {
  const [locations, setLocations] = useState<PendingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setLocations(await fetchPendingLocations());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load pending locations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Standard fetch-on-mount; `load` is also the refresh after each action.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function runAction(locationId: string, action: () => Promise<void>) {
    setBusyId(locationId);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  function startReject(locationId: string) {
    setRejectingId(locationId);
    setRejectReason('');
  }

  function confirmReject(locationId: string) {
    const reason = rejectReason.trim();
    setRejectingId(null);
    runAction(locationId, () => rejectLocation(locationId, reason));
  }

  function confirmDelete(location: PendingLocation) {
    Alert.alert(
      'Delete location?',
      `"${location.name}" and all of its reviews and photos will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => runAction(location.id, () => deleteLocation(location.id)) },
      ]
    );
  }

  return (
    <AdminScreen title="Location approvals" isLoading={isLoading} error={error}>
      {!isLoading && locations.length === 0 && (
        <ThemedText themeColor="textSecondary" type="small">
          Nothing waiting for approval.
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
            {location.description && <ThemedText type="small">{location.description}</ThemedText>}
            <ThemedText themeColor="textSecondary" type="small">
              Submitted {new Date(location.created_at).toLocaleDateString()} by{' '}
              {location.submitter_email ?? 'unknown user'}
            </ThemedText>

            {rejectingId === location.id ? (
              <ThemedView type="backgroundElement" style={styles.rejectForm}>
                <ThemedTextInput
                  placeholder="Reason (optional, shown to the submitter)"
                  value={rejectReason}
                  onChangeText={setRejectReason}
                />
                <ThemedButton label="Confirm reject" onPress={() => confirmReject(location.id)} />
                <ThemedButton label="Cancel" variant="secondary" onPress={() => setRejectingId(null)} />
              </ThemedView>
            ) : (
              <ThemedView type="backgroundElement" style={styles.actions}>
                <ThemedButton
                  label="View"
                  variant="secondary"
                  onPress={() => router.push(`/location/${location.id}`)}
                  disabled={isBusy}
                />
                <ThemedButton
                  label="Approve"
                  onPress={() => runAction(location.id, () => approveLocation(location.id))}
                  loading={isBusy}
                  disabled={isBusy}
                />
                {location.status === 'pending_private' && (
                  <ThemedButton
                    label="Make visible now"
                    variant="secondary"
                    onPress={() => runAction(location.id, () => makeLocationVisibleNow(location.id))}
                    disabled={isBusy}
                  />
                )}
                <ThemedButton
                  label="Reject"
                  variant="secondary"
                  onPress={() => startReject(location.id)}
                  disabled={isBusy}
                />
                <ThemedButton
                  label="Delete"
                  variant="secondary"
                  onPress={() => confirmDelete(location)}
                  disabled={isBusy}
                />
              </ThemedView>
            )}
          </ThemedView>
        );
      })}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  rejectForm: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
