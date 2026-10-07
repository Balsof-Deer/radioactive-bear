import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type TileProps = PropsWithChildren<{
  color: string;
  // Width and height, in points; callers derive it from the text size.
  size: number;
  style?: StyleProp<ViewStyle>;
}>;

// Corner radius as a share of the tile's size, so every tile has the same
// soft rounded-square look however big it is.
const CORNER_RATIO = 0.3;

// A soft rounded square in one colour with its children (a rating, an icon)
// centred on it: the Warm Academic tiles for thumbnails and badges.
export function Tile({ color, size, style, children }: TileProps) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * CORNER_RATIO, backgroundColor: color },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
