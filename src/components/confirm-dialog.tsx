import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { useEffect, type RefObject } from 'react';
import { BackHandler, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ConfirmRequest = {
  title: string;
  message: string;
  // What the red button says, e.g. "Delete" or "Delete account".
  confirmLabel: string;
  onConfirm: () => void;
};

type ConfirmDialogProps = {
  request: ConfirmRequest;
  onClose: () => void;
  blurTarget: RefObject<View | null>;
};

const SCRIM_OPACITY = 0.32;
const BLUR_INTENSITY = 50;
const SPRING = { damping: 20, stiffness: 260 };

// Centred card in the spec's look (white, radius 16, soft shadow) with a
// warning icon, Cancel as a text button and the destructive action as a
// solid red button. Springs in over a blurred, tinted background. Back or
// a tap outside cancels.
export function ConfirmDialog({ request, onClose, blurTarget }: ConfirmDialogProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const iconSize = Typography.display.lineHeight * fontScale;
  // 0 = hidden, 1 = shown.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withSpring(1, SPRING));
  }, [progress]);

  function dismiss(then?: () => void) {
    progress.set(
      withTiming(0, { duration: 150 }, (finished) => {
        if (finished) scheduleOnRN(onClose);
      })
    );
    then?.();
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss();
      return true;
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.92 + progress.get() * 0.08 }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView
          blurTarget={blurTarget}
          blurMethod="dimezisBlurViewSdk31Plus"
          intensity={BLUR_INTENSITY}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(theme.scrim, SCRIM_OPACITY) }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={() => dismiss()} accessibilityLabel="Cancel" />
      </Animated.View>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[styles.card, { backgroundColor: theme.surfaceContainer }, cardStyle]}>
          <View style={[styles.icon, { backgroundColor: theme.errorContainer, padding: iconSize * 0.35 }]}>
            <SymbolView
              name={{ android: 'delete', web: 'delete' }}
              size={iconSize}
              tintColor={theme.onErrorContainer}
            />
          </View>
          <ThemedText type="subtitle">{request.title}</ThemedText>
          <ThemedText themeColor="textSecondary">{request.message}</ThemedText>
          <View style={styles.actions}>
            <ThemedButton label="Cancel" variant="text" onPress={() => dismiss()} />
            <ThemedButton
              label={request.confirmLabel}
              variant="destructive"
              onPress={() => dismiss(request.onConfirm)}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    boxShadow: Elevation.level3,
  },
  icon: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    marginBottom: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
});
