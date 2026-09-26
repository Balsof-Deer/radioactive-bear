import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PhotoGalleryProps = {
  urls: string[];
  // For screen-reader labels ("Photo 1 of 3 of <name>").
  placeName: string;
};

// Large swipeable hero photos with page dots. Width follows the space it's
// given; height is a 4:3 ratio of that width.
export function PhotoGallery({ urls, placeName }: PhotoGalleryProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);

  if (urls.length === 0) return null;

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.container}>
      {width > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / width))}
          style={[styles.pager, { height: width * 0.75 }]}>
          {urls.map((url, index) => (
            <Image
              key={url}
              source={{ uri: url }}
              style={{ width, height: width * 0.75 }}
              contentFit="cover"
              accessibilityLabel={`Photo ${index + 1} of ${urls.length} of ${placeName}`}
            />
          ))}
        </ScrollView>
      )}
      {urls.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {urls.map((url, index) => (
            <View
              key={url}
              style={[
                styles.dot,
                { backgroundColor: index === page ? theme.primary : theme.outlineVariant },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  pager: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
});
