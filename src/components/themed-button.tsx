import { LoadingIndicator } from '@expo/ui/jetpack-compose';
import { size } from '@expo/ui/jetpack-compose/modifiers';
import { Pressable, StyleSheet, useWindowDimensions, type PressableProps } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedHost } from '@/components/themed-host';
import { ThemedText } from '@/components/themed-text';
import { Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ThemedButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  // primary = M3 filled button (forest green), secondary = M3 tonal
  // button (sage), danger = tonal button in the error colours, for
  // destructive actions like deleting. text / textDanger = M3 text
  // buttons (no container until pressed), for quieter actions.
  // destructive = filled error-coloured button, for confirming a delete.
  variant?: 'primary' | 'secondary' | 'danger' | 'destructive' | 'text' | 'textDanger';
  loading?: boolean;
};

// Everything is relative rather than fixed pixels. Padding is a ratio of
// the label's line height (scaled by the phone's text-size setting), so a
// standard button is 44 tall at default text size (the spec's minimum
// touch target) and grows with it.
const LABEL_LINE_HEIGHT = Typography.bodyMediumBold.lineHeight;
const VERTICAL_PADDING_RATIO = 0.6;
const HORIZONTAL_PADDING_RATIO = 0.8;
const INDICATOR_RATIO = 1.4;
// Corner radius as a fraction of the button's measured height: fully round
// (a pill) at rest, morphing to squarer corners while pressed, as Material 3
// Expressive buttons do. Holds at any size, including two-line labels.
const RESTING_RADIUS_RATIO = 0.5;
const PRESSED_RADIUS_RATIO = 0.2;
const SPRING = { damping: 15, stiffness: 400 };

export function ThemedButton({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: ThemedButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const { fontScale } = useWindowDimensions();
  const lineHeight = LABEL_LINE_HEIGHT * fontScale;
  const indicatorSize = lineHeight * INDICATOR_RATIO;
  const restingHeight = lineHeight * (1 + 2 * VERTICAL_PADDING_RATIO);
  // Keep the same height while loading, even though the indicator is
  // taller than the label.
  const paddingVertical = (restingHeight - (loading ? indicatorSize : lineHeight)) / 2;
  // 0 = resting, 1 = pressed.
  const pressProgress = useSharedValue(0);
  const height = useSharedValue(restingHeight);
  const shapeStyle = useAnimatedStyle(() => ({
    borderRadius:
      height.get() * interpolate(pressProgress.get(), [0, 1], [RESTING_RADIUS_RATIO, PRESSED_RADIUS_RATIO]),
  }));

  const isTextButton = variant === 'text' || variant === 'textDanger';
  const containerColor = {
    primary: theme.primary,
    secondary: theme.secondaryContainer,
    danger: theme.errorContainer,
    destructive: theme.error,
    text: 'transparent',
    textDanger: 'transparent',
  }[variant];
  const contentColor = {
    primary: theme.onPrimary,
    secondary: theme.onSecondaryContainer,
    danger: theme.onErrorContainer,
    destructive: theme.onError,
    text: theme.primary,
    textDanger: theme.error,
  }[variant];
  // While loading, keep the button's colors so the indicator stays visible.
  const isDimmed = disabled && !loading;
  // Text buttons show an M3 state layer (content colour at 12%) while pressed.
  const stateLayerRest = withAlpha(contentColor, 0);
  const stateLayerPressed = withAlpha(contentColor, 0.12);
  const stateLayerStyle = useAnimatedStyle(() =>
    isTextButton
      ? { backgroundColor: interpolateColor(pressProgress.get(), [0, 1], [stateLayerRest, stateLayerPressed]) }
      : {}
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={4}
      onPressIn={(event) => {
        pressProgress.set(withSpring(1, SPRING));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressProgress.set(withSpring(0, SPRING));
        onPressOut?.(event);
      }}
      style={(state) => [styles.pressable, typeof style === 'function' ? style(state) : style]}
      {...rest}>
      <Animated.View
        onLayout={(event) => height.set(event.nativeEvent.layout.height)}
        style={[
          styles.button,
          {
            paddingVertical,
            paddingHorizontal: lineHeight * HORIZONTAL_PADDING_RATIO,
          },
          { backgroundColor: isDimmed && !isTextButton ? withAlpha(theme.onSurface, 0.12) : containerColor },
          shapeStyle,
          stateLayerStyle,
        ]}>
        {loading ? (
          <ThemedHost matchContents>
            <LoadingIndicator color={contentColor} modifiers={[size(indicatorSize, indicatorSize)]} />
          </ThemedHost>
        ) : (
          <ThemedText
            type="smallBold"
            style={{ color: isDimmed ? withAlpha(theme.onSurface, 0.38) : contentColor }}>
            {label}
          </ThemedText>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // No flexGrow: Yoga grows such children to all the space available
  // (e.g. the whole screen height in a ScrollView). The button keeps its
  // natural height, fills the width its container gives it, and sits
  // centered if a row makes the pressable taller.
  pressable: {
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
