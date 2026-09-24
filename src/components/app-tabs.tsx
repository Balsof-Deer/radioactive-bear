import { router } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAdminBadges } from '@/lib/admin-badges';
import { useSession } from '@/lib/auth-context';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { profile } = useSession();
  const isAdmin = profile?.role === 'admin';
  const { total: adminBadgeTotal } = useAdminBadges();
  const didLandAdmin = useRef(false);

  // Admins land on their own home (the Admin tab) when the app opens,
  // but can still switch to Home/Explore freely afterwards.
  useEffect(() => {
    if (isAdmin && !didLandAdmin.current) {
      didLandAdmin.current = true;
      router.navigate('/admin');
    }
  }, [isAdmin]);

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {/* Hidden tabs can't be navigated to at all, so students never reach it. */}
      <NativeTabs.Trigger name="admin" hidden={!isAdmin}>
        <NativeTabs.Trigger.Label>Admin</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="admin_panel_settings" sf="shield.lefthalf.filled" />
        <NativeTabs.Trigger.Badge hidden={adminBadgeTotal === 0}>
          {adminBadgeTotal > 99 ? '99+' : String(adminBadgeTotal)}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
