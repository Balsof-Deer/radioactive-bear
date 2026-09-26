import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { IconButton } from '@/components/icon-button';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_CONTAINER, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import { fetchLocationPhotos, type NearbyLocation } from '@/lib/locations';
import { formatRating } from '@/lib/rating';
import { fetchReviews } from '@/lib/reviews';
import { getLocationPhotoUrl } from '@/lib/storage';
import { fetchLocationTagIds, fetchTags } from '@/lib/tags';

type SpotSheetProps = {
  location: NearbyLocation;
  onClose: () => void;
};

type SpotDetails = {
  locationId: string;
  tagLabels: string[];
  photoUrls: string[];
  quote: { body: string; author: string; date: string } | null;
};

const MAX_PHOTOS = 6;
// The expanded sheet never covers more than this share of the screen.
const MAX_HEIGHT_RATIO = 0.62;
const SPRING = { damping: 24, stiffness: 240 };

async function loadDetails(location: NearbyLocation): Promise<SpotDetails> {
  const [allTags, tagIds, photos, reviews] = await Promise.all([
    fetchTags(),
    fetchLocationTagIds(location.id),
    fetchLocationPhotos(location.id),
    fetchReviews(location.id),
  ]);
  const photoUrls = (
    await Promise.all(photos.slice(0, MAX_PHOTOS).map((photo) => getLocationPhotoUrl(photo.storage_path)))
  ).filter((url): url is string => url !== null);
  // Newest review that has written text (reviews come newest first).
  const withText = reviews.find((review) => review.body?.trim());

  return {
    locationId: location.id,
    tagLabels: allTags.filter((tag) => tagIds.includes(tag.id)).map((tag) => tag.label),
    photoUrls,
    quote: withText
      ? {
          body: withText.body!.trim(),
          // Reviewer names are only readable by their owner and admins.
          author:
            withText.user_id === null ? 'Deleted user' : (withText.reviewer_display_name ?? 'A student'),
          date: new Date(withText.created_at).toLocaleDateString(),
        }
      : null,
  };
}

// Draggable spot sheet (spec "spot triage card"): peeks with the essentials
// and actions, drags or taps up to reveal the description, photos and the
// latest review. Snap points are measured from the content.
export function SpotSheet({ location, onClose }: SpotSheetProps) {
  const theme = useTheme();
  const { height: windowHeight, fontScale } = useWindowDimensions();
  const [details, setDetails] = useState<SpotDetails | null>(null);
  const [peekHeight, setPeekHeight] = useState(0);
  const [restHeight, setRestHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shownLocationId, setShownLocationId] = useState(location.id);

  // Collapse back to the peek whenever a different spot is selected.
  if (shownLocationId !== location.id) {
    setShownLocationId(location.id);
    setIsExpanded(false);
  }

  useEffect(() => {
    let cancelled = false;
    loadDetails(location)
      .then((next) => {
        if (!cancelled) setDetails(next);
      })
      .catch(() => {
        if (!cancelled) setDetails({ locationId: location.id, tagLabels: [], photoUrls: [], quote: null });
      });
    return () => {
      cancelled = true;
    };
  }, [location]);

  const current = details?.locationId === location.id ? details : null;

  const expandedHeight = Math.min(peekHeight + restHeight, windowHeight * MAX_HEIGHT_RATIO);
  const travel = Math.max(0, expandedHeight - peekHeight);

  // 0 = peek, 1 = expanded.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withSpring(isExpanded ? 1 : 0, SPRING));
  }, [isExpanded, progress]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_event, gesture) => {
          if (travel === 0) return;
          const start = isExpanded ? 1 : 0;
          progress.set(Math.min(1, Math.max(0, start - gesture.dy / travel)));
        },
        onPanResponderRelease: (_event, gesture) => {
          const shouldExpand = gesture.vy < -0.3 || (gesture.vy <= 0.3 && progress.get() > 0.5);
          setIsExpanded(shouldExpand);
          progress.set(withSpring(shouldExpand ? 1 : 0, SPRING));
        },
      }),
    [travel, isExpanded, progress]
  );

  const sheetStyle = useAnimatedStyle(() => ({
    height: peekHeight === 0 ? undefined : peekHeight + progress.get() * travel,
  }));

  const lineHeight = Typography.bodyMedium.lineHeight * fontScale;
  const photoSize = lineHeight * 4.5;
  const hasRating = location.review_count > 0 && location.average_rating !== null;

  return (
    <Animated.View
      accessibilityViewIsModal={isExpanded}
      style={[styles.sheet, { backgroundColor: theme.surfaceContainer }, sheetStyle]}>
      <View {...panResponder.panHandlers} onLayout={(event) => setPeekHeight(event.nativeEvent.layout.height)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Show less' : 'Show more about this spot'}
          onPress={() => setIsExpanded((value) => !value)}
          style={styles.handleArea}>
          <View style={[styles.handle, { backgroundColor: theme.outlineVariant }]} />
        </Pressable>

        <View style={styles.peek}>
          <View style={styles.titleRow}>
            <View style={styles.titleGroup}>
              <ThemedText type="title" numberOfLines={2}>
                {location.name}
              </ThemedText>
              <View style={styles.metaRow}>
                <View
                  style={[styles.statusPill, { backgroundColor: theme[LOCATION_STATUS_CONTAINER[location.status]] }]}>
                  <ThemedText type="label" themeColor={LOCATION_STATUS_COLOR[location.status]}>
                    {LOCATION_STATUS_LABEL[location.status]}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {hasRating
                    ? `${formatRating(location.average_rating)} from ${location.review_count} review${location.review_count === 1 ? '' : 's'}`
                    : 'No reviews yet'}
                </ThemedText>
              </View>
            </View>
            <IconButton icon="close" label="Close" onPress={onClose} />
          </View>

          {location.address && (
            <ThemedText type="small" themeColor="textSecondary">
              {location.address}
            </ThemedText>
          )}

          {current && current.tagLabels.length > 0 && (
            <View style={styles.tags}>
              {current.tagLabels.map((label) => (
                <View key={label} style={[styles.tag, { backgroundColor: theme.primaryContainer }]}>
                  <ThemedText type="label" style={{ color: theme.onPrimaryContainer }}>
                    {label}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <ThemedButton
              label="View details"
              variant="secondary"
              style={styles.action}
              onPress={() => router.push(`/location/${location.id}`)}
            />
            <ThemedButton
              label="Write a review"
              style={styles.action}
              onPress={() => router.push({ pathname: '/location/[id]', params: { id: location.id, review: '1' } })}
            />
          </View>
        </View>
      </View>

      <ScrollView
        scrollEnabled={isExpanded}
        contentContainerStyle={styles.rest}
        onContentSizeChange={(_width, height) => setRestHeight(height)}>
        {location.description && <ThemedText>{location.description}</ThemedText>}

        {current && current.photoUrls.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
            {current.photoUrls.map((url) => (
              <Image
                key={url}
                source={{ uri: url }}
                style={[styles.photo, { width: photoSize, height: photoSize }]}
                contentFit="cover"
                accessibilityLabel={`Photo of ${location.name}`}
              />
            ))}
          </ScrollView>
        )}

        {current?.quote && (
          <View style={[styles.quote, { backgroundColor: theme.surfaceContainerLow }]}>
            <ThemedText>“{current.quote.body}”</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {current.quote.author}, {current.quote.date}
            </ThemedText>
          </View>
        )}

        {current && !location.description && current.photoUrls.length === 0 && !current.quote && (
          <ThemedText type="small" themeColor="textSecondary">
            No description, photos or written reviews yet. Be the first to review it.
          </ThemedText>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    overflow: 'hidden',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    boxShadow: Elevation.level3,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  handle: {
    width: '12%',
    height: 4,
    borderRadius: Radius.full,
  },
  peek: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titleGroup: {
    flex: 1,
    gap: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusPill: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  tag: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  action: {
    flex: 1,
  },
  rest: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  photos: {
    gap: Spacing.two,
  },
  photo: {
    borderRadius: Radius.md,
  },
  quote: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
