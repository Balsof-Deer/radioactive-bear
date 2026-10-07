import { BlurView } from 'expo-blur';
import { router, usePathname, type Href } from 'expo-router';
import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { useEffect, useMemo, useState, type PropsWithChildren, type RefObject } from 'react';
import { BackHandler, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAvatar } from '@/components/profile-avatar';
import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-context';

type MenuItem = {
  label: string;
  href: Href;
  icon: AndroidSymbol;
};

const ITEMS: MenuItem[] = [
  { label: 'My spots', href: '/my-spots', icon: 'bookmark' },
  { label: 'Profile', href: '/profile', icon: 'account_circle' },
  { label: 'Change password', href: '/change-password', icon: 'lock' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
];

// All sizes are relative: the panel is a share of the screen width, and
// items/icons are ratios of the label line height x the phone's text size.
const PANEL_WIDTH_RATIO = 0.8;
const ITEM_HEIGHT_RATIO = 2.8;
const ICON_RATIO = 1.2;
// The blurred background is tinted with the M3 scrim color so menu
// content stays readable (and where blur isn't available, below
// Android 12, it's the plain dim M3 uses).
const SCRIM_OPACITY = 0.32;
const BLUR_INTENSITY = 60;
// Closing distance (share of the panel width) or speed for a swipe.
const SWIPE_CLOSE_RATIO = 0.3;
const SWIPE_CLOSE_VELOCITY = 0.5;
// Material 3 motion for a drawer: opening uses the emphasized-decelerate
// curve (quick start, long gentle settle, no overshoot); closing uses the
// shorter emphasized-accelerate curve; a swipe that doesn't close snaps
// back on the standard curve.
const OPEN = { duration: 400, easing: Easing.bezier(0.05, 0.7, 0.1, 1) };
const CLOSE = { duration: 200, easing: Easing.bezier(0.3, 0, 0.8, 0.15) };
const SETTLE = { duration: 250, easing: Easing.bezier(0.2, 0, 0, 1) };
// With "reduce motion" on, the menu only fades, and quickly.
const FADE = { duration: 150, easing: Easing.linear };
// The scrim reaches full strength in the first part of the opening, so the
// screen behind dims just ahead of the panel.
const SCRIM_LEAD = 0.6;
// The panel's contents arrive one after another while it opens: each starts
// a little later in the opening (as a share of it) and takes a fixed share.
const STAGGER_START = 0.25;
const STAGGER_STEP = 0.06;
const STAGGER_WINDOW = 0.45;

type AppMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  // The app content (a BlurTargetView) to blur behind the menu.
  blurTarget: RefObject<View | null>;
};

// Material 3 modal navigation drawer: slides in from the left over a
// dimmed scrim, its contents following in a short stagger. Closes on a
// scrim tap, a swipe left, or the back button.
export function AppMenu({ isOpen, onClose, blurTarget }: AppMenuProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { profile, signOut } = useSession();
  const { width, fontScale } = useWindowDimensions();
  const panelWidth = width * PANEL_WIDTH_RATIO;
  const lineHeight = Typography.bodyMediumBold.lineHeight * fontScale;
  const reduceMotion = useReducedMotion();

  // 0 = closed, 1 = open.
  const progress = useSharedValue(0);
  // The blur is only rendered while the menu is open or animating closed,
  // so it costs nothing the rest of the time.
  const [isBlurMounted, setIsBlurMounted] = useState(false);
  if (isOpen && !isBlurMounted) {
    setIsBlurMounted(true);
  }

  useEffect(() => {
    const timing = reduceMotion ? FADE : isOpen ? OPEN : CLOSE;
    progress.set(
      withTiming(isOpen ? 1 : 0, timing, (finished) => {
        if (finished && !isOpen) scheduleOnRN(setIsBlurMounted, false);
      })
    );
  }, [isOpen, progress, reduceMotion]);

  useEffect(() => {
    if (!isOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [isOpen, onClose]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => gesture.dx < 0 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_event, gesture) => {
          progress.set(Math.min(1, Math.max(0, 1 + gesture.dx / panelWidth)));
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx < -panelWidth * SWIPE_CLOSE_RATIO || gesture.vx < -SWIPE_CLOSE_VELOCITY) {
            onClose();
          } else {
            progress.set(withTiming(1, SETTLE));
          }
        },
      }),
    [panelWidth, onClose, progress]
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, SCRIM_LEAD], [0, 1], Extrapolation.CLAMP),
  }));
  const panelStyle = useAnimatedStyle(() =>
    reduceMotion
      ? { opacity: progress.get(), transform: [{ translateX: 0 }] }
      : { opacity: 1, transform: [{ translateX: (progress.get() - 1) * panelWidth }] }
  );
  // Contents slide in from about one line height to the left.
  const revealDistance = lineHeight;

  function go(href: Href) {
    onClose();
    router.push(href);
  }

  function handleSignOut() {
    onClose();
    signOut();
  }

  const itemStyle = {
    minHeight: lineHeight * ITEM_HEIGHT_RATIO,
    paddingHorizontal: lineHeight * 0.8,
    gap: lineHeight * 0.6,
  };
  const ripple = { color: withAlpha(theme.onSurface, 0.1), foreground: true };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        {isBlurMounted && (
          <BlurView
            blurTarget={blurTarget}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={BLUR_INTENSITY}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(theme.scrim, SCRIM_OPACITY) }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        accessibilityViewIsModal
        style={[
          styles.panel,
          {
            width: panelWidth,
            backgroundColor: theme.surfaceContainer,
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + Spacing.three,
          },
          panelStyle,
        ]}>
        <Reveal progress={progress} order={0} distance={revealDistance} reduceMotion={reduceMotion}>
          <View style={styles.header}>
            <ProfileAvatar profile={profile} scale={2.5} />
            <ThemedText type="heading" numberOfLines={1}>
              {profile?.display_name || 'Your account'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {profile?.email}
            </ThemedText>
          </View>
        </Reveal>

        <View style={styles.items}>
          {ITEMS.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Reveal
                key={item.label}
                progress={progress}
                order={index + 1}
                distance={revealDistance}
                reduceMotion={reduceMotion}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => go(item.href)}
                  android_ripple={ripple}
                  style={[styles.item, itemStyle, isActive && { backgroundColor: theme.secondaryContainer }]}>
                  <SymbolView
                    name={{ android: item.icon, web: item.icon }}
                    size={lineHeight * ICON_RATIO}
                    tintColor={isActive ? theme.onSecondaryContainer : theme.onSurfaceVariant}
                  />
                  <ThemedText
                    type="smallBold"
                    style={{ color: isActive ? theme.onSecondaryContainer : theme.onSurfaceVariant }}>
                    {item.label}
                  </ThemedText>
                </Pressable>
              </Reveal>
            );
          })}
        </View>

        {/* Sign out stays pinned to the bottom of the menu. */}
        <Reveal progress={progress} order={ITEMS.length + 1} distance={revealDistance} reduceMotion={reduceMotion}>
          <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />
          <Pressable
            accessibilityRole="button"
            onPress={handleSignOut}
            android_ripple={ripple}
            style={[styles.item, itemStyle]}>
            <SymbolView
              name={{ android: 'logout', web: 'logout' }}
              size={lineHeight * ICON_RATIO}
              tintColor={theme.onSurfaceVariant}
            />
            <ThemedText type="smallBold" style={{ color: theme.onSurfaceVariant }}>
              Sign out
            </ThemedText>
          </Pressable>
        </Reveal>
      </Animated.View>
    </View>
  );
}

type RevealProps = PropsWithChildren<{
  // The menu's 0 (closed) to 1 (open) progress.
  progress: SharedValue<number>;
  // Position in the stagger: 0 arrives first.
  order: number;
  distance: number;
  reduceMotion: boolean;
}>;

// Fades and slides one block of the menu in during its own slice of the
// opening, so the contents settle after the panel itself. Driven by the
// same progress as the panel, so it also tracks a swipe to close.
function Reveal({ progress, order, distance, reduceMotion, children }: RevealProps) {
  const style = useAnimatedStyle(() => {
    const start = STAGGER_START + order * STAGGER_STEP;
    const shown = interpolate(progress.get(), [start, start + STAGGER_WINDOW], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: reduceMotion ? 1 : shown,
      transform: [{ translateX: reduceMotion ? 0 : (shown - 1) * distance }],
    };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: Spacing.two,
    borderTopRightRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    boxShadow: Elevation.level2,
  },
  header: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  items: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
});
