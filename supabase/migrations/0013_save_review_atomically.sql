-- Saves a review and its category scores in one transaction, so a failure
-- (e.g. an invalid score) saves nothing. Before this, the app wrote the
-- review first and the scores second; when the second step failed, a
-- half-saved review was left behind and the 4-day cooldown then blocked
-- posting a new one.
--
-- Security invoker: runs as the calling user, so every existing RLS
-- policy (who may review what, author-only edits) and trigger (cooldown,
-- identity protection, rating stats) still applies exactly as before.
--
-- existing_review_id null = create a new review on target_location_id;
-- otherwise update that review (target_location_id is ignored).
-- scores = {"<category id>": <0..5 in 0.5 steps>, ...} for rated
-- categories only.
create or replace function public.save_review(
  target_location_id uuid,
  existing_review_id uuid,
  overall_score numeric,
  review_body text,
  scores jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_review_id uuid;
begin
  if existing_review_id is null then
    insert into public.reviews (location_id, user_id, overall_rating, body)
    values (target_location_id, auth.uid(), overall_score, nullif(review_body, ''))
    returning id into saved_review_id;
  else
    update public.reviews r
    set overall_rating = overall_score, body = nullif(review_body, '')
    where r.id = existing_review_id and r.user_id = auth.uid()
    returning r.id into saved_review_id;

    if saved_review_id is null then
      raise exception 'This review could not be found, or it is not yours to edit.';
    end if;

    delete from public.review_ratings rr where rr.review_id = saved_review_id;
  end if;

  insert into public.review_ratings (review_id, category_id, score)
  select saved_review_id, entry.key::uuid, entry.value::numeric
  from jsonb_each_text(coalesce(scores, '{}'::jsonb)) as entry;

  return saved_review_id;
end;
$$;

revoke execute on function public.save_review(uuid, uuid, numeric, text, jsonb) from public, anon;
grant execute on function public.save_review(uuid, uuid, numeric, text, jsonb) to authenticated;
