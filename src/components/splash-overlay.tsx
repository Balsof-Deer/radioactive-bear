import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/hooks/use-theme';

// Must match app.json's expo-splash-screen "imageWidth": the native splash
// draws splash-icon.png at this width, with the mark filling 56% of it
// (scripts/generate-logo-assets.py).
const NATIVE_SPLASH_IMAGE_WIDTH = 200;
const MARK_SIZE = NATIVE_SPLASH_IMAGE_WIDTH * 0.56;
const DURATION = 450;

// Continues the native launch screen seamlessly (same background, same
// logo, same size), then the logo grows slightly while the overlay fades
// into the app. Skipped when the phone asks for reduced motion.
export function SplashOverlay() {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const progress = useSharedValue(0);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + progress.get() * 0.15 }] }));

  if (!visible) return null;

  function start() {
    SplashScreen.hideAsync().finally(() => {
      if (reduceMotion) {
        setVisible(false);
        return;
      }
      progress.set(
        withTiming(1, { duration: DURATION, easing: Easing.bezier(0.2, 0, 0, 1) }, (finished) => {
          if (finished) scheduleOnRN(setVisible, false);
        })
      );
    });
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { backgroundColor: theme.background }, overlayStyle]}>
      <View onLayout={start}>
        <Animated.View style={logoStyle}>
          <Image
            source={isDark ? require('@/assets/images/logo-dark.png') : require('@/assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="DangerBear"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  logo: {
    width: MARK_SIZE,
    height: MARK_SIZE,
  },
});
