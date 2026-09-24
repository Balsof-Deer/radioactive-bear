import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import type { NearbyLocation } from '@/lib/locations';

type LocationCardProps = {
  location: NearbyLocation;
  onClose: () => void;
};

export function LocationCard({ location, onClose }: LocationCardProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.header}>
        <ThemedView type="backgroundElement" style={styles.titleGroup}>
          <ThemedText type="smallBold">{location.name}</ThemedText>
          <ThemedText themeColor={LOCATION_STATUS_COLOR[location.status]} type="small">
            {LOCATION_STATUS_LABEL[location.status]}
          </ThemedText>
        </ThemedView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">{'×'}</ThemedText>
        </Pressable>
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

      <ThemedButton
        label="View details"
        variant="secondary"
        onPress={() => router.push(`/location/${location.id}`)}
      />
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
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titleGroup: {
    flex: 1,
    gap: Spacing.half,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
