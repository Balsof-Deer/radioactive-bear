import type { LocationStatus } from '@/lib/locations';
import type { ThemeColor } from '@/constants/theme';

export const LOCATION_STATUS_LABEL: Record<LocationStatus, string> = {
  pending_private: 'Pending (private)',
  pending_public: 'Pending review',
  approved_community: 'Community approved',
  approved_admin: 'Approved',
  rejected: 'Rejected',
};

export const LOCATION_STATUS_COLOR: Record<LocationStatus, ThemeColor> = {
  pending_private: 'textSecondary',
  pending_public: 'textSecondary',
  approved_community: 'tint',
  approved_admin: 'tint',
  rejected: 'danger',
};
