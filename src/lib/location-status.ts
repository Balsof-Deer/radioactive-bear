import type { LocationStatus } from '@/lib/locations';
import type { ThemeColor } from '@/constants/theme';

export const LOCATION_STATUS_LABEL: Record<LocationStatus, string> = {
  pending_private: 'Pending (private)',
  pending_public: 'Pending review',
  approved_community: 'Community approved',
  approved_admin: 'Approved',
  rejected: 'Rejected',
};

// Spec semantic status colours: good (forest), moderate (mustard),
// busy (brick). Each has a matching container colour for pills.
export const LOCATION_STATUS_COLOR: Record<LocationStatus, ThemeColor> = {
  pending_private: 'statusModerate',
  pending_public: 'statusModerate',
  approved_community: 'statusGood',
  approved_admin: 'statusGood',
  rejected: 'statusBusy',
};

export const LOCATION_STATUS_CONTAINER: Record<LocationStatus, ThemeColor> = {
  pending_private: 'statusModerateContainer',
  pending_public: 'statusModerateContainer',
  approved_community: 'statusGoodContainer',
  approved_admin: 'statusGoodContainer',
  rejected: 'statusBusyContainer',
};
