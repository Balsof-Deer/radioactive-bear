import { Camera, Map, UserLocation, type CameraRef, type MapRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { Loading } from '@/components/loading';
import { LocationMarker } from '@/components/map/location-marker';
import { LocationSearchBar } from '@/components/map/location-search-bar';
import { SpotSheet } from '@/components/map/spot-sheet';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_RADIUS_KM, STREET_ZOOM } from '@/constants/map';
import { Elevation, Radius, Spacing, Typography } from '@/constants/theme';
import { useNearbyLocations } from '@/hooks/use-nearby-locations';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useTheme } from '@/hooks/use-theme';
import { useAppMenu } from '@/lib/app-menu';
import { distanceInMetres } from '@/lib/geo';
import type { NearbyLocation } from '@/lib/locations';
import { useWarmMapStyle } from '@/lib/map-style';
import { useErrorToast } from '@/lib/toast';

const PIN_TAP_GRACE_MS = 400;
const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;
const RECENTER_CORRECTION_METRES = 25;

export default function ExploreScreen() {
  const tabBarInset = useTabBarInset();
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const { openMenu } = useAppMenu();
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mapStyle = useWarmMapStyle(theme, isDark);
  const [selectedLocation, setSelectedLocation] = useState<NearbyLocation | null>(null);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);
  // When a pin was last tapped, so the same tap reaching the map underneath
  // doesn't immediately close the sheet it just opened.
  const lastPinPressAt = useRef(0);
  const { permission, userLocation, locations, isLoading, error, requestLocation } =
    useNearbyLocations(DEFAULT_RADIUS_KM);
  useErrorToast(error);

  if (permission === 'checking' || (permission === 'granted' && !userLocation)) {
    return (
      <ThemedView style={styles.centered}>
        <Loading />
      </ThemedView>
    );
  }

  if (permission === 'denied' || !userLocation) {
    const iconSize = Typography.bodyLarge.lineHeight * fontScale * 1.5;
    return (
      <ThemedView style={styles.centered}>
        <SafeAreaView style={styles.deniedContent}>
          <View style={[styles.deniedIcon, { backgroundColor: theme.primaryContainer, padding: iconSize / 2 }]}>
            <SymbolView
              name={{ android: 'location_off', web: 'location_off' }}
              size={iconSize}
              tintColor={theme.onPrimaryContainer}
            />
          </View>
          <ThemedText type="title" style={styles.centerText}>
            Turn on location to explore
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            DangerBear uses your location to show nearby places and filter results by distance.
          </ThemedText>
          <ThemedButton label="Allow location access" onPress={requestLocation} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  // MapLibre's compass (shown when the map is rotated) defaults to the top
  // right, under the floating search row; place it just below that row.
  // The row is as tall as the 44px-at-default floating controls.
  const searchRowHeight = Typography.bodyLarge.lineHeight * fontScale * 2;
  const compassPosition = { top: insets.top + Spacing.two + searchRowHeight + Spacing.two, right: Spacing.three };

  function handleSelect(location: NearbyLocation) {
    lastPinPressAt.current = Date.now();
    setSelectedLocation(location);
    cameraRef.current?.flyTo({ center: [location.longitude, location.latitude], duration: 500 });
  }

  function handleMapPress(event: { nativeEvent: { lngLat: [number, number] } }) {
    if (!isPlacingPin) {
      // Tapping the map outside the sheet closes it.
      if (Date.now() - lastPinPressAt.current > PIN_TAP_GRACE_MS) setSelectedLocation(null);
      return;
    }
    const [lng, lat] = event.nativeEvent.lngLat;
    setIsPlacingPin(false);
    router.push({ pathname: '/add-location', params: { lat: String(lat), lng: String(lng) } });
  }

  // Moves instantly to the phone's last known position (or where the map
  // loaded), zooming in to street level if the map is zoomed out further,
  // then corrects with a fresh GPS fix only if the student has moved. A
  // fresh fix alone can take several seconds, especially indoors.
  async function recenter() {
    const zoom = await mapRef.current?.getZoom().catch(() => undefined);
    const zoomIn = zoom === undefined || zoom < STREET_ZOOM ? { zoom: STREET_ZOOM } : {};

    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null);
    const start = lastKnown?.coords ?? userLocation;
    if (start) {
      cameraRef.current?.flyTo({ center: [start.longitude, start.latitude], ...zoomIn, duration: 500 });
    }

    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then(({ coords }) => {
        if (!start || distanceInMetres(start, coords) > RECENTER_CORRECTION_METRES) {
          cameraRef.current?.flyTo({
            center: [coords.longitude, coords.latitude],
            ...(start ? {} : zoomIn),
            duration: 500,
          });
        }
      })
      .catch(() => undefined);
  }

  function toggleAddMode() {
    setSelectedLocation(null);
    setIsPlacingPin((prev) => !prev);
  }

  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        mapStyle={mapStyle}
        style={styles.map}
        onPress={handleMapPress}
        compassPosition={compassPosition}>
        <Camera
          ref={cameraRef}
          initialViewState={{ center: [userLocation.longitude, userLocation.latitude], zoom: STREET_ZOOM }}
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
          <View style={styles.searchRow}>
            <IconButton icon="menu" label="Open menu" onPress={openMenu} variant="floating" />
            <View style={styles.searchBar}>
              <LocationSearchBar onSelect={handleSelect} />
            </View>
          </View>

          {isLoading && (
            <View style={styles.loadingRow} pointerEvents="none">
              <Loading scale={1.4} />
            </View>
          )}

          {isPlacingPin && (
            <View style={[styles.banner, { backgroundColor: theme.surfaceContainer }]}>
              <ThemedText type="small">Tap the map where the new location is.</ThemedText>
            </View>
          )}

        </View>

        <View style={[styles.bottomSlot, { paddingBottom: tabBarInset + Spacing.two }]} pointerEvents="box-none">
          <View style={styles.controls} pointerEvents="box-none">
            <IconButton icon="my_location" label="Show my location" onPress={recenter} variant="floating" />
            <IconButton
              icon={isPlacingPin ? 'close' : 'add'}
              label={isPlacingPin ? 'Cancel adding a location' : 'Add a location'}
              onPress={toggleAddMode}
              variant="filled"
              containerColor={isPlacingPin ? theme.error : theme.primary}
              iconColor={isPlacingPin ? theme.onError : theme.onPrimary}
              scale={2.5}
            />
          </View>

          {selectedLocation && (
            <SpotSheet location={selectedLocation} onClose={() => setSelectedLocation(null)} />
          )}
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
  deniedIcon: {
    borderRadius: Radius.full,
  },
  centerText: {
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  topSection: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  searchBar: {
    flex: 1,
  },
  loadingRow: {
    alignItems: 'center',
  },
  banner: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    boxShadow: Elevation.level2,
  },
  bottomSlot: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  // Map controls sit on the right edge, just above the spot sheet.
  controls: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
