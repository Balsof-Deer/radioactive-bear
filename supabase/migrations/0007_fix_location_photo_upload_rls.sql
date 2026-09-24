-- Fixes "new row violates row-level security policy" when a location's
-- own submitter tries to add a photo to it. The storage.objects policies
-- from 0006 correlate a photo's path back to its location using
-- storage.foldername(name), which breaks if the upload path comes back
-- with a leading slash (name = "/<id>/<file>" instead of
-- "<id>/<file>") — the location id then never matches, rejecting every
-- upload regardless of who's submitting it. Rewritten with
-- split_part(ltrim(name, '/'), '/', 1), which handles both forms.

drop policy if exists "Location photo files follow location visibility" on storage.objects;
create policy "Location photo files follow location visibility"
  on storage.objects for select
  using (
    bucket_id = 'location-photos'
    and exists (
      select 1 from public.locations l
      where l.id::text = split_part(ltrim(name, '/'), '/', 1)
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
      where l.id::text = split_part(ltrim(name, '/'), '/', 1)
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
      where l.id::text = split_part(ltrim(name, '/'), '/', 1)
        and (l.submitted_by = auth.uid() or public.is_admin())
    )
  );
