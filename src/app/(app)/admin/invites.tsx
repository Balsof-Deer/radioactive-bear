import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { PageScreen } from '@/components/page-screen';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Shape, Spacing } from '@/constants/theme';
import { createInvite, fetchInvites, type AdminInvite } from '@/lib/admin';

function inviteStatus(invite: AdminInvite): { label: string; color: 'textSecondary' | 'tint' | 'danger' } {
  if (invite.used_at) return { label: 'Used', color: 'textSecondary' };
  if (new Date(invite.expires_at).getTime() < Date.now()) return { label: 'Expired', color: 'danger' };
  return { label: 'Active', color: 'tint' };
}

export default function InvitesScreen() {
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newInvite, setNewInvite] = useState<AdminInvite | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setInvites(await fetchInvites());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load invites.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Standard fetch-on-mount; `load` is also the refresh after creating one.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);
    try {
      setNewInvite(await createInvite(email));
      setEmail('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invite.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <PageScreen title="Admin invites" isLoading={isLoading} error={error}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Create an invite</ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          Codes work once and expire after 72 hours. Optionally lock one to a specific email so only that
          account can use it. The person redeems it in Settings.
        </ThemedText>
        <ThemedTextInput
          placeholder="Email (optional)"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <ThemedButton label="Create invite" onPress={handleCreate} loading={isCreating} disabled={isCreating} />

        {newInvite && (
          <ThemedView style={styles.newCode}>
            <ThemedText type="small">New invite code (press and hold to copy):</ThemedText>
            <ThemedText type="smallBold" selectable style={styles.code}>
              {newInvite.code}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      {!isLoading && invites.length === 0 && (
        <ThemedText themeColor="textSecondary" type="small">
          No invites created yet.
        </ThemedText>
      )}

      {invites.map((invite) => {
        const status = inviteStatus(invite);
        return (
          <ThemedView key={invite.id} type="backgroundElement" style={styles.card}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText type="smallBold" selectable>
                {invite.code}
              </ThemedText>
              <ThemedText type="small" themeColor={status.color}>
                {status.label}
              </ThemedText>
            </ThemedView>
            <ThemedText themeColor="textSecondary" type="small">
              {invite.restricted_email ? `Only for ${invite.restricted_email}` : 'Any account'} · expires{' '}
              {new Date(invite.expires_at).toLocaleString()}
            </ThemedText>
          </ThemedView>
        );
      })}
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Shape.extraLarge,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  newCode: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  code: {
    fontSize: 18,
    lineHeight: 26,
  },
});
