import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { PageScreen } from '@/components/page-screen';
import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchUsers, type AdminUser } from '@/lib/admin';
import { useAdminBadges } from '@/lib/admin-badges';

export default function UsersScreen() {
  const theme = useTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUsers(await fetchUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { markChecked } = useAdminBadges();

  // Opening this page clears its badge for every admin and records who checked.
  useEffect(() => {
    markChecked('users');
  }, [markChecked]);

  useEffect(() => {
    // Standard fetch-on-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const adminCount = users.filter((user) => user.role === 'admin').length;

  return (
    <PageScreen title="Users" isLoading={isLoading} error={error}>
      {!isLoading && users.length > 0 && (
        <ThemedText themeColor="textSecondary" type="small">
          {users.length} account{users.length === 1 ? '' : 's'}, {adminCount} admin
          {adminCount === 1 ? '' : 's'}. New admins are added with invite codes.
        </ThemedText>
      )}

      {!isLoading && users.length === 0 && <EmptyState icon="group" message="No users yet" />}

      <View>
        {users.map((user, index) => (
          <View
            key={user.id}
            style={[
              styles.item,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
            ]}>
            <View style={styles.titleRow}>
              <ThemedText type="heading" style={styles.name}>
                {user.display_name ?? user.email}
              </ThemedText>
              {user.role === 'admin' ? (
                <StatusPill label="Admin" color="onPrimaryContainer" containerColor="primaryContainer" />
              ) : (
                <StatusPill label="Student" color="onSurfaceVariant" containerColor="surfaceContainerLow" />
              )}
            </View>
            {user.display_name && (
              <ThemedText type="small" themeColor="textSecondary">
                {user.email}
              </ThemedText>
            )}
            <ThemedText type="label" themeColor="textSecondary">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </ThemedText>
          </View>
        ))}
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
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
});
