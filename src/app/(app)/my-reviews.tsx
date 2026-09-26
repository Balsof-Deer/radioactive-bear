import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PageScreen } from '@/components/page-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-context';
import { formatRating } from '@/lib/rating';
import { fetchMyReviews, type MyReview } from '@/lib/reviews';

export default function MyReviewsScreen() {
  const theme = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMyReviews(userId)
      .then((rows) => {
        if (!cancelled) setReviews(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your reviews.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <PageScreen title="My reviews" isLoading={isLoading} error={error}>
      {!isLoading && !error && reviews.length === 0 && (
        <ThemedText themeColor="textSecondary" type="small">
          You haven&apos;t written any reviews yet.
        </ThemedText>
      )}

      <View>
        {reviews.map((review, index) => (
          // Tapping a review opens its location, where it can be edited.
          <Pressable
            key={review.id}
            accessibilityRole="button"
            accessibilityHint="Opens this location"
            onPress={() => router.push(`/location/${review.location_id}`)}
            android_ripple={{ color: withAlpha(theme.onSurface, 0.1) }}
            style={[
              styles.row,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
            ]}>
            <View style={styles.titleRow}>
              <ThemedText type="heading" style={styles.name}>
                {review.location_name ?? 'Unknown location'}
              </ThemedText>
              <ThemedText type="heading" accessibilityLabel={`You rated it ${formatRating(review.overall_rating)} out of 5`}>
                {formatRating(review.overall_rating)}
              </ThemedText>
            </View>
            {review.body && (
              <ThemedText type="small" numberOfLines={3}>
                {review.body}
              </ThemedText>
            )}
            <ThemedText type="label" themeColor="textSecondary">
              {new Date(review.created_at).toLocaleDateString()}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
});
