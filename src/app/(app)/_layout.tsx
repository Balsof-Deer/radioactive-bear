import { Stack } from 'expo-router';

import { AdminBadgesProvider } from '@/lib/admin-badges';

export default function AppLayout() {
  return (
    <AdminBadgesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-location" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="location/[id]" />
        <Stack.Screen name="admin" />
      </Stack>
    </AdminBadgesProvider>
  );
}
