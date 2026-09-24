import { useEffect, useState } from 'react';

import { searchLocations, type NearbyLocation } from '@/lib/locations';

const DEBOUNCE_MS = 300;

export function useLocationSearch(query: string) {
  const [results, setResults] = useState<NearbyLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    let cancelled = false;

    if (trimmed.length === 0) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setResults([]);
        setError(null);
      });
      return () => {
        cancelled = true;
      };
    }

    const timeoutId = setTimeout(() => {
      Promise.resolve()
        .then(() => {
          if (cancelled) return undefined;
          setIsSearching(true);
          setError(null);
          return searchLocations(trimmed);
        })
        .then((data) => {
          if (!cancelled && data) setResults(data);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Search failed.');
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  return { results, isSearching, error };
}
