import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { StarRating } from '@/components/star-rating';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { RatingCategory, ReviewFormValues } from '@/lib/reviews';

type ReviewFormProps = {
  categories: RatingCategory[];
  initialValues?: ReviewFormValues;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: ReviewFormValues) => void;
  onCancel: () => void;
};

export function ReviewForm({
  categories,
  initialValues,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(initialValues?.overallRating ?? 0);
  const [body, setBody] = useState(initialValues?.body ?? '');
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>(
    initialValues?.categoryScores ?? {}
  );

  return (
    <ThemedView type="backgroundElement" style={styles.form}>
      <ThemedText type="smallBold">Overall rating</ThemedText>
      <StarRating value={overallRating} onChange={setOverallRating} size={28} />

      {categories.map((category) => (
        <ThemedView key={category.id} type="backgroundElement" style={styles.categoryRow}>
          <ThemedText type="small" style={styles.categoryLabel}>
            {category.label}
          </ThemedText>
          <StarRating
            value={categoryScores[category.id] ?? 0}
            onChange={(score) => setCategoryScores((prev) => ({ ...prev, [category.id]: score }))}
          />
        </ThemedView>
      ))}

      <ThemedTextInput
        placeholder="Share more about your experience (optional)"
        value={body}
        onChangeText={setBody}
        multiline
        style={styles.body}
      />

      {error && (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      )}

      <ThemedButton
        label="Save review"
        onPress={() => onSubmit({ overallRating, body, categoryScores })}
        loading={isSubmitting}
        disabled={isSubmitting || overallRating === 0}
      />
      <ThemedButton label="Cancel" variant="secondary" onPress={onCancel} disabled={isSubmitting} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    flex: 1,
  },
  body: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
