import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { StarRating } from '@/components/star-rating';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchRecentReviews, type ModerationReview } from '@/lib/admin';
import { useAdminBadges } from '@/lib/admin-badges';
import { deleteReview } from '@/lib/reviews';

export default function ReviewModerationScreen() {
  const [reviews, setReviews] = useState<ModerationReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setReviews(await fetchRecentReviews());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reviews.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { markChecked } = useAdminBadges();

  // Opening this page clears its badge for every admin and records who checked.
  useEffect(() => {
    markChecked('reviews');
  }, [markChecked]);

  useEffect(() => {
    // Standard fetch-on-mount; `load` is also the refresh after a delete.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function confirmDelete(review: ModerationReview) {
    Alert.alert('Delete review?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(review.id);
            await load();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not delete this review.');
          }
        },
      },
    ]);
  }

  return (
    <AdminScreen title="Review moderation" isLoading={isLoading} error={error}>
      <ThemedText themeColor="textSecondary" type="small">
        The 50 most recent reviews. Admins can delete a review but only its author can edit it.
      </ThemedText>

      {!isLoading && reviews.length === 0 && (
        <ThemedText themeColor="textSecondary" type="small">
          No reviews yet.
        </ThemedText>
      )}

      {reviews.map((review) => (
        <ThemedView key={review.id} type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">{review.location_name ?? 'Unknown location'}</ThemedText>
          <ThemedView type="backgroundElement" style={styles.headerRow}>
            <ThemedText type="small">
              {review.reviewer_display_name ?? review.reviewer_email ?? 'Unknown user'}
            </ThemedText>
            <StarRating value={review.overall_rating} size={16} />
          </ThemedView>
          {review.body && <ThemedText type="small">{review.body}</ThemedText>}
          <ThemedText themeColor="textSecondary" type="small">
            {new Date(review.created_at).toLocaleDateString()}
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.actions}>
            <ThemedButton
              label="Open location"
              variant="secondary"
              onPress={() => router.push(`/location/${review.location_id}`)}
            />
            <ThemedButton label="Delete" variant="secondary" onPress={() => confirmDelete(review)} />
          </ThemedView>
        </ThemedView>
      ))}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
