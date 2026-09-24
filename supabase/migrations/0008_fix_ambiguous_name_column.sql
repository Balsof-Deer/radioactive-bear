-- Fixes the actual root cause behind "new row violates row-level
-- security policy" on storage.objects. 0006/0007's policies compared
-- against a bare `name` inside a subquery that also selects from
-- public.locations — and locations has its own `name` column (the
-- location's display name). Postgres resolved the unqualified `name`
-- to the closer match, locations.name, not the uploaded file's path.
-- A location's display name can never equal a location id, so this
-- silently rejected every upload for every user, submitter or not.
--
-- Fixed by qualifying the file path as storage.objects.name explicitly,
-- which is unambiguous regardless of what else is in scope.

drop policy if exists "Location photo files follow location visibility" on storage.objects;
create policy "Location photo files follow location visibility"
  on storage.objects for select
  using (
    bucket_id = 'location-photos'
    and exists (
      select 1 from public.locations l
      where l.id::text = split_part(ltrim(storage.objects.name, '/'), '/', 1)
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
      where l.id::text = split_part(ltrim(storage.objects.name, '/'), '/', 1)
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
      where l.id::text = split_part(ltrim(storage.objects.name, '/'), '/', 1)
        and (l.submitted_by = auth.uid() or public.is_admin())
    )
  );
