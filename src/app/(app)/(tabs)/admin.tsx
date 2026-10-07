import { router, type Href } from 'expo-router';
import { type AndroidSymbol } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListGroup } from '@/components/list-group';
import { MenuButton } from '@/components/menu-button';
import { NotificationBadge } from '@/components/notification-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
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
  const tabBarInset = useTabBarInset();
  const { counts, checks } = useAdminBadges();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarInset + Spacing.three }]}>
          <View style={styles.titleRow}>
            <MenuButton />
            <ThemedText type="title">Admin</ThemedText>
          </View>

          <ListGroup
            items={LINKS.map((link) => {
              const check = link.section ? checks[link.section] : undefined;
              return {
                key: link.label,
                icon: link.icon,
                title: link.label,
                subtitle: link.description,
                detail: link.section
                  ? check
                    ? `Last checked by ${check.checked_by_name ?? 'a removed admin'}, ${timeAgo(check.last_checked_at)}`
                    : 'Not checked yet'
                  : undefined,
                trailing: link.badge && counts ? <NotificationBadge count={counts[link.badge]} /> : undefined,
                onPress: () => router.push(link.href),
              };
            })}
          />
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
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
