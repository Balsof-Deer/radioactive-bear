import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo } from 'react';
import {
  AccessibilityInfo,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { ThemedText } from '@/components/themed-text';
import { Elevation, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ToastKind = 'error' | 'success';

export type ToastMessage = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastProps = {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
};

// Errors stay a little longer so there's time to read what to fix.
const DURATION_MS: Record<ToastKind, number> = { error: 5000, success: 2500 };
const SPRING = { damping: 20, stiffness: 220 };
// Swiping up this far (or this fast) dismisses it.
const SWIPE_DISMISS_DISTANCE = 24;
const SWIPE_DISMISS_VELOCITY = 0.4;

// A pop-up card that springs in from the top, in the spec's colours: brick
// tint for errors, sage for success. It disappears on its own; tap it or
// swipe it up to dismiss sooner. Screen readers announce the message.
export function Toast({ toast, onDismiss }: ToastProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const iconSize = Typography.bodyLarge.lineHeight * fontScale;
  const isError = toast.kind === 'error';
  // 0 = hidden above the screen, 1 = shown.
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    progress.set(withSpring(1, SPRING));
    AccessibilityInfo.announceForAccessibility(toast.message);
    const timer = setTimeout(() => dismiss(), DURATION_MS[toast.kind]);
    return () => clearTimeout(timer);
    // Runs once per toast (a new toast remounts via its key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    progress.set(
      withTiming(0, { duration: 180 }, (finished) => {
        if (finished) scheduleOnRN(onDismiss, toast.id);
      })
    );
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_event, gesture) => {
          // Follows the finger upwards; resists being pulled down.
          dragY.set(gesture.dy < 0 ? gesture.dy : gesture.dy * 0.2);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy < -SWIPE_DISMISS_DISTANCE || gesture.vy < -SWIPE_DISMISS_VELOCITY) {
            dismiss();
          } else {
            dragY.set(withSpring(0, SPRING));
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragY]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * -80 + dragY.get() }],
  }));

  const containerColor = isError ? theme.errorContainer : theme.primaryContainer;
  const contentColor = isError ? theme.onErrorContainer : theme.onPrimaryContainer;

  return (
    <View pointerEvents="box-none" style={[styles.layer, { paddingTop: insets.top + Spacing.two }]}>
      <Animated.View {...panResponder.panHandlers} style={[styles.wrapper, animatedStyle]}>
        <Pressable
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityHint="Tap to dismiss"
          onPress={dismiss}
          style={[styles.card, { backgroundColor: containerColor }]}>
          <SymbolView
            name={{ android: isError ? 'error' : 'check_circle', web: isError ? 'error' : 'check_circle' }}
            size={iconSize}
            tintColor={contentColor}
          />
          <ThemedText type="smallBold" style={[styles.message, { color: contentColor }]}>
            {toast.message}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  wrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    boxShadow: Elevation.level2,
  },
  message: {
    flex: 1,
  },
});
