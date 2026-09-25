import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MenuButton } from '@/components/menu-button';
import { NotificationBadge } from '@/components/notification-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Shape, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AdminSection, BadgeCounts } from '@/lib/admin';
import { useAdminBadges } from '@/lib/admin-badges';
import { useSession } from '@/lib/auth-context';
import { timeAgo } from '@/lib/time';

type AdminLink = {
  label: string;
  description: string;
  href: Href;
  badge?: keyof BadgeCounts;
  // Sections tracked with a shared "last checked" marker.
  section?: AdminSection;
};

const LINKS: AdminLink[] = [
  {
    label: 'Location approvals',
    description: 'Approve, reject, or open up new submissions early.',
    href: '/admin/approvals',
    badge: 'pending_locations',
  },
  {
    label: 'All locations',
    description: 'Every location in the app, whatever its status.',
    href: '/admin/locations',
    badge: 'new_locations',
    section: 'locations',
  },
  {
    label: 'Review moderation',
    description: 'Recent reviews across every location.',
    href: '/admin/reviews',
    badge: 'new_reviews',
    section: 'reviews',
  },
  {
    label: 'Users',
    description: 'Everyone with an account, and their role.',
    href: '/admin/users',
    badge: 'new_users',
    section: 'users',
  },
  { label: 'Admin invites', description: 'Create invite codes to add another admin.', href: '/admin/invites' },
  { label: 'Manage tags', description: 'The amenity tags locations can be labeled with.', href: '/admin/manage-tags' },
];

export default function AdminHomeScreen() {
  const theme = useTheme();
  const { profile } = useSession();
  const { counts, checks } = useAdminBadges();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.titleRow}>
            <MenuButton />
            <ThemedText type="title" style={styles.title}>
              Admin
            </ThemedText>
          </ThemedView>
          <ThemedText themeColor="textSecondary">{profile?.email}</ThemedText>

          {LINKS.map((link) => {
            const check = link.section ? checks[link.section] : undefined;
            return (
              // The whole tile opens the section; the ripple is the M3 pressed state.
              <Pressable
                key={link.label}
                accessibilityRole="button"
                accessibilityLabel={link.label}
                accessibilityHint={link.description}
                onPress={() => router.push(link.href)}
                android_ripple={{ color: withAlpha(theme.onSurface, 0.1), foreground: true }}
                style={[styles.linkCard, { backgroundColor: theme.backgroundElement }]}>
                <ThemedView type="backgroundElement" style={styles.cardHeader}>
                  <ThemedText type="smallBold" style={styles.cardTitle}>
                    {link.label}
                  </ThemedText>
                  {link.badge && counts && <NotificationBadge count={counts[link.badge]} />}
                </ThemedView>
                <ThemedText themeColor="textSecondary" type="small">
                  {link.description}
                </ThemedText>
                {link.section && (
                  <ThemedText themeColor="textSecondary" type="small">
                    {check
                      ? `Last checked by ${check.checked_by_name ?? 'a removed admin'}, ${timeAgo(check.last_checked_at)}`
                      : 'Not checked yet'}
                  </ThemedText>
                )}
              </Pressable>
            );
          })}
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  linkCard: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Shape.extraLarge,
    // Keeps the ripple inside the rounded corners.
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardTitle: {
    flexShrink: 1,
  },
});
