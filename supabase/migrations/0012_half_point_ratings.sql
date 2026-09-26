-- Half-point ratings from 0 to 5 (user's decision), entered with sliders.
-- Applies to the overall rating and to each category score. Existing whole
-- number ratings convert unchanged; location averages keep working (the
-- stats trigger already averages into numeric).

alter table public.reviews drop constraint if exists reviews_overall_rating_check;
alter table public.reviews
  alter column overall_rating type numeric(2, 1) using overall_rating::numeric(2, 1);
alter table public.reviews
  add constraint reviews_overall_rating_check
  check (overall_rating between 0 and 5 and overall_rating * 2 = floor(overall_rating * 2));

alter table public.review_ratings drop constraint if exists review_ratings_score_check;
alter table public.review_ratings
  alter column score type numeric(2, 1) using score::numeric(2, 1);
alter table public.review_ratings
  add constraint review_ratings_score_check
  check (score between 0 and 5 and score * 2 = floor(score * 2));
