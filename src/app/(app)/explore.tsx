import { Camera, Map, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocationCard } from '@/components/map/location-card';
import { LocationMarker } from '@/components/map/location-marker';
import { RadiusSelector } from '@/components/map/radius-selector';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_RADIUS_KM, MAP_STYLE_URL } from '@/constants/map';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useNearbyLocations } from '@/hooks/use-nearby-locations';
import type { NearbyLocation } from '@/lib/locations';

export default function ExploreScreen() {
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [selectedLocation, setSelectedLocation] = useState<NearbyLocation | null>(null);
  const cameraRef = useRef<CameraRef>(null);
  const { permission, userLocation, locations, isLoading, error, requestLocation } =
    useNearbyLocations(radiusKm);

  if (permission === 'checking') {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (permission === 'denied') {
    return (
      <ThemedView style={styles.centered}>
        <SafeAreaView style={styles.deniedContent}>
          <ThemedText type="subtitle">Location access needed</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.deniedText}>
            DangerBear uses your location to show nearby places and filter results by distance.
            Enable location access to continue.
          </ThemedText>
          <ThemedButton label="Try again" onPress={requestLocation} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!userLocation) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  function handleSelect(location: NearbyLocation) {
    setSelectedLocation(location);
    cameraRef.current?.flyTo({ center: [location.longitude, location.latitude], duration: 500 });
  }

  return (
    <View style={styles.container}>
      <Map mapStyle={MAP_STYLE_URL} style={styles.map}>
        <Camera
          ref={cameraRef}
          initialViewState={{ center: [userLocation.longitude, userLocation.latitude], zoom: 14 }}
        />
        <UserLocation />
        {locations.map((location) => (
          <LocationMarker
            key={location.id}
            location={location}
            selected={selectedLocation?.id === location.id}
            onPress={handleSelect}
          />
        ))}
      </Map>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar} pointerEvents="box-none">
          <RadiusSelector value={radiusKm} onChange={setRadiusKm} />
          {isLoading && <ActivityIndicator />}
        </View>

        {error && (
          <ThemedView type="backgroundElement" style={styles.banner}>
            <ThemedText themeColor="danger" type="small">
              {error}
            </ThemedText>
          </ThemedView>
        )}

        {!isLoading && !error && locations.length === 0 && (
          <ThemedView type="backgroundElement" style={styles.banner}>
            <ThemedText themeColor="textSecondary" type="small">
              No locations within {radiusKm} km yet.
            </ThemedText>
          </ThemedView>
        )}

        <View style={styles.bottomSlot} pointerEvents="box-none">
          {selectedLocation && <LocationCard location={selectedLocation} />}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  deniedText: {
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  banner: {
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  bottomSlot: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.two,
  },
});
