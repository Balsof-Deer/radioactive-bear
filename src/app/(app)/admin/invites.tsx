import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { PageScreen } from '@/components/page-screen';
import { StatusPill } from '@/components/status-pill';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createInvite, fetchInvites, type AdminInvite } from '@/lib/admin';
import { useToast } from '@/lib/toast';

type InviteStatus = { label: string; color: ThemeColor; containerColor: ThemeColor };

function inviteStatus(invite: AdminInvite): InviteStatus {
  if (invite.used_at) return { label: 'Used', color: 'onSurfaceVariant', containerColor: 'surfaceContainerLow' };
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { label: 'Expired', color: 'statusBusy', containerColor: 'statusBusyContainer' };
  }
  return { label: 'Active', color: 'statusGood', containerColor: 'statusGoodContainer' };
}

export default function InvitesScreen() {
  const theme = useTheme();
  const { showSuccess } = useToast();
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

  async function copyCode(code: string) {
    try {
      await Clipboard.setStringAsync(code);
      showSuccess('Invite code copied.');
    } catch {
      setError('Could not copy the code. Press and hold it to copy instead.');
    }
  }

  return (
    <PageScreen title="Admin invites" isLoading={isLoading} error={error}>
      <View style={styles.section}>
        <ThemedText type="heading">Create an invite</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Codes work once and expire after 72 hours. Optionally lock one to a specific email so only that account
          can use it. The person redeems it in Profile.
        </ThemedText>
        <ThemedTextInput
          placeholder="Email (optional)"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Email to lock the invite to (optional)"
        />
        <View style={styles.endRow}>
          <ThemedButton label="Create invite" onPress={handleCreate} loading={isCreating} disabled={isCreating} />
        </View>

        {newInvite && (
          <View style={[styles.codeBlock, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
            <View style={styles.codeText}>
              <ThemedText type="label" themeColor="textSecondary">
                New invite code
              </ThemedText>
              <ThemedText type="code" selectable>
                {newInvite.code}
              </ThemedText>
            </View>
            <ThemedButton label="Copy" variant="secondary" onPress={() => copyCode(newInvite.code)} />
          </View>
        )}
      </View>

      <View style={[styles.section, styles.fill]}>
        <ThemedText type="heading">Invites</ThemedText>
        {!isLoading && invites.length === 0 && <EmptyState icon="key" message="No invites yet" />}
        <View>
          {invites.map((invite, index) => {
            const status = inviteStatus(invite);
            return (
              <View
                key={invite.id}
                style={[
                  styles.item,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
                ]}>
                <View style={styles.titleRow}>
                  <ThemedText type="code" selectable style={styles.code}>
                    {invite.code}
                  </ThemedText>
                  <StatusPill label={status.label} color={status.color} containerColor={status.containerColor} />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {invite.restricted_email ? `Only for ${invite.restricted_email}` : 'Any account'}
                </ThemedText>
                <ThemedText type="label" themeColor="textSecondary">
                  Expires {new Date(invite.expires_at).toLocaleString()}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  // Takes the rest of the page, so "No invites yet" centres below the form.
  fill: {
    flexGrow: 1,
  },
  endRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  codeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  codeText: {
    flex: 1,
    gap: Spacing.half,
  },
  item: {
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  code: {
    flex: 1,
  },
});
