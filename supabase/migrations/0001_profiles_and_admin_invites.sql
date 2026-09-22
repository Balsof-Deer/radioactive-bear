-- Phase 2: profiles, roles, and the admin invite system.
-- Review this file before running it. Paste it into the Supabase
-- dashboard's SQL Editor (Project > SQL Editor > New query) and run it.

create extension if not exists pgcrypto;

-- One row per authenticated user. Created automatically by the
-- handle_new_user trigger below; never inserted directly by client code.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile the moment someone signs up. Runs with elevated
-- privileges (security definer) so it can insert despite RLS.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Used inside RLS policies to check the caller's role. Marked security
-- definer so its internal select bypasses RLS on profiles, which avoids
-- infinite recursion (a profiles policy can't safely query profiles
-- directly under its own RLS).
create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Profiles are viewable by owner or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- A user may update their own row, but only if role stays the same
-- (compares the incoming role to what's currently stored). Admins may
-- update any row, including role. This is the only generic path to
-- changing a profile; it can never promote someone to admin.
create policy "Users can update own profile, admins can update any"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (
    (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()))
    or public.is_admin()
  );

-- Admin invites: single-use, expiring, optionally locked to one email.
-- Only admins can create or view them.
create table public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references public.profiles (id),
  restricted_email text,
  expires_at timestamptz not null default (now() + interval '72 hours'),
  used_at timestamptz,
  used_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.admin_invites enable row level security;

create policy "Only admins can view invites"
  on public.admin_invites for select
  using (public.is_admin());

create policy "Only admins can create invites"
  on public.admin_invites for insert
  with check (public.is_admin() and created_by = auth.uid());

-- The only path in the entire system that can promote a user to admin.
-- Validates the code (exists, unused, unexpired, email-matched if
-- restricted), then promotes the CALLER (not an arbitrary user id) and
-- marks the invite as used. Security definer lets it write role, which
-- the policy above otherwise blocks for a user's own row.
create function public.redeem_admin_invite(invite_code text)
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

  select email into caller_email from public.profiles where id = auth.uid();

  if invite.restricted_email is not null and lower(invite.restricted_email) <> lower(caller_email) then
    raise exception 'This invite is not valid for your account';
  end if;

  update public.profiles set role = 'admin' where id = auth.uid();
  update public.admin_invites set used_at = now(), used_by = auth.uid() where id = invite.id;

  return true;
end;
$$;

-- Only logged-in users can call this (not anonymous visitors).
revoke all on function public.redeem_admin_invite(text) from public;
grant execute on function public.redeem_admin_invite(text) to authenticated;
