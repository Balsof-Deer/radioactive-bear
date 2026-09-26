-- Security fixes from the release-readiness review (2026-09-26).
-- Run after 0013. Safe to re-run (create or replace / drop if exists).

-- ============================================================
-- 1. Email-locked admin invites checked against the real login email
-- ============================================================
-- redeem_admin_invite compared a restricted invite to profiles.email,
-- which users could edit on their own row, so anyone holding a leaked
-- email-locked code could change that field to match and become admin.
-- It now uses the email on the auth account (auth.users), which only
-- Supabase Auth can change. Signature unchanged, so existing grants stay.
create or replace function public.redeem_admin_invite(invite_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.admin_invites%rowtype;
  caller_email text;
begin
  select * into invite from public.admin_invites where code = invite_code for update;

  if not found then
    raise exception 'Invalid invite code';
  end if;

  if invite.used_at is not null then
    raise exception 'Invite code already used';
  end if;

  if invite.expires_at < now() then
    raise exception 'Invite code expired';
  end if;

  select u.email into caller_email from auth.users u where u.id = auth.uid();

  if invite.restricted_email is not null
     and (caller_email is null or lower(invite.restricted_email) <> lower(caller_email)) then
    raise exception 'This invite is not valid for your account';
  end if;

  update public.profiles set role = 'admin' where id = auth.uid();
  update public.admin_invites set used_at = now(), used_by = auth.uid() where id = invite.id;

  return true;
end;
$$;

-- ============================================================
-- 2. profiles.email is a copy of the login email, not user-editable
-- ============================================================
-- Admins see this email (Users, Approvals), so it must be the real one.
-- Updates from the app can no longer change it (for anyone, admins
-- included); it only changes when the auth account's email changes.
create or replace function public.protect_profile_email()
returns trigger
language plpgsql
as $$
begin
  if current_setting('dangerbear.syncing_email', true) is distinct from 'on' then
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_email on public.profiles;
create trigger profiles_protect_email
  before update on public.profiles
  for each row execute function public.protect_profile_email();

-- Keeps the copy in sync when a login email changes.
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    perform set_config('dangerbear.syncing_email', 'on', true);
    update public.profiles set email = new.email where id = new.id;
    perform set_config('dangerbear.syncing_email', '', true);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- Correct any profile email that was already changed to something else.
do $$
begin
  perform set_config('dangerbear.syncing_email', 'on', true);
  update public.profiles p
  set email = u.email
  from auth.users u
  where u.id = p.id and p.email is distinct from u.email;
  perform set_config('dangerbear.syncing_email', '', true);
end;
$$;

-- ============================================================
-- 3. Spam limit: 10 new locations per student per 24 hours
-- ============================================================
-- (User's decision.) Admins are never limited. Security definer so the
-- count includes all of the caller's own submissions regardless of RLS.
create or replace function public.enforce_location_submission_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if (
    select count(*) from public.locations l
    where l.submitted_by = auth.uid() and l.created_at > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'You can add up to 10 locations a day. Try again tomorrow.';
  end if;

  return new;
end;
$$;

drop trigger if exists locations_enforce_submission_limit on public.locations;
create trigger locations_enforce_submission_limit
  before insert on public.locations
  for each row execute function public.enforce_location_submission_limit();

-- ============================================================
-- 4. Upload limits on the photo buckets: 10 MB, common image types only
-- ============================================================
-- Last on purpose: if this project doesn't allow editing buckets from
-- SQL, set the same limits in Dashboard > Storage > (bucket) > Edit
-- bucket instead; everything above has already been applied.
update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('location-photos', 'avatars');
