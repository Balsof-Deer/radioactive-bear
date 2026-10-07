import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Loading } from '@/components/loading';
import { MenuButton } from '@/components/menu-button';
import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Elevation, MaxContentWidth, Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-context';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_CONTAINER, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import { fetchMyLocations, type MyLocation } from '@/lib/locations';
import { formatRating } from '@/lib/rating';
import { fetchMyReviews, type MyReview } from '@/lib/reviews';
import { useErrorToast } from '@/lib/toast';

type Tab = 'locations' | 'reviews';

// Everything the student has added, in one tab: the locations they
// submitted (with their approval status) and the reviews they wrote.
// Reloads each time the tab comes into focus, so new additions show up.
export default function MySpotsScreen() {
  const tabBarInset = useTabBarInset();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.bodyMediumBold.lineHeight * fontScale;
  const [tab, setTab] = useState<Tab>('locations');
  const [locations, setLocations] = useState<MyLocation[]>([]);
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useErrorToast(error);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let cancelled = false;
      Promise.all([fetchMyLocations(userId), fetchMyReviews(userId)])
        .then(([locationRows, reviewRows]) => {
          if (cancelled) return;
          setLocations(locationRows);
          setReviews(reviewRows);
          setError(null);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your spots.');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [userId])
  );

  // Adding a spot starts the pin where the student is; without location
  // access, the Explore map is the way to pick a place.
  async function handleAddSpot() {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      router.navigate('/explore');
      return;
    }
    const position = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({}));
    router.push({
      pathname: '/add-location',
      params: { lat: String(position.coords.latitude), lng: String(position.coords.longitude) },
    });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'locations', label: `Locations · ${locations.length}` },
    { key: 'reviews', label: `Reviews · ${reviews.length}` },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            // Room for the extended FAB and the floating tab bar.
            { paddingBottom: insets.bottom + tabBarInset + lineHeight * 2.8 + Spacing.three },
          ]}>
          <View style={styles.headerRow}>
            <MenuButton />
            <ThemedText type="title">My spots</ThemedText>
          </View>

          {/* Segmented control: a sand track with the selected tab in the primary colour. */}
          <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: theme.surfaceContainerHigh }]}>
            {tabs.map((item) => {
              const selected = item.key === tab;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setTab(item.key)}
                  style={[
                    styles.tab,
                    { minHeight: lineHeight * 2.2, backgroundColor: selected ? theme.primary : 'transparent' },
                  ]}>
                  <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.onSurfaceVariant }}>
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {isLoading && <Loading style={styles.loading} />}

          {!isLoading && tab === 'locations' && locations.length === 0 && (
            <EmptyState icon="add_location_alt" message="You haven't added any spots yet." />
          )}
          {!isLoading && tab === 'reviews' && reviews.length === 0 && (
            <EmptyState icon="rate_review" message="You haven't written any reviews yet." />
          )}

          {!isLoading && tab === 'locations' && (
            <View style={styles.list}>
              {locations.map((location) => {
                const hasRating = location.review_count > 0 && location.average_rating !== null;
                return (
                  <Pressable
                    key={location.id}
                    accessibilityRole="button"
                    accessibilityHint="Opens this location"
                    onPress={() => router.push(`/location/${location.id}`)}
                    android_ripple={{ color: withAlpha(theme.onSurface, 0.1) }}
                    style={[
                      styles.card,
                      { backgroundColor: theme.surfaceContainer, borderColor: theme.outlineVariant },
                    ]}>
                    <View style={styles.titleRow}>
                      <ThemedText type="heading" style={styles.name}>
                        {location.name}
                      </ThemedText>
                      <ThemedText
                        type="heading"
                        themeColor={hasRating ? 'primary' : 'textSecondary'}
                        accessibilityLabel={
                          hasRating
                            ? `Rated ${formatRating(location.average_rating)} out of 5 from ${location.review_count} review${location.review_count === 1 ? '' : 's'}`
                            : 'No reviews yet'
                        }>
                        {hasRating ? formatRating(location.average_rating) : 'New'}
                      </ThemedText>
                    </View>
                    {location.address && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {location.address}
                      </ThemedText>
                    )}
                    <View style={styles.metaRow}>
                      <StatusPill
                        label={LOCATION_STATUS_LABEL[location.status]}
                        color={LOCATION_STATUS_COLOR[location.status]}
                        containerColor={LOCATION_STATUS_CONTAINER[location.status]}
                      />
                      <ThemedText type="label" themeColor="textSecondary">
                        {location.status === 'pending_private'
                          ? 'Only you and admins can see it for now'
                          : `Added ${new Date(location.created_at).toLocaleDateString()}`}
                      </ThemedText>
                    </View>
                    {location.status === 'rejected' && location.admin_rejection_reason && (
                      <View style={[styles.reason, { backgroundColor: theme.surfaceContainerLowest }]}>
                        <ThemedText type="small">
                          <ThemedText type="smallBold">Reason: </ThemedText>
                          {location.admin_rejection_reason}
                        </ThemedText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {!isLoading && tab === 'reviews' && (
            <View style={styles.list}>
              {reviews.map((review) => (
                // Tapping a review opens its location, where it can be edited.
                <Pressable
                  key={review.id}
                  accessibilityRole="button"
                  accessibilityHint="Opens this location"
                  onPress={() => router.push(`/location/${review.location_id}`)}
                  android_ripple={{ color: withAlpha(theme.onSurface, 0.1) }}
                  style={[styles.card, { backgroundColor: theme.surfaceContainer, borderColor: theme.outlineVariant }]}>
                  <View style={styles.titleRow}>
                    <ThemedText type="heading" style={styles.name}>
                      {review.location_name ?? 'Unknown location'}
                    </ThemedText>
                    <View
                      accessible
                      accessibilityLabel={`You rated it ${formatRating(review.overall_rating)} out of 5`}
                      style={[styles.ratingChip, { backgroundColor: theme.primaryContainer }]}>
                      <SymbolView
                        name={{ android: 'star', web: 'star' }}
                        size={lineHeight * 0.8}
                        tintColor={theme.onPrimaryContainer}
                      />
                      <ThemedText type="smallBold" style={{ color: theme.onPrimaryContainer }}>
                        {formatRating(review.overall_rating)}
                      </ThemedText>
                    </View>
                  </View>
                  {review.body && (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
                      {review.body}
                    </ThemedText>
                  )}
                  <ThemedText type="label" themeColor="textSecondary">
                    {new Date(review.created_at).toLocaleDateString()}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Accent "Add a spot" pill, above the tab bar. */}
        <Pressable
          accessibilityRole="button"
          onPress={handleAddSpot}
          android_ripple={{ color: withAlpha(theme.onAccent, 0.12) }}
          style={[
            styles.fab,
            {
              backgroundColor: theme.accent,
              minHeight: lineHeight * 2.8,
              paddingHorizontal: lineHeight,
              bottom: insets.bottom + tabBarInset,
            },
          ]}>
          <SymbolView name={{ android: 'add', web: 'add' }} size={lineHeight * 1.2} tintColor={theme.onAccent} />
          <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
            Add a spot
          </ThemedText>
        </Pressable>
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
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.one,
    borderRadius: Radius.full,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  list: {
    gap: Spacing.two,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  reason: {
    borderRadius: Radius.md,
    padding: Spacing.two + Spacing.one,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one,
  },
  loading: {
    alignSelf: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.full,
    boxShadow: Elevation.level2,
    overflow: 'hidden',
  },
});
