import type { Role } from '@/lib/auth-context';
import type { LocationStatus } from '@/lib/locations';
import { supabase } from '@/lib/supabase';

// Every call here relies on RLS allowing admins (public.is_admin()); a
// non-admin calling these just gets empty results or a policy error.

export type PendingLocation = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  status: LocationStatus;
  created_at: string;
  visible_from: string;
  submitted_by: string;
  submitter_email: string | null;
};

export async function fetchPendingLocations(): Promise<PendingLocation[]> {
  const { data, error } = await supabase
    .from('locations_with_status')
    .select('id,name,address,description,status,created_at,visible_from,submitted_by')
    .is('admin_status', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as Omit<PendingLocation, 'submitter_email'>[];
  const submitterIds = [...new Set(rows.map((row) => row.submitted_by))];
  const emails = await fetchEmailsById(submitterIds);

  return rows.map((row) => ({ ...row, submitter_email: emails[row.submitted_by] ?? null }));
}

async function fetchEmailsById(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase.from('profiles').select('id,email').in('id', ids);
  if (error) {
    throw new Error(error.message);
  }
  return Object.fromEntries(data.map((row) => [row.id as string, row.email as string]));
}

export async function approveLocation(locationId: string): Promise<void> {
  const { error } = await supabase.from('locations').update({ admin_status: 'approved' }).eq('id', locationId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function rejectLocation(locationId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .update({ admin_status: 'rejected', admin_rejection_reason: reason || null })
    .eq('id', locationId);
  if (error) {
    throw new Error(error.message);
  }
}

// Ends the 24h private window early so the community can review it now.
export async function makeLocationVisibleNow(locationId: string): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .update({ visible_from: new Date().toISOString() })
    .eq('id', locationId);
  if (error) {
    throw new Error(error.message);
  }
}

// Photo files live in Storage and aren't removed by the database's
// cascade (only their location_photos rows are), so delete them first.
export async function deleteLocation(locationId: string): Promise<void> {
  const { data: photos, error: photosError } = await supabase
    .from('location_photos')
    .select('storage_path')
    .eq('location_id', locationId);
  if (photosError) {
    throw new Error(photosError.message);
  }

  const paths = photos.map((photo) => photo.storage_path as string);
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from('location-photos').remove(paths);
    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  const { error } = await supabase.from('locations').delete().eq('id', locationId);
  if (error) {
    throw new Error(error.message);
  }
}

export type ModerationReview = {
  id: string;
  location_id: string;
  location_name: string | null;
  overall_rating: number;
  body: string | null;
  created_at: string;
  reviewer_display_name: string | null;
  reviewer_email: string | null;
};

type ModerationReviewRow = {
  id: string;
  location_id: string;
  overall_rating: number;
  body: string | null;
  created_at: string;
  locations: { name: string } | null;
  profiles: { display_name: string | null; email: string } | null;
};

export async function fetchRecentReviews(): Promise<ModerationReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, location_id, overall_rating, body, created_at, locations(name), profiles(display_name, email)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as ModerationReviewRow[]).map((row) => ({
    id: row.id,
    location_id: row.location_id,
    location_name: row.locations?.name ?? null,
    overall_rating: row.overall_rating,
    body: row.body,
    created_at: row.created_at,
    reviewer_display_name: row.profiles?.display_name ?? null,
    reviewer_email: row.profiles?.email ?? null,
  }));
}

export type AdminInvite = {
  id: string;
  code: string;
  restricted_email: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export async function fetchInvites(): Promise<AdminInvite[]> {
  const { data, error } = await supabase
    .from('admin_invites')
    .select('id,code,restricted_email,expires_at,used_at,created_at')
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// The code and 72h expiry are generated by the database defaults.
export async function createInvite(restrictedEmail: string): Promise<AdminInvite> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error('You must be signed in to create an invite.');
  }

  const { data, error } = await supabase
    .from('admin_invites')
    .insert({ created_by: userId, restricted_email: restrictedEmail.trim() || null })
    .select('id,code,restricted_email,expires_at,used_at,created_at')
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  role: Role;
  created_at: string;
};

export async function fetchUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,display_name,role,created_at')
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export type AdminSection = 'reviews' | 'users' | 'locations';

export type BadgeCounts = {
  pending_locations: number;
  new_locations: number;
  new_reviews: number;
  new_users: number;
};

export async function fetchBadgeCounts(): Promise<BadgeCounts> {
  const { data, error } = await supabase.rpc('admin_badge_counts');
  if (error) {
    throw new Error(error.message);
  }
  return data as BadgeCounts;
}

export type SectionCheck = {
  section: AdminSection;
  last_checked_at: string;
  checked_by_name: string | null;
};

type SectionCheckRow = {
  section: AdminSection;
  last_checked_at: string;
  profiles: { display_name: string | null; email: string } | null;
};

export async function fetchSectionChecks(): Promise<Partial<Record<AdminSection, SectionCheck>>> {
  const { data, error } = await supabase
    .from('admin_section_checks')
    .select('section, last_checked_at, profiles(display_name, email)');
  if (error) {
    throw new Error(error.message);
  }

  const checks: Partial<Record<AdminSection, SectionCheck>> = {};
  for (const row of data as unknown as SectionCheckRow[]) {
    checks[row.section] = {
      section: row.section,
      last_checked_at: row.last_checked_at,
      checked_by_name: row.profiles?.display_name ?? row.profiles?.email ?? null,
    };
  }
  return checks;
}

// Shared by all admins: clears that section's badge for everyone and
// records who checked it.
export async function markSectionChecked(section: AdminSection): Promise<void> {
  const { error } = await supabase.rpc('mark_admin_section_checked', { section_name: section });
  if (error) {
    throw new Error(error.message);
  }
}

export type AdminLocation = PendingLocation & {
  average_rating: number | null;
  review_count: number;
};

export async function fetchAllLocations(): Promise<AdminLocation[]> {
  const { data, error } = await supabase
    .from('locations_with_status')
    .select('id,name,address,description,status,created_at,visible_from,submitted_by,average_rating,review_count')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as Omit<AdminLocation, 'submitter_email'>[];
  const emails = await fetchEmailsById([...new Set(rows.map((row) => row.submitted_by))]);
  return rows.map((row) => ({ ...row, submitter_email: emails[row.submitted_by] ?? null }));
}

// The only path to becoming an admin: a security-definer function that
// validates the code (unused, unexpired, email-matched if restricted).
export async function redeemAdminInvite(code: string): Promise<void> {
  const { error } = await supabase.rpc('redeem_admin_invite', { invite_code: code.trim() });
  if (error) {
    throw new Error(error.message);
  }
}
