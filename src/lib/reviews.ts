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
  user_id: string;
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
  user_id: string;
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

async function saveCategoryScores(reviewId: string, categoryScores: Record<string, number>) {
  const rows = Object.entries(categoryScores)
    .filter(([, score]) => score > 0)
    .map(([categoryId, score]) => ({ review_id: reviewId, category_id: categoryId, score }));

  if (rows.length === 0) return;

  const { error } = await supabase.from('review_ratings').insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

export async function createReview(locationId: string, input: ReviewFormValues): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error('You must be signed in to leave a review.');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      location_id: locationId,
      user_id: userId,
      overall_rating: input.overallRating,
      body: input.body || null,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await saveCategoryScores(data.id as string, input.categoryScores);
}

export async function updateReview(reviewId: string, input: ReviewFormValues): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ overall_rating: input.overallRating, body: input.body || null })
    .eq('id', reviewId);

  if (error) {
    throw new Error(error.message);
  }

  const { error: deleteError } = await supabase.from('review_ratings').delete().eq('review_id', reviewId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await saveCategoryScores(reviewId, input.categoryScores);
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) {
    throw new Error(error.message);
  }
}
