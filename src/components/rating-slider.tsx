import { Box, Row, Shape, Slider } from '@expo/ui/jetpack-compose';
import { background, clip, fillMaxWidth, height, Shapes, size, weight } from '@expo/ui/jetpack-compose/modifiers';
import { useWindowDimensions } from 'react-native';

import { ThemedHost } from '@/components/themed-host';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { RATING_MAX, RATING_MIN, RATING_STEP, snapRating } from '@/lib/rating';

type RatingSliderProps = {
  // null = not rated yet: the thumb rests at 0 and the track is empty.
  value: number | null;
  onChange: (value: number) => void;
};

// Values between the two ends: 0, 0.5, ... 5 is 11 positions, 9 between.
const STEPS = (RATING_MAX - RATING_MIN) / RATING_STEP - 1;

// Compact native Material 3 slider (0 to 5 in half steps) with a slim track
// and small thumb in the brand colours, instead of the default chunky
// Expressive slider. Sizes are relative to the body text size.
export function RatingSlider({ value, onChange }: RatingSliderProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.bodyMedium.lineHeight * fontScale;
  const trackHeight = lineHeight * 0.25;
  const thumbSize = lineHeight * 0.9;
  const fraction = ((value ?? RATING_MIN) - RATING_MIN) / (RATING_MAX - RATING_MIN);

  return (
    <ThemedHost matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Slider
        value={value ?? RATING_MIN}
        min={RATING_MIN}
        max={RATING_MAX}
        steps={STEPS}
        // Snapped again here so stored values are always valid half steps.
        onValueChange={(next) => onChange(snapRating(next))}>
        <Slider.Thumb>
          <Box
            modifiers={[
              size(thumbSize, thumbSize),
              clip(Shapes.Circle),
              background(value === null ? theme.outline : theme.primary),
            ]}
          />
        </Slider.Thumb>
        <Slider.Track>
          <Row modifiers={[fillMaxWidth(), height(trackHeight)]}>
            <Shape.RoundedCorner
              color={theme.primary}
              cornerRadii={{ topStart: trackHeight / 2, bottomStart: trackHeight / 2 }}
              modifiers={[weight(Math.max(fraction, 0.01)), height(trackHeight)]}
            />
            <Shape.RoundedCorner
              color={theme.surfaceContainerHighest}
              cornerRadii={{ topEnd: trackHeight / 2, bottomEnd: trackHeight / 2 }}
              modifiers={[weight(Math.max(1 - fraction, 0.01)), height(trackHeight)]}
            />
          </Row>
        </Slider.Track>
      </Slider>
    </ThemedHost>
  );
}
