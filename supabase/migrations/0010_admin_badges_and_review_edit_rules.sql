-- Admin notification badges + "last checked by" markers, and a rule
-- change: admins may delete any review but may no longer edit someone
-- else's. Review this file before running it. Paste it into the Supabase
-- dashboard's SQL Editor and run it, after 0001-0009.
--
-- Style note (same as 0009): every column reference inside a nested
-- subquery is table-qualified, to avoid the ambiguous-column bug from
-- 0006/0007.

-- ============================================================
-- Shared "last checked" marker per admin section. One row per section,
-- shared by all admins: when any admin opens a section, its badge clears
-- for everyone and every admin sees who checked it and when.
-- ============================================================
create table public.admin_section_checks (
  section text primary key check (section in ('reviews', 'users', 'locations')),
  last_checked_at timestamptz not null default now(),
  last_checked_by uuid references public.profiles (id) on delete set null
);

alter table public.admin_section_checks enable row level security;

create policy "Admins can view section checks"
  on public.admin_section_checks for select
  using (public.is_admin());

-- Writes only go through this function, so the timestamp comes from the
-- database clock (not a phone's) and the checker is always the caller.
create function public.mark_admin_section_checked(section_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can mark a section as checked';
  end if;

  insert into public.admin_section_checks (section, last_checked_at, last_checked_by)
  values (section_name, now(), auth.uid())
  on conflict (section) do update
    set last_checked_at = excluded.last_checked_at,
        last_checked_by = excluded.last_checked_by;
end;
$$;

-- Lesson from 0004: revoke from anon explicitly, not just public.
revoke all on function public.mark_admin_section_checked(text) from public;
revoke all on function public.mark_admin_section_checked(text) from anon;
grant execute on function public.mark_admin_section_checked(text) to authenticated;

-- Badge counts in one round trip. Security invoker (the default): runs
-- with the caller's RLS, so it only ever counts rows the caller can see.
-- A section nobody has checked yet counts everything in it.
create function public.admin_badge_counts()
returns json
language sql
stable
set search_path = public
as $$
  select json_build_object(
    'pending_locations',
      (select count(*) from public.locations l where l.admin_status is null),
    'new_locations',
      (select count(*) from public.locations l
        where l.created_at > coalesce(
          (select c.last_checked_at from public.admin_section_checks c where c.section = 'locations'),
          '-infinity'::timestamptz)),
    'new_reviews',
      (select count(*) from public.reviews r
        where r.created_at > coalesce(
          (select c.last_checked_at from public.admin_section_checks c where c.section = 'reviews'),
          '-infinity'::timestamptz)),
    'new_users',
      (select count(*) from public.profiles p
        where p.created_at > coalesce(
          (select c.last_checked_at from public.admin_section_checks c where c.section = 'users'),
          '-infinity'::timestamptz))
  );
$$;

revoke all on function public.admin_badge_counts() from public;
revoke all on function public.admin_badge_counts() from anon;
grant execute on function public.admin_badge_counts() to authenticated;

-- ============================================================
-- Live updates: badges/markers refresh while the admin screen is open.
-- Realtime still applies each table's RLS per subscriber.
-- ============================================================
do $$
declare
  table_name text;
begin
  foreach table_name in array array['admin_section_checks', 'reviews', 'locations', 'profiles'] loop
    if not exists (
      select 1 from pg_publication_tables pt
      where pt.pubname = 'supabase_realtime' and pt.schemaname = 'public' and pt.tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;

-- ============================================================
-- Admins can delete any review but not edit someone else's. Replaces the
-- 0002 policies that let admins update any review and its sub-ratings.
-- Deleting a review still removes its sub-ratings via the foreign key's
-- ON DELETE CASCADE, which isn't subject to these policies.
-- ============================================================
drop policy if exists "Review author or admin can update" on public.reviews;
create policy "Review author can update"
  on public.reviews for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Review author or admin can manage sub-ratings" on public.review_ratings;

create policy "Review author can add sub-ratings"
  on public.review_ratings for insert
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_ratings.review_id and r.user_id = auth.uid()
    )
  );

create policy "Review author can update sub-ratings"
  on public.review_ratings for update
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_ratings.review_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_ratings.review_id and r.user_id = auth.uid()
    )
  );

create policy "Review author can delete sub-ratings"
  on public.review_ratings for delete
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_ratings.review_id and r.user_id = auth.uid()
    )
  );
