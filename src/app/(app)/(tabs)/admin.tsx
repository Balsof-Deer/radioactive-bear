import { router, type Href } from 'expo-router';
import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MenuButton } from '@/components/menu-button';
import { NotificationBadge } from '@/components/notification-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AdminSection, BadgeCounts } from '@/lib/admin';
import { useAdminBadges } from '@/lib/admin-badges';
import { timeAgo } from '@/lib/time';

type AdminLink = {
  label: string;
  description: string;
  href: Href;
  icon: AndroidSymbol;
  badge?: keyof BadgeCounts;
  // Sections tracked with a shared "last checked" marker.
  section?: AdminSection;
};

const LINKS: AdminLink[] = [
  {
    label: 'Location approvals',
    description: 'Approve, reject, or open up new submissions early.',
    href: '/admin/approvals',
    icon: 'fact_check',
    badge: 'pending_locations',
  },
  {
    label: 'All locations',
    description: 'Every location in the app, whatever its status.',
    href: '/admin/locations',
    icon: 'map',
    badge: 'new_locations',
    section: 'locations',
  },
  {
    label: 'Review moderation',
    description: 'Recent reviews across every location.',
    href: '/admin/reviews',
    icon: 'reviews',
    badge: 'new_reviews',
    section: 'reviews',
  },
  {
    label: 'Users',
    description: 'Everyone with an account, and their role.',
    href: '/admin/users',
    icon: 'group',
    badge: 'new_users',
    section: 'users',
  },
  {
    label: 'Admin invites',
    description: 'Create invite codes to add another admin.',
    href: '/admin/invites',
    icon: 'key',
  },
  {
    label: 'Manage tags',
    description: 'The amenity tags locations can be labeled with.',
    href: '/admin/manage-tags',
    icon: 'sell',
  },
];

export default function AdminHomeScreen() {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const { counts, checks } = useAdminBadges();
  const iconSize = Typography.bodyLarge.lineHeight * fontScale;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleRow}>
            <MenuButton />
            <ThemedText type="title">Admin</ThemedText>
          </View>

          <View>
            {LINKS.map((link, index) => {
              const check = link.section ? checks[link.section] : undefined;
              return (
                // The whole row opens the section; the ripple is the M3 pressed state.
                <Pressable
                  key={link.label}
                  accessibilityRole="button"
                  accessibilityLabel={link.label}
                  accessibilityHint={link.description}
                  onPress={() => router.push(link.href)}
                  android_ripple={{ color: withAlpha(theme.onSurface, 0.1) }}
                  style={[
                    styles.row,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
                  ]}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.primaryContainer, padding: iconSize * 0.4 }]}>
                    <SymbolView
                      name={{ android: link.icon, web: link.icon }}
                      size={iconSize}
                      tintColor={theme.onPrimaryContainer}
                    />
                  </View>
                  <View style={styles.rowText}>
                    <ThemedText type="heading">{link.label}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {link.description}
                    </ThemedText>
                    {link.section && (
                      <ThemedText type="label" themeColor="textSecondary">
                        {check
                          ? `Last checked by ${check.checked_by_name ?? 'a removed admin'}, ${timeAgo(check.last_checked_at)}`
                          : 'Not checked yet'}
                      </ThemedText>
                    )}
                  </View>
                  {link.badge && counts && <NotificationBadge count={counts[link.badge]} />}
                  <SymbolView
                    name={{ android: 'chevron_right', web: 'chevron_right' }}
                    size={iconSize}
                    tintColor={theme.outline}
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  iconCircle: {
    borderRadius: Radius.full,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
});
