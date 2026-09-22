-- Phase 3: locations, reviews, rating categories, and the approval
-- workflow. Review this file before running it. Paste it into the
-- Supabase dashboard's SQL Editor (Project > SQL Editor > New query)
-- and run it, after 0001_profiles_and_admin_invites.sql.

-- PostGIS goes in its own schema, never public: installing it in public
-- would expose its internal reference tables (e.g. spatial_ref_sys)
-- through Supabase's Data API. Functions/types below are schema-qualified
-- (extensions.geography, extensions.ST_SetSRID, ...) accordingly.
create extension if not exists postgis with schema extensions;

-- ============================================================
-- Rating categories (noise level, wifi quality, etc.). A table
-- rather than fixed columns on reviews so categories can be added,
-- renamed, or retired by an admin without a schema migration.
-- ============================================================
create table public.rating_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.rating_categories enable row level security;

create policy "Rating categories readable by authenticated users"
  on public.rating_categories for select
  using (auth.role() = 'authenticated');

create policy "Only admins manage rating categories"
  on public.rating_categories for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.rating_categories (slug, label, sort_order) values
  ('noise_level', 'Noise level', 1),
  ('wifi_quality', 'Wifi / internet quality', 2),
  ('seating_comfort', 'Seating comfort & availability', 3),
  ('outlets_access', 'Outlets / charging access', 4),
  ('affordability', 'Affordability', 5),
  ('service', 'Service', 6),
  ('foot_traffic', 'Foot traffic', 7);

-- ============================================================
-- Locations
-- ============================================================
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  geo extensions.geography(point, 4326),
  submitted_by uuid not null references public.profiles (id),
  -- null = no admin decision yet. 'approved' skips the timers below and
  -- marks it admin-approved; 'rejected' hides it from everyone but the
  -- submitter and admins.
  admin_status text check (admin_status in ('approved', 'rejected')),
  admin_reviewed_by uuid references public.profiles (id),
  admin_reviewed_at timestamptz,
  admin_rejection_reason text,
  -- Defaults to 24h after creation (private until then); an admin can
  -- move this earlier to fast-track community visibility.
  visible_from timestamptz not null default (now() + interval '24 hours'),
  average_rating numeric(3, 2),
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.locations enable row level security;

create index locations_geo_idx on public.locations using gist (geo);

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

-- Keeps `geo` in sync whenever latitude/longitude change, so radius
-- queries (ST_DWithin) can use the indexed geography column instead of
-- computing distance in plain SQL on every request.
create function public.sync_location_geo()
returns trigger
language plpgsql
as $$
begin
  new.geo := extensions.ST_SetSRID(extensions.ST_MakePoint(new.longitude, new.latitude), 4326)::extensions.geography;
  return new;
end;
$$;

create trigger locations_sync_geo
  before insert or update of latitude, longitude on public.locations
  for each row execute function public.sync_location_geo();

-- Locks admin_status / admin_reviewed_by / admin_reviewed_at /
-- admin_rejection_reason / visible_from / submitted_by so only an admin
-- can ever change them, regardless of what a client sends in an update.
-- Also auto-stamps who/when an admin decision was made.
create function public.protect_location_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    if new.admin_status is distinct from old.admin_status then
      new.admin_reviewed_by := auth.uid();
      new.admin_reviewed_at := now();
    end if;
  else
    new.admin_status := old.admin_status;
    new.admin_reviewed_by := old.admin_reviewed_by;
    new.admin_reviewed_at := old.admin_reviewed_at;
    new.admin_rejection_reason := old.admin_rejection_reason;
    new.visible_from := old.visible_from;
    new.submitted_by := old.submitted_by;
  end if;
  return new;
end;
$$;

create trigger locations_protect_admin_fields
  before update on public.locations
  for each row execute function public.protect_location_admin_fields();

-- Computes the display status. Not stored: a location's status depends
-- on the current time, so it's derived fresh on every read instead of
-- relying on a scheduled job to flip a stored column (nothing can get
-- stuck if a cron job fails to run).
create function public.location_status(loc public.locations)
returns text
language sql
stable
as $$
  select case
    when loc.admin_status = 'rejected' then 'rejected'
    when loc.admin_status = 'approved' then 'approved_admin'
    when now() >= loc.created_at + interval '48 hours' then 'approved_community'
    when now() >= loc.visible_from then 'pending_public'
    else 'pending_private'
  end;
$$;

-- security_invoker so this view enforces the querying user's own RLS on
-- public.locations, not the view owner's privileges.
create view public.locations_with_status
with (security_invoker = true)
as
select l.*, public.location_status(l) as status
from public.locations l;

create policy "Locations visible per approval stage, or to owner/admin"
  on public.locations for select
  using (
    (admin_status is distinct from 'rejected' and (now() >= visible_from or admin_status = 'approved'))
    or submitted_by = auth.uid()
    or public.is_admin()
  );

create policy "Authenticated users can submit locations"
  on public.locations for insert
  with check (submitted_by = auth.uid());

-- Submitter can edit their own location only while no admin decision has
-- been made yet; once approved or rejected, only an admin can edit it
-- further (so a submitter can't quietly change details after review).
create policy "Submitter can edit their own pending location, admins any"
  on public.locations for update
  using ((submitted_by = auth.uid() and admin_status is null) or public.is_admin())
  with check ((submitted_by = auth.uid() and admin_status is null) or public.is_admin());

create policy "Submitter can delete their own pending location, admins any"
  on public.locations for delete
  using ((submitted_by = auth.uid() and admin_status is null) or public.is_admin());

-- ============================================================
-- Reviews
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  overall_rating smallint not null check (overall_rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create index reviews_location_id_idx on public.reviews (location_id);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- location_id/user_id never change after the review is created; there's
-- no legitimate reason to reassign a review to a different location or
-- user (delete + resubmit is the correct path if that's ever needed).
create function public.protect_review_identity_fields()
returns trigger
language plpgsql
as $$
begin
  new.location_id := old.location_id;
  new.user_id := old.user_id;
  return new;
end;
$$;

create trigger reviews_protect_identity
  before update on public.reviews
  for each row execute function public.protect_review_identity_fields();

-- Unlimited reviews per user per location, but a new one (not an edit)
-- can't be created within 4 days of that same user's last review on the
-- same location. Only fires on INSERT, so editing an existing review is
-- never subject to this cooldown.
create function public.enforce_review_cooldown()
returns trigger
language plpgsql
as $$
declare
  last_review_at timestamptz;
begin
  select max(created_at) into last_review_at
  from public.reviews
  where location_id = new.location_id and user_id = new.user_id;

  if last_review_at is not null and now() < last_review_at + interval '4 days' then
    raise exception 'You can leave a new review for this location again on %', (last_review_at + interval '4 days');
  end if;

  return new;
end;
$$;

create trigger reviews_enforce_cooldown
  before insert on public.reviews
  for each row execute function public.enforce_review_cooldown();

-- Keeps locations.average_rating / review_count in sync. Security
-- definer because a regular student doesn't otherwise have UPDATE rights
-- on a locations row they don't own.
create function public.refresh_location_rating_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_location_id uuid;
begin
  target_location_id := coalesce(new.location_id, old.location_id);

  update public.locations
  set
    review_count = (select count(*) from public.reviews where location_id = target_location_id),
    average_rating = (select round(avg(overall_rating)::numeric, 2) from public.reviews where location_id = target_location_id)
  where id = target_location_id;

  return coalesce(new, old);
end;
$$;

create trigger reviews_refresh_location_stats
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_location_rating_stats();

create policy "Reviews visible when their location is visible, or to author/admin"
  on public.reviews for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.locations l
      where l.id = reviews.location_id
        and (l.admin_status is distinct from 'rejected' and (now() >= l.visible_from or l.admin_status = 'approved'))
    )
  );

create policy "Users can review locations visible to them"
  on public.reviews for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.locations l
      where l.id = reviews.location_id
        and (
          l.submitted_by = auth.uid()
          or public.is_admin()
          or (l.admin_status is distinct from 'rejected' and (now() >= l.visible_from or l.admin_status = 'approved'))
        )
    )
  );

create policy "Review author or admin can update"
  on public.reviews for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Review author or admin can delete"
  on public.reviews for delete
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- Review sub-ratings (one row per category the reviewer scored)
-- ============================================================
create table public.review_ratings (
  review_id uuid not null references public.reviews (id) on delete cascade,
  category_id uuid not null references public.rating_categories (id),
  score smallint not null check (score between 1 and 5),
  primary key (review_id, category_id)
);

alter table public.review_ratings enable row level security;

create policy "Review sub-ratings follow review visibility"
  on public.review_ratings for select
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_ratings.review_id
        and (
          r.user_id = auth.uid()
          or public.is_admin()
          or exists (
            select 1 from public.locations l
            where l.id = r.location_id
              and (l.admin_status is distinct from 'rejected' and (now() >= l.visible_from or l.admin_status = 'approved'))
          )
        )
    )
  );

create policy "Review author or admin can manage sub-ratings"
  on public.review_ratings for all
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_ratings.review_id and (r.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_ratings.review_id and (r.user_id = auth.uid() or public.is_admin())
    )
  );
