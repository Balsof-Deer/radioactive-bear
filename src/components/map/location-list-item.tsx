import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Tile } from '@/components/tile';
import { Radius, Spacing, Typography, withAlpha, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDistance } from '@/lib/geo';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_CONTAINER, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import type { NearbyLocation } from '@/lib/locations';
import { formatRating } from '@/lib/rating';

type LocationListItemProps = {
  location: NearbyLocation;
  onPress?: (location: NearbyLocation) => void;
  // Metres from the student, when their location is known.
  distanceMetres?: number | null;
  // Shows the "Matches you" tag (preference filter on and a match).
  matchesPreferences?: boolean;
  // Draws a hairline above the row (for rows after the first in a list).
  showDivider?: boolean;
  // Horizontal padding inside the row: on for standalone lists like the
  // search dropdown, off when the page already provides side margins.
  inset?: boolean;
  // Leads the row with the rating on a tinted tile (Home list).
  showTile?: boolean;
};

// Each location keeps the same tile tint, picked from its id, so the list
// has some warmth and variety without the colours meaning anything.
const TINTS: ThemeColor[] = ['primaryContainer', 'statusGoodContainer', 'surfaceContainerHigh'];

function tintFor(id: string): ThemeColor {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}

// List row: name and rating on the first line (or the rating on a leading
// tinted tile), address, then the distance, status pill and preference
// match. Rows are separated by hairlines.
export function LocationListItem({
  location,
  onPress,
  distanceMetres,
  matchesPreferences = false,
  showDivider = false,
  inset = true,
  showTile = false,
}: LocationListItemProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const tileSize = Typography.bodyLarge.lineHeight * fontScale * 3;
  const hasRating = location.review_count > 0 && location.average_rating !== null;
  const ratingLabel = hasRating
    ? `Rated ${formatRating(location.average_rating)} out of 5 from ${location.review_count} review${location.review_count === 1 ? '' : 's'}`
    : 'No reviews yet';

  return (
    <Pressable
      disabled={!onPress}
      onPress={() => onPress?.(location)}
      accessibilityRole="button"
      android_ripple={{ color: withAlpha(theme.onSurface, 0.1) }}
      style={[
        styles.row,
        inset && styles.inset,
        showDivider && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
        showTile && styles.withShape,
      ]}>
      {showTile && (
        <View accessible accessibilityLabel={ratingLabel}>
          <Tile color={theme[tintFor(location.id)]} size={tileSize}>
            <ThemedText type="subtitle">{hasRating ? formatRating(location.average_rating) : 'New'}</ThemedText>
          </Tile>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText type="heading" style={styles.name}>
            {location.name}
          </ThemedText>
          {!showTile && (
            <ThemedText
              type="heading"
              themeColor={hasRating ? 'text' : 'textSecondary'}
              accessibilityLabel={ratingLabel}>
              {hasRating ? formatRating(location.average_rating) : 'New'}
            </ThemedText>
          )}
        </View>

        {location.address && (
          <ThemedText type="small" themeColor="textSecondary">
            {location.address}
          </ThemedText>
        )}

        <View style={styles.metaRow}>
          {distanceMetres != null && (
            <ThemedText type="small" themeColor="textSecondary">
              {formatDistance(distanceMetres)}
            </ThemedText>
          )}
          <View style={[styles.pill, { backgroundColor: theme[LOCATION_STATUS_CONTAINER[location.status]] }]}>
            <ThemedText type="label" themeColor={LOCATION_STATUS_COLOR[location.status]}>
              {LOCATION_STATUS_LABEL[location.status]}
            </ThemedText>
          </View>
          {matchesPreferences && (
            <View style={[styles.pill, { backgroundColor: theme.tertiaryContainer }]}>
              <ThemedText type="label" style={{ color: theme.onTertiaryContainer }}>
                Matches you
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  inset: {
    paddingHorizontal: Spacing.three,
  },
  withShape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  pill: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
