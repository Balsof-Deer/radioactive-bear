-- Fixes an incomplete run of 0005: the location_photos table was
-- created but the storage bucket and its policies were not (the
-- Supabase SQL Editor doesn't roll back earlier statements when a
-- later one fails, so 0005 partially applied). This file is safe to
-- run even if some pieces from 0005 DID land — every statement here is
-- idempotent (drop-if-exists before create, on-conflict-do-nothing).

-- NOTE: inserting into storage.buckets via SQL reported success on this
-- project but the bucket never actually became reachable through the
-- Storage API. Create it manually instead: Dashboard > Storage > New
-- bucket > name it exactly "location-photos" > leave "Public" unchecked.
-- The policies below don't depend on how the bucket was created.

drop policy if exists "Location photo files follow location visibility" on storage.objects;
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

drop policy if exists "Submitter or admin can upload location photo files" on storage.objects;
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

drop policy if exists "Submitter or admin can delete location photo files" on storage.objects;
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
