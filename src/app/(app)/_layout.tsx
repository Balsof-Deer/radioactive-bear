import { Stack } from 'expo-router';

import { AdminBadgesProvider } from '@/lib/admin-badges';
import { AppMenuProvider } from '@/lib/app-menu';

export default function AppLayout() {
  return (
    <AdminBadgesProvider>
      <AppMenuProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-location" options={{ presentation: 'modal' }} />
          <Stack.Screen name="location-submitted" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="location/[id]" />
          <Stack.Screen name="admin" />
        </Stack>
      </AppMenuProvider>
    </AdminBadgesProvider>
  );
}
