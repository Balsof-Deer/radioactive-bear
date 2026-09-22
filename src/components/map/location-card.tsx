import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import type { NearbyLocation } from '@/lib/locations';

type LocationCardProps = {
  location: NearbyLocation;
};

export function LocationCard({ location }: LocationCardProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.header}>
        <ThemedText type="smallBold" style={styles.name}>
          {location.name}
        </ThemedText>
        <ThemedText themeColor={LOCATION_STATUS_COLOR[location.status]} type="small">
          {LOCATION_STATUS_LABEL[location.status]}
        </ThemedText>
      </ThemedView>

      {location.address && (
        <ThemedText themeColor="textSecondary" type="small">
          {location.address}
        </ThemedText>
      )}

      <ThemedText themeColor="textSecondary" type="small">
        {location.review_count > 0
          ? `${location.average_rating?.toFixed(1)} average · ${location.review_count} review${location.review_count === 1 ? '' : 's'}`
          : 'No reviews yet'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flexShrink: 1,
  },
});
