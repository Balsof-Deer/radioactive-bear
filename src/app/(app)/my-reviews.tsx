import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { PageScreen } from '@/components/page-screen';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { Shape, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-context';
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

      {reviews.map((review) => (
        // Tapping a review opens its location, where it can be edited.
        <Pressable
          key={review.id}
          accessibilityRole="button"
          accessibilityHint="Opens this location"
          onPress={() => router.push(`/location/${review.location_id}`)}
          android_ripple={{ color: withAlpha(theme.onSurface, 0.1), foreground: true }}
          style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">{review.location_name ?? 'Unknown location'}</ThemedText>
          <StarRating value={review.overall_rating} size={16} />
          {review.body && <ThemedText type="small">{review.body}</ThemedText>}
          <ThemedText themeColor="textSecondary" type="small">
            {new Date(review.created_at).toLocaleDateString()}
          </ThemedText>
        </Pressable>
      ))}
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Shape.extraLarge,
    overflow: 'hidden',
  },
});
