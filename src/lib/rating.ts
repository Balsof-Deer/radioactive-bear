// Ratings are 0 to 5 in half steps (migration 0012).
export const RATING_MIN = 0;
export const RATING_MAX = 5;
export const RATING_STEP = 0.5;

// Always one decimal ("4.0", "4.5") so scores line up and read the same
// everywhere. Values from the database may arrive as numeric strings.
export function formatRating(value: number | string | null): string {
  return Number(value ?? 0).toFixed(1);
}

// Snaps any value to the nearest allowed half step within 0 to 5.
export function snapRating(value: number): number {
  const snapped = Math.round(value / RATING_STEP) * RATING_STEP;
  return Math.min(RATING_MAX, Math.max(RATING_MIN, snapped));
}
