import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { RatingSlider } from '@/components/rating-slider';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing, Typography } from '@/constants/theme';
import { formatRating } from '@/lib/rating';
import type { RatingCategory, ReviewFormValues } from '@/lib/reviews';

type ReviewFormProps = {
  categories: RatingCategory[];
  initialValues?: ReviewFormValues;
  isSubmitting: boolean;
  onSubmit: (values: ReviewFormValues) => void;
  onCancel: () => void;
};

// Minimal review form: slider ratings from 0 to 5 in half steps. The
// overall rating is required (0 is a valid rating, so "not rated yet" is
// tracked separately); category ratings are optional and can be cleared.
export function ReviewForm({
  categories,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const { fontScale } = useWindowDimensions();
  const isEditing = !!initialValues;
  const [overallRating, setOverallRating] = useState<number | null>(initialValues?.overallRating ?? null);
  const [body, setBody] = useState(initialValues?.body ?? '');
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>(
    initialValues?.categoryScores ?? {}
  );

  function clearCategory(categoryId: string) {
    setCategoryScores((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  }

  return (
    <View style={styles.form}>
      <ThemedText type="subtitle">{isEditing ? 'Edit your review' : 'Write a review'}</ThemedText>

      <View style={styles.field}>
        <View style={styles.valueRow}>
          <ThemedText type="heading">Overall rating</ThemedText>
          {overallRating === null ? (
            <ThemedText type="small" themeColor="textSecondary">
              Required
            </ThemedText>
          ) : (
            <ThemedText type="title">{formatRating(overallRating)}</ThemedText>
          )}
        </View>
        <RatingSlider value={overallRating} onChange={setOverallRating} />
      </View>

      <View style={styles.section}>
        <View style={styles.valueRow}>
          <ThemedText type="heading">Rate the details</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Optional
          </ThemedText>
        </View>
        {categories.map((category) => {
          const score = categoryScores[category.id];
          const isRated = score !== undefined;
          return (
            <View key={category.id} style={styles.field}>
              <View style={styles.valueRow}>
                <ThemedText type="small" style={styles.categoryLabel}>
                  {category.label}
                </ThemedText>
                {isRated ? (
                  <View style={styles.ratedValue}>
                    <ThemedText type="smallBold">{formatRating(score)}</ThemedText>
                    <IconButton
                      icon="close"
                      label={`Clear ${category.label} rating`}
                      onPress={() => clearCategory(category.id)}
                      scale={1.6}
                    />
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    Not rated
                  </ThemedText>
                )}
              </View>
              <RatingSlider
                value={isRated ? score : null}
                onChange={(next) => setCategoryScores((prev) => ({ ...prev, [category.id]: next }))}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.field}>
        <ThemedText type="heading">Your experience</ThemedText>
        <ThemedTextInput
          placeholder="What should other students know? (optional)"
          value={body}
          onChangeText={setBody}
          multiline
          style={[styles.body, { minHeight: Typography.bodyLarge.lineHeight * fontScale * 4 }]}
        />
      </View>


      <View style={styles.actions}>
        <ThemedButton label="Cancel" variant="secondary" onPress={onCancel} disabled={isSubmitting} style={styles.action} />
        <ThemedButton
          label={isEditing ? 'Save changes' : 'Post review'}
          onPress={() => {
            if (overallRating !== null) onSubmit({ overallRating, body, categoryScores });
          }}
          loading={isSubmitting}
          disabled={isSubmitting || overallRating === null}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  categoryLabel: {
    flex: 1,
  },
  ratedValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
