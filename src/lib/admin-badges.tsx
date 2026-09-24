import { createContext, use, useCallback, useEffect, useState, type PropsWithChildren } from 'react';

import {
  fetchBadgeCounts,
  fetchSectionChecks,
  markSectionChecked,
  type AdminSection,
  type BadgeCounts,
  type SectionCheck,
} from '@/lib/admin';
import { useSession } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type AdminBadgesValue = {
  counts: BadgeCounts | null;
  checks: Partial<Record<AdminSection, SectionCheck>>;
  total: number;
  markChecked: (section: AdminSection) => void;
};

const AdminBadgesContext = createContext<AdminBadgesValue | null>(null);

export function useAdminBadges() {
  const value = use(AdminBadgesContext);
  if (!value) {
    throw new Error('useAdminBadges must be used within an AdminBadgesProvider');
  }
  return value;
}

// Does nothing for non-admins (no fetches, no live subscription).
export function AdminBadgesProvider({ children }: PropsWithChildren) {
  const { profile } = useSession();
  const isAdmin = profile?.role === 'admin';
  const [counts, setCounts] = useState<BadgeCounts | null>(null);
  const [checks, setChecks] = useState<Partial<Record<AdminSection, SectionCheck>>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    Promise.all([fetchBadgeCounts(), fetchSectionChecks()])
      .then(([nextCounts, nextChecks]) => {
        if (cancelled) return;
        setCounts(nextCounts);
        setChecks(nextChecks);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAdmin, refreshKey]);

  // Live updates while the app is open: any change another admin (or a
  // student) makes to these tables re-fetches the counts and markers.
  useEffect(() => {
    if (!isAdmin) return;
    const refresh = () => setRefreshKey((key) => key + 1);
    const channel = supabase
      .channel('admin-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_section_checks' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const total = counts
    ? counts.pending_locations + counts.new_locations + counts.new_reviews + counts.new_users
    : 0;

  // Stable identity so screens can call it from a mount effect.
  const markChecked = useCallback((section: AdminSection) => {
    // Refresh directly too, rather than relying only on the live update.
    markSectionChecked(section)
      .then(() => setRefreshKey((key) => key + 1))
      .catch(() => undefined);
  }, []);

  const value: AdminBadgesValue = { counts, checks, total, markChecked };

  return <AdminBadgesContext.Provider value={value}>{children}</AdminBadgesContext.Provider>;
}
