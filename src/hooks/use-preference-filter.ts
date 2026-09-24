import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { useSession } from '@/lib/auth-context';
import { fetchLocationTagsForLocations, fetchMyPreferredTagIds } from '@/lib/tags';

const STORAGE_KEY = 'preferenceFilterEnabled';

// Soft-sort/highlight preference filter: locations matching ANY of the
// user's preferred tags are surfaced (see usage), everything else stays
// visible but de-emphasized. Never hides anything outright.
export function usePreferenceFilter(locationIds: string[]) {
  const { session } = useSession();
  const [enabled, setEnabledState] = useState(false);
  const [preferredTagIds, setPreferredTagIds] = useState<string[]>([]);
  const [locationTagsMap, setLocationTagsMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!cancelled && value !== null) setEnabledState(value === 'true');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetchMyPreferredTagIds(session.user.id)
      .then((ids) => {
        if (!cancelled) setPreferredTagIds(ids);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [session]);

  const idsKey = locationIds.join(',');

  useEffect(() => {
    let cancelled = false;

    if (idsKey.length === 0) {
      Promise.resolve().then(() => {
        if (!cancelled) setLocationTagsMap({});
      });
      return () => {
        cancelled = true;
      };
    }

    fetchLocationTagsForLocations(idsKey.split(','))
      .then((map) => {
        if (!cancelled) setLocationTagsMap(map);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  function setEnabled(value: boolean) {
    setEnabledState(value);
    AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false').catch(() => undefined);
  }

  function matches(locationId: string): boolean {
    if (preferredTagIds.length === 0) return true;
    const tagIds = locationTagsMap[locationId] ?? [];
    return tagIds.some((tagId) => preferredTagIds.includes(tagId));
  }

  return { enabled, setEnabled, matches, hasPreferences: preferredTagIds.length > 0 };
}
