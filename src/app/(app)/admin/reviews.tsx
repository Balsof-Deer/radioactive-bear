import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { PageScreen } from '@/components/page-screen';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchRecentReviews, type ModerationReview } from '@/lib/admin';
import { useAdminBadges } from '@/lib/admin-badges';
import { formatRating } from '@/lib/rating';
import { deleteReview } from '@/lib/reviews';
import { useConfirm } from '@/lib/confirm';

export default function ReviewModerationScreen() {
  const confirm = useConfirm();
  const theme = useTheme();
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
    confirm({
      title: 'Delete review?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteReview(review.id);
          await load();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not delete this review.');
        }
      },
    });
  }

  return (
    <PageScreen title="Review moderation" isLoading={isLoading} error={error}>
      {reviews.length > 0 && (
        <ThemedText themeColor="textSecondary" type="small">
          The 50 most recent reviews. Admins can delete a review but only its author can edit it.
        </ThemedText>
      )}

      {!isLoading && reviews.length === 0 && <EmptyState icon="rate_review" message="No reviews yet" />}

      <View>
        {reviews.map((review, index) => (
          <View
            key={review.id}
            style={[
              styles.item,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
            ]}>
            <View style={styles.titleRow}>
              <ThemedText type="heading" style={styles.name}>
                {review.location_name ?? 'Unknown location'}
              </ThemedText>
              <ThemedText type="heading" accessibilityLabel={`Rated ${formatRating(review.overall_rating)} out of 5`}>
                {formatRating(review.overall_rating)}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {review.reviewer_display_name ?? review.reviewer_email ?? 'Deleted user'}
            </ThemedText>
            {review.body && <ThemedText type="small">{review.body}</ThemedText>}
            <ThemedText type="label" themeColor="textSecondary">
              {new Date(review.created_at).toLocaleDateString()}
            </ThemedText>
            <View style={styles.actions}>
              <ThemedButton
                label="Open location"
                variant="text"
                onPress={() => router.push(`/location/${review.location_id}`)}
              />
              <ThemedButton label="Delete" variant="textDanger" onPress={() => confirmDelete(review)} />
            </View>
          </View>
        ))}
      </View>
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  item: {
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.one,
  },
});
