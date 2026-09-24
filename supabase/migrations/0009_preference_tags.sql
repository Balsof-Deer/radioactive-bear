-- Phase 8: location amenity tags + per-user preferences. Review this
-- file before running it. Paste it into the Supabase dashboard's SQL
-- Editor and run it, after 0001-0008.
--
-- Note on style: every column reference inside a nested subquery below
-- is explicitly table-qualified (e.g. l.id, not bare id), even where it
-- wouldn't currently collide with anything. That's a deliberate habit
-- picked up after a real bug in an earlier migration, where an
-- unqualified `name` silently resolved to the wrong table's column of
-- the same name inside a nested EXISTS and broke RLS for everyone.

-- ============================================================
-- Tags: the master list of amenities (e.g. "has wifi"). A table
-- rather than fixed columns, same reasoning as rating_categories —
-- editable later without a schema migration.
-- ============================================================
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tags enable row level security;

create policy "Tags readable by authenticated users"
  on public.tags for select
  using (auth.role() = 'authenticated');

create policy "Only admins manage tags"
  on public.tags for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.tags (slug, label, sort_order) values
  ('has_wifi', 'Has wifi', 1),
  ('quiet', 'Quiet environment', 2),
  ('good_for_groups', 'Good for groups', 3),
  ('open_late', 'Open late / 24 hours', 4);

-- ============================================================
-- Location tags: which tags apply to which location. Assigned by the
-- submitter (at add-location time, or later while editing), or by an
-- admin — mirrors the same gate as editing the location itself:
-- submitter can only while no admin decision has been made yet.
-- ============================================================
create table public.location_tags (
  location_id uuid not null references public.locations (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (location_id, tag_id)
);

alter table public.location_tags enable row level security;

create policy "Location tags follow location visibility"
  on public.location_tags for select
  using (
    exists (
      select 1 from public.locations l
      where l.id = location_tags.location_id
        and (
          l.submitted_by = auth.uid()
          or public.is_admin()
          or (l.admin_status is distinct from 'rejected' and (now() >= l.visible_from or l.admin_status = 'approved'))
        )
    )
  );

create policy "Submitter or admin can manage location tags"
  on public.location_tags for all
  using (
    exists (
      select 1 from public.locations l
      where l.id = location_tags.location_id
        and (
          (l.submitted_by = auth.uid() and l.admin_status is null)
          or public.is_admin()
        )
    )
  )
  with check (
    exists (
      select 1 from public.locations l
      where l.id = location_tags.location_id
        and (
          (l.submitted_by = auth.uid() and l.admin_status is null)
          or public.is_admin()
        )
    )
  );

-- ============================================================
-- Each user's own preferred tags. Purely self-service.
-- ============================================================
create table public.profile_tag_preferences (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (profile_id, tag_id)
);

alter table public.profile_tag_preferences enable row level security;

create policy "Users manage their own tag preferences"
  on public.profile_tag_preferences for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
