import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import type { NearbyLocation } from '@/lib/locations';

type LocationListItemProps = {
  location: NearbyLocation;
  onPress?: (location: NearbyLocation) => void;
};

export function LocationListItem({ location, onPress }: LocationListItemProps) {
  return (
    <Pressable disabled={!onPress} onPress={() => onPress?.(location)}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <ThemedView type="backgroundElement" style={styles.titleGroup}>
          <ThemedText type="smallBold">{location.name}</ThemedText>
          {location.address && (
            <ThemedText themeColor="textSecondary" type="small">
              {location.address}
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.meta}>
          <ThemedText themeColor={LOCATION_STATUS_COLOR[location.status]} type="small">
            {LOCATION_STATUS_LABEL[location.status]}
          </ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            {location.review_count > 0 ? `${location.average_rating?.toFixed(1)} avg` : 'No reviews'}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  titleGroup: {
    flex: 1,
    gap: Spacing.half,
  },
  meta: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
});
