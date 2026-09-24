import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchUsers, type AdminUser } from '@/lib/admin';
import { useAdminBadges } from '@/lib/admin-badges';

export default function UsersScreen() {
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
    <AdminScreen title="Users" isLoading={isLoading} error={error}>
      {!isLoading && (
        <ThemedText themeColor="textSecondary" type="small">
          {users.length} account{users.length === 1 ? '' : 's'}, {adminCount} admin
          {adminCount === 1 ? '' : 's'}. New admins are added with invite codes.
        </ThemedText>
      )}

      {users.map((user) => (
        <ThemedView key={user.id} type="backgroundElement" style={styles.card}>
          <ThemedView type="backgroundElement" style={styles.row}>
            <ThemedText type="smallBold" style={styles.name}>
              {user.display_name ?? user.email}
            </ThemedText>
            <ThemedText type="small" themeColor={user.role === 'admin' ? 'tint' : 'textSecondary'}>
              {user.role === 'admin' ? 'Admin' : 'Student'}
            </ThemedText>
          </ThemedView>
          {user.display_name && (
            <ThemedText themeColor="textSecondary" type="small">
              {user.email}
            </ThemedText>
          )}
          <ThemedText themeColor="textSecondary" type="small">
            Joined {new Date(user.created_at).toLocaleDateString()}
          </ThemedText>
        </ThemedView>
      ))}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.half,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flexShrink: 1,
  },
});
