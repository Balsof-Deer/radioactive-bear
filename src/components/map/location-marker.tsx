import { ViewAnnotation } from '@maplibre/maplibre-react-native';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { NearbyLocation } from '@/lib/locations';
import { useTheme } from '@/hooks/use-theme';

type LocationMarkerProps = {
  location: NearbyLocation;
  selected: boolean;
  onPress: (location: NearbyLocation) => void;
};

export function LocationMarker({ location, selected, onPress }: LocationMarkerProps) {
  const theme = useTheme();
  const isApproved = location.status === 'approved_admin' || location.status === 'approved_community';

  return (
    <ViewAnnotation
      id={location.id}
      lngLat={[location.longitude, location.latitude]}
      onPress={() => onPress(location)}>
      <ThemedView
        style={[
          styles.pin,
          {
            backgroundColor: isApproved ? theme.tint : theme.textSecondary,
            borderColor: theme.background,
            transform: [{ scale: selected ? 1.2 : 1 }],
          },
        ]}
      />
    </ViewAnnotation>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: Spacing.three,
    height: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 2,
  },
});
