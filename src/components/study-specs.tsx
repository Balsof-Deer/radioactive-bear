import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRating } from '@/lib/rating';
import type { RatingCategory, ReviewWithRatings } from '@/lib/reviews';

type StudySpecsProps = {
  categories: RatingCategory[];
  reviews: ReviewWithRatings[];
};

type CategoryAverage = {
  category: RatingCategory;
  average: number | null;
  count: number;
};

function averagesFor(categories: RatingCategory[], reviews: ReviewWithRatings[]): CategoryAverage[] {
  return categories.map((category) => {
    const scores = reviews.flatMap((review) =>
      review.category_scores.filter((score) => score.category_id === category.id).map((score) => score.score)
    );
    return {
      category,
      average: scores.length > 0 ? scores.reduce((sum, score) => sum + Number(score), 0) / scores.length : null,
      count: scores.length,
    };
  });
}

// The spec's "study specs matrix", built only from real data: the average
// of each rating category across this location's reviews. Labels are the
// category names as stored; scores aren't reinterpreted (e.g. the form
// doesn't say whether a high noise score means quiet or loud). Shown as a
// quiet list: label and score, a slim meter, the rating count.
export function StudySpecs({ categories, reviews }: StudySpecsProps) {
  const theme = useTheme();
  const averages = averagesFor(categories, reviews);

  return (
    <View>
      {averages.map(({ category, average, count }, index) => (
        <View
          key={category.id}
          accessible
          accessibilityLabel={
            average === null
              ? `${category.label}: not rated yet`
              : `${category.label}: ${formatRating(average)} out of 5 from ${count} rating${count === 1 ? '' : 's'}`
          }
          style={[
            styles.row,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
          ]}>
          <View style={styles.labelRow}>
            <ThemedText type="small" style={styles.label}>
              {category.label}
            </ThemedText>
            {average === null ? (
              <ThemedText type="small" themeColor="textSecondary">
                Not rated yet
              </ThemedText>
            ) : (
              <ThemedText type="smallBold">{formatRating(average)}</ThemedText>
            )}
          </View>
          {average !== null && (
            <View style={styles.meterRow}>
              <View style={[styles.meterTrack, { backgroundColor: theme.surfaceContainerHighest }]}>
                <View
                  style={[styles.meterFill, { width: `${(average / 5) * 100}%`, backgroundColor: theme.primary }]}
                />
              </View>
              <ThemedText type="label" themeColor="textSecondary">
                {count} rating{count === 1 ? '' : 's'}
              </ThemedText>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.one,
    paddingVertical: Spacing.two + Spacing.one,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  label: {
    flex: 1,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  meterTrack: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
