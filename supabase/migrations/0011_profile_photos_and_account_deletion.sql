-- Phase: sidebar menu + profile management.
--
-- 1. Profile photos (avatars), stored in a private "avatars" bucket.
-- 2. Self-service account deletion that keeps everything the user
--    created, anonymised (user's decision): reviews, locations, location
--    photos and admin records stay, with the owner cleared.
--
-- BEFORE RUNNING: create the bucket in the Dashboard (creating buckets
-- via SQL didn't work on this project, see 0006): Storage > New bucket >
-- name it exactly "avatars" > leave "Public" unchecked.

-- ============================================================
-- 1. Profile photos
-- ============================================================

-- Path inside the "avatars" bucket, always under the owner's own folder
-- (<user id>/...), so a user can't point their profile at someone
-- else's file.
alter table public.profiles add column if not exists avatar_path text;

alter table public.profiles drop constraint if exists profiles_avatar_path_own_folder;
alter table public.profiles
  add constraint profiles_avatar_path_own_folder
  check (avatar_path is null or avatar_path like id::text || '/%');

-- Only the owner and admins can see a photo, matching who can read
-- profiles today. Only the owner can add, replace or remove their files.
drop policy if exists "Avatar files visible to owner or admin" on storage.objects;
create policy "Avatar files visible to owner or admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "Users upload their own avatar files" on storage.objects;
create policy "Users upload their own avatar files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update their own avatar files" on storage.objects;
create policy "Users update their own avatar files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete their own avatar files" on storage.objects;
create policy "Users delete their own avatar files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 2. Account deletion (anonymise, don't delete content)
-- ============================================================

-- Owner columns become nullable; null means "deleted user". The foreign
-- keys stay as they are (no cascade), so deleting a profile still fails
-- loudly if any reference was missed, instead of silently orphaning rows.
alter table public.locations alter column submitted_by drop not null;
alter table public.reviews alter column user_id drop not null;
alter table public.location_photos alter column uploaded_by drop not null;
alter table public.admin_invites alter column created_by drop not null;

-- The existing protection triggers put owner columns back to their old
-- values on every non-admin update, which would undo the anonymising.
-- They now allow exactly one extra change: clearing an owner column that
-- points at the account being deleted, and only while delete_my_account()
-- has set the transaction-local "dangerbear.deleting_user" setting.
-- Everything else is protected exactly as before.
create or replace function public.protect_location_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deleting_user uuid := nullif(current_setting('dangerbear.deleting_user', true), '')::uuid;
begin
  if public.is_admin() then
    if new.admin_status is distinct from old.admin_status then
      new.admin_reviewed_by := auth.uid();
      new.admin_reviewed_at := now();
    end if;
  else
    new.admin_status := old.admin_status;
    new.admin_reviewed_at := old.admin_reviewed_at;
    new.admin_rejection_reason := old.admin_rejection_reason;
    new.visible_from := old.visible_from;

    if not (deleting_user is not null and old.admin_reviewed_by = deleting_user and new.admin_reviewed_by is null) then
      new.admin_reviewed_by := old.admin_reviewed_by;
    end if;
    if not (deleting_user is not null and old.submitted_by = deleting_user and new.submitted_by is null) then
      new.submitted_by := old.submitted_by;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.protect_review_identity_fields()
returns trigger
language plpgsql
as $$
declare
  deleting_user uuid := nullif(current_setting('dangerbear.deleting_user', true), '')::uuid;
begin
  new.location_id := old.location_id;
  if not (deleting_user is not null and old.user_id = deleting_user and new.user_id is null) then
    new.user_id := old.user_id;
  end if;
  return new;
end;
$$;

-- Deletes the calling user's own account. Anyone signed in can delete
-- only themselves (auth.uid()); there's no parameter to target another
-- account. The app removes the user's avatar files through the Storage
-- API first, because deleting storage rows in SQL leaves the files behind.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'You must be signed in to delete your account.';
  end if;

  if public.is_admin() and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'You are the only admin. Invite another admin before deleting your account.';
  end if;

  perform set_config('dangerbear.deleting_user', caller::text, true);

  update public.locations set submitted_by = null where submitted_by = caller;
  update public.locations set admin_reviewed_by = null where admin_reviewed_by = caller;
  update public.reviews set user_id = null where user_id = caller;
  update public.location_photos set uploaded_by = null where uploaded_by = caller;
  update public.admin_invites set created_by = null where created_by = caller;
  update public.admin_invites set used_by = null where used_by = caller;
  -- admin_section_checks.last_checked_by is already "on delete set null".

  -- Storage files the user uploaded (location photos) stay. Depending on
  -- the Storage version, storage.objects may keep an owner reference to
  -- the user; clear it if this role is allowed to, otherwise carry on.
  begin
    update storage.objects set owner = null where owner = caller;
  exception when others then
    null;
  end;

  -- Cascades to profiles and profile_tag_preferences.
  delete from auth.users where id = caller;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
