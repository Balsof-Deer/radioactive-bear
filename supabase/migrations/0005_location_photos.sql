-- Phase 5: location photos. Review this file before running it. Paste
-- it into the Supabase dashboard's SQL Editor and run it, after 0001-0004.

-- Metadata table (which photos belong to which location). The actual
-- image bytes live in Storage; this table just indexes them so we can
-- query "photos for this location" with a normal select instead of
-- listing the storage bucket.
create table public.location_photos (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  storage_path text not null,
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.location_photos enable row level security;

create index location_photos_location_id_idx on public.location_photos (location_id);

create policy "Location photo metadata follows location visibility"
  on public.location_photos for select
  using (
    exists (
      select 1 from public.locations l
      where l.id = location_photos.location_id
        and (
          l.submitted_by = auth.uid()
          or public.is_admin()
          or (l.admin_status is distinct from 'rejected' and (now() >= l.visible_from or l.admin_status = 'approved'))
        )
    )
  );

create policy "Submitter or admin can add photo metadata"
  on public.location_photos for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.locations l
      where l.id = location_photos.location_id
        and (l.submitted_by = auth.uid() or public.is_admin())
    )
  );

create policy "Submitter or admin can delete photo metadata"
  on public.location_photos for delete
  using (
    exists (
      select 1 from public.locations l
      where l.id = location_photos.location_id
        and (l.submitted_by = auth.uid() or public.is_admin())
    )
  );

-- Private bucket: visibility of the actual image bytes must follow the
-- same rules as the location itself (a pending-private location's
-- photos shouldn't be fetchable by a guessed URL), so this can't be a
-- public bucket with permanent public URLs. Clients fetch images via a
-- short-lived signed URL instead.
--
-- CAVEAT (found during testing): this insert can report success without
-- the bucket actually becoming reachable through the Storage API. If
-- that happens, create it manually instead: Dashboard > Storage > New
-- bucket > name it exactly "location-photos" > leave "Public" unchecked.
-- See 0006 for the same note plus a standalone re-run of the policies.
insert into storage.buckets (id, name, public)
values ('location-photos', 'location-photos', false)
on conflict (id) do nothing;

-- Objects are uploaded at "<location_id>/<random>.<ext>"; storage.foldername
-- splits the path so we can correlate the first segment back to a location.
create policy "Location photo files follow location visibility"
  on storage.objects for select
  using (
    bucket_id = 'location-photos'
    and exists (
      select 1 from public.locations l
      where l.id::text = (storage.foldername(name))[1]
        and (
          l.submitted_by = auth.uid()
          or public.is_admin()
          or (l.admin_status is distinct from 'rejected' and (now() >= l.visible_from or l.admin_status = 'approved'))
        )
    )
  );

create policy "Submitter or admin can upload location photo files"
  on storage.objects for insert
  with check (
    bucket_id = 'location-photos'
    and exists (
      select 1 from public.locations l
      where l.id::text = (storage.foldername(name))[1]
        and (l.submitted_by = auth.uid() or public.is_admin())
    )
  );

create policy "Submitter or admin can delete location photo files"
  on storage.objects for delete
  using (
    bucket_id = 'location-photos'
    and exists (
      select 1 from public.locations l
      where l.id::text = (storage.foldername(name))[1]
        and (l.submitted_by = auth.uid() or public.is_admin())
    )
  );
