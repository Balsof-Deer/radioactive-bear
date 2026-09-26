import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { PageScreen } from '@/components/page-screen';
import { StatusPill } from '@/components/status-pill';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  approveLocation,
  deleteLocation,
  fetchPendingLocations,
  makeLocationVisibleNow,
  rejectLocation,
  type PendingLocation,
} from '@/lib/admin';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_CONTAINER, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import { useConfirm } from '@/lib/confirm';

export default function ApprovalsScreen() {
  const confirm = useConfirm();
  const theme = useTheme();
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
    confirm({
      title: 'Delete location?',
      message: `"${location.name}" and all of its reviews and photos will be permanently removed.`,
      confirmLabel: 'Delete',
      onConfirm: () => runAction(location.id, () => deleteLocation(location.id)),
    });
  }

  return (
    <PageScreen title="Location approvals" isLoading={isLoading} error={error}>
      {!isLoading && locations.length === 0 && <EmptyState icon="inbox" message="Nothing to approve" />}

      <View>
        {locations.map((location, index) => {
          const isBusy = busyId === location.id;
          return (
            <View
              key={location.id}
              style={[
                styles.item,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
              ]}>
              <ThemedText type="heading">{location.name}</ThemedText>
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
              {location.description && <ThemedText type="small">{location.description}</ThemedText>}
              <ThemedText type="label" themeColor="textSecondary">
                Submitted {new Date(location.created_at).toLocaleDateString()} by{' '}
                {location.submitted_by === null ? 'a deleted user' : (location.submitter_email ?? 'unknown user')}
              </ThemedText>

              {rejectingId === location.id ? (
                <View style={styles.rejectForm}>
                  <ThemedTextInput
                    placeholder="Reason (optional, shown to the submitter)"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    accessibilityLabel="Reason for rejecting"
                  />
                  <View style={styles.buttonRow}>
                    <ThemedButton label="Cancel" variant="text" onPress={() => setRejectingId(null)} />
                    <ThemedButton label="Reject" variant="danger" onPress={() => confirmReject(location.id)} />
                  </View>
                </View>
              ) : (
                <View style={styles.actions}>
                  <ThemedButton
                    label="Approve"
                    onPress={() => runAction(location.id, () => approveLocation(location.id))}
                    loading={isBusy}
                    disabled={isBusy}
                  />
                  <ThemedButton
                    label="View"
                    variant="text"
                    onPress={() => router.push(`/location/${location.id}`)}
                    disabled={isBusy}
                  />
                  {location.status === 'pending_private' && (
                    <ThemedButton
                      label="Make visible now"
                      variant="text"
                      onPress={() => runAction(location.id, () => makeLocationVisibleNow(location.id))}
                      disabled={isBusy}
                    />
                  )}
                  <ThemedButton label="Reject" variant="text" onPress={() => startReject(location.id)} disabled={isBusy} />
                  <ThemedButton
                    label="Delete"
                    variant="textDanger"
                    onPress={() => confirmDelete(location)}
                    disabled={isBusy}
                  />
                </View>
              )}
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  rejectForm: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
});
