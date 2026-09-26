import { supabase } from '@/lib/supabase';

export type RatingCategory = {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
};

export type ReviewWithRatings = {
  id: string;
  location_id: string;
  // null once the reviewer has deleted their account.
  user_id: string | null;
  overall_rating: number;
  body: string | null;
  created_at: string;
  updated_at: string;
  reviewer_display_name: string | null;
  category_scores: { category_id: string; score: number }[];
};

export type ReviewFormValues = {
  overallRating: number;
  body: string;
  categoryScores: Record<string, number>;
};

type ReviewRow = {
  id: string;
  location_id: string;
  // null once the reviewer has deleted their account.
  user_id: string | null;
  overall_rating: number;
  body: string | null;
  created_at: string;
  updated_at: string;
  profiles: { display_name: string | null } | null;
  review_ratings: { category_id: string; score: number }[] | null;
};

export async function fetchRatingCategories(): Promise<RatingCategory[]> {
  const { data, error } = await supabase
    .from('rating_categories')
    .select('id,slug,label,sort_order')
    .order('sort_order');

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function fetchReviews(locationId: string): Promise<ReviewWithRatings[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      'id, location_id, user_id, overall_rating, body, created_at, updated_at, profiles(display_name), review_ratings(category_id, score)'
    )
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as ReviewRow[]).map((row) => ({
    id: row.id,
    location_id: row.location_id,
    user_id: row.user_id,
    overall_rating: row.overall_rating,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
    reviewer_display_name: row.profiles?.display_name ?? null,
    category_scores: row.review_ratings ?? [],
  }));
}

// Both create and edit go through the save_review database function
// (migration 0013), which writes the review and its category scores in
// one transaction: if anything fails, nothing is saved.
async function saveReview(
  locationId: string | null,
  existingReviewId: string | null,
  input: ReviewFormValues
): Promise<void> {
  const { error } = await supabase.rpc('save_review', {
    target_location_id: locationId,
    existing_review_id: existingReviewId,
    overall_score: input.overallRating,
    review_body: input.body,
    // Only rated categories are in the record (0 is a valid rating).
    scores: input.categoryScores,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function createReview(locationId: string, input: ReviewFormValues): Promise<void> {
  await saveReview(locationId, null, input);
}

export async function updateReview(reviewId: string, input: ReviewFormValues): Promise<void> {
  await saveReview(null, reviewId, input);
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) {
    throw new Error(error.message);
  }
}

export type MyReview = {
  id: string;
  location_id: string;
  location_name: string | null;
  overall_rating: number;
  body: string | null;
  created_at: string;
};

export async function fetchMyReviews(userId: string): Promise<MyReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, location_id, overall_rating, body, created_at, locations(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    data as unknown as (Omit<MyReview, 'location_name'> & { locations: { name: string } | null })[]
  ).map(({ locations, ...review }) => ({ ...review, location_name: locations?.name ?? null }));
}
