import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { fetchNearbyLocations, type NearbyLocation } from '@/lib/locations';

export type UserCoordinates = { latitude: number; longitude: number };

type PermissionState = 'checking' | 'granted' | 'denied';

export function useNearbyLocations(radiusKm: number) {
  const [permission, setPermission] = useState<PermissionState>('checking');
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [locations, setLocations] = useState<NearbyLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  function requestLocation() {
    setAttempt((n) => n + 1);
  }

  useEffect(() => {
    let cancelled = false;

    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (cancelled) return null;
        if (status !== 'granted') {
          setPermission('denied');
          return null;
        }
        setPermission('granted');
        return Location.getCurrentPositionAsync({});
      })
      .then((position) => {
        if (cancelled || !position) return;
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (!userLocation) return;
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        setIsLoading(true);
        setError(null);
      })
      .then(() => fetchNearbyLocations(userLocation.latitude, userLocation.longitude, radiusKm * 1000))
      .then((results) => {
        if (!cancelled) setLocations(results);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load locations');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userLocation, radiusKm]);

  return { permission, userLocation, locations, isLoading, error, requestLocation };
}
