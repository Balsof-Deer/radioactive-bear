import { Camera, Map, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocationCard } from '@/components/map/location-card';
import { LocationMarker } from '@/components/map/location-marker';
import { LocationSearchBar } from '@/components/map/location-search-bar';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_RADIUS_KM, MAP_STYLE_URL } from '@/constants/map';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useNearbyLocations } from '@/hooks/use-nearby-locations';
import { useTheme } from '@/hooks/use-theme';
import type { NearbyLocation } from '@/lib/locations';

export default function ExploreScreen() {
  const theme = useTheme();
  const [selectedLocation, setSelectedLocation] = useState<NearbyLocation | null>(null);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const cameraRef = useRef<CameraRef>(null);
  const { permission, userLocation, locations, isLoading, error, requestLocation } =
    useNearbyLocations(DEFAULT_RADIUS_KM);

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

  function handleMapPress(event: { nativeEvent: { lngLat: [number, number] } }) {
    if (!isPlacingPin) return;
    const [lng, lat] = event.nativeEvent.lngLat;
    setIsPlacingPin(false);
    router.push({ pathname: '/add-location', params: { lat: String(lat), lng: String(lng) } });
  }

  return (
    <View style={styles.container}>
      <Map mapStyle={MAP_STYLE_URL} style={styles.map} onPress={handleMapPress}>
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
        <View style={styles.topSection} pointerEvents="box-none">
          <View style={styles.searchWrapper}>
            <LocationSearchBar onSelect={handleSelect} />
          </View>

          {isLoading && (
            <View style={styles.topBar} pointerEvents="box-none">
              <ActivityIndicator />
            </View>
          )}
        </View>

        {isPlacingPin && (
          <ThemedView type="backgroundElement" style={styles.banner}>
            <ThemedText type="small">Tap the map to place a pin for the new location.</ThemedText>
          </ThemedView>
        )}

        {!isPlacingPin && error && (
          <ThemedView type="backgroundElement" style={styles.banner}>
            <ThemedText themeColor="danger" type="small">
              {error}
            </ThemedText>
          </ThemedView>
        )}

        <View style={styles.bottomSlot} pointerEvents="box-none">
          {selectedLocation && (
            <View style={styles.cardWrapper}>
              <LocationCard location={selectedLocation} onClose={() => setSelectedLocation(null)} />
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlacingPin ? 'Cancel adding a location' : 'Add a location'}
          onPress={() => {
            setSelectedLocation(null);
            setIsPlacingPin((prev) => !prev);
          }}
          style={[styles.fab, { backgroundColor: isPlacingPin ? theme.danger : theme.tint }]}>
          <ThemedText type="title" style={styles.fabLabel}>
            {isPlacingPin ? '×' : '+'}
          </ThemedText>
        </Pressable>
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
  topSection: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  searchWrapper: {
    paddingHorizontal: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
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
  cardWrapper: {
    marginRight: 72,
  },
  fab: {
    position: 'absolute',
    right: Spacing.three,
    bottom: BottomTabInset + Spacing.five,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabLabel: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 32,
  },
});
