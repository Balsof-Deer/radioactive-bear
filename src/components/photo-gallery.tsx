import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

type PhotoGalleryProps = {
  urls: string[];
  // For screen-reader labels ("Photo 1 of 3 of <name>").
  placeName: string;
};

// Share of the width the main photo takes, so the next one peeks in from
// the right as a cue to swipe (the M3 hero carousel). A single photo fills
// the width.
const ITEM_WIDTH_RATIO = 0.82;
const HEIGHT_RATIO = 0.62;

// Material 3 hero carousel: large rounded photos that snap one at a time,
// with the next photo peeking in. Sizes follow the width it's given.
export function PhotoGallery({ urls, placeName }: PhotoGalleryProps) {
  const [width, setWidth] = useState(0);

  if (urls.length === 0) return null;

  const itemWidth = urls.length === 1 ? width : width * ITEM_WIDTH_RATIO;
  const height = width * HEIGHT_RATIO;

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth + Spacing.two}
          decelerationRate="fast"
          contentContainerStyle={styles.row}
          style={{ height }}>
          {urls.map((url, index) => (
            <Image
              key={url}
              source={{ uri: url }}
              style={[styles.photo, { width: itemWidth, height }]}
              contentFit="cover"
              accessibilityLabel={`Photo ${index + 1} of ${urls.length} of ${placeName}`}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
  },
  photo: {
    borderRadius: Radius.xl,
  },
});
