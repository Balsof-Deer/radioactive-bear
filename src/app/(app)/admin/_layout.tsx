import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/lib/auth-context';

// UI-level guard only: the database's RLS policies are what actually stop
// a non-admin from reading or changing admin data.
export default function AdminLayout() {
  const { profile } = useSession();

  if (profile?.role !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="approvals" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="invites" />
      <Stack.Screen name="users" />
      <Stack.Screen name="manage-tags" />
    </Stack>
  );
}
