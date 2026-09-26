import { ViewAnnotation } from '@maplibre/maplibre-react-native';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius, Typography, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LOCATION_STATUS_LABEL } from '@/lib/location-status';
import type { NearbyLocation } from '@/lib/locations';

type LocationMarkerProps = {
  location: NearbyLocation;
  selected: boolean;
  onPress: (location: NearbyLocation) => void;
};

const SELECTED_SCALE = 1.15;
const SPRING = { damping: 14, stiffness: 260 };

// Rating capsule pin: the location's real average rating, or "New" before
// its first review. Approved = white, pending = mustard, rejected = brick
// (only submitters and admins see those). Selected = forest green with one
// ring pulse to show what changed.
export function LocationMarker({ location, selected, onPress }: LocationMarkerProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.micro.lineHeight * fontScale;
  // Space around the capsule that still counts as a tap on it.
  const hitPadding = lineHeight * 0.45;

  const isPending = location.status === 'pending_private' || location.status === 'pending_public';
  const isRejected = location.status === 'rejected';
  const hasRating = location.review_count > 0 && location.average_rating !== null;
  const ratingText = hasRating ? Number(location.average_rating).toFixed(1) : 'New';

  let fill: ThemeColor = 'surfaceContainer';
  let border: ThemeColor = 'outlineVariant';
  let text: ThemeColor = 'onSurface';
  if (isPending) [fill, border, text] = ['statusModerateContainer', 'statusModerate', 'statusModerate'];
  if (isRejected) [fill, border, text] = ['statusBusyContainer', 'statusBusy', 'statusBusy'];
  if (selected) [fill, border, text] = ['primary', 'primary', 'onPrimary'];

  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);

  useEffect(() => {
    scale.set(withSpring(selected ? SELECTED_SCALE : 1, SPRING));
    if (selected) {
      pulse.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 700 })));
    }
  }, [selected, scale, pulse]);

  const capsuleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: selected ? 0.5 * (1 - pulse.get()) : 0,
    transform: [{ scale: 1 + pulse.get() * 0.6 }],
  }));

  const accessibilityLabel = [
    location.name,
    hasRating
      ? `${ratingText} stars from ${location.review_count} review${location.review_count === 1 ? '' : 's'}`
      : 'no reviews yet',
    LOCATION_STATUS_LABEL[location.status],
  ].join(', ');

  return (
    <ViewAnnotation
      id={location.id}
      lngLat={[location.longitude, location.latitude]}
      onPress={() => onPress(location)}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.hitArea, { padding: hitPadding }]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.ring, { borderColor: theme.primary, margin: hitPadding }, ringStyle]}
        />
        <Animated.View
          style={[
            styles.capsule,
            {
              backgroundColor: theme[fill],
              borderColor: theme[border],
              paddingVertical: lineHeight * 0.3,
              paddingHorizontal: lineHeight * 0.6,
              gap: lineHeight * 0.2,
            },
            capsuleStyle,
          ]}>
          {hasRating && (
            <ThemedText type="micro" style={{ color: theme.amber }}>
              ★
            </ThemedText>
          )}
          <ThemedText type="micro" style={{ color: theme[text] }}>
            {ratingText}
          </ThemedText>
        </Animated.View>
      </View>
    </ViewAnnotation>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    boxShadow: Elevation.level2,
  },
});
