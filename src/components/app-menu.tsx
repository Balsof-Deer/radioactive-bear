import { BlurView } from 'expo-blur';
import { router, usePathname, type Href } from 'expo-router';
import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { useEffect, useMemo, useState, type RefObject } from 'react';
import { BackHandler, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAvatar } from '@/components/profile-avatar';
import { ThemedText } from '@/components/themed-text';
import { Shape, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/auth-context';

type MenuItem = {
  label: string;
  href: Href;
  icon: AndroidSymbol;
};

const ITEMS: MenuItem[] = [
  { label: 'Profile', href: '/profile', icon: 'account_circle' },
  { label: 'My reviews', href: '/my-reviews', icon: 'rate_review' },
  { label: 'My locations', href: '/my-locations', icon: 'location_on' },
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
const SPRING = { damping: 26, stiffness: 220 };

type AppMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  // The app content (a BlurTargetView) to blur behind the menu.
  blurTarget: RefObject<View | null>;
};

// Material 3 modal navigation drawer: slides in from the left over a
// dimmed scrim. Closes on a scrim tap, a swipe left, or the back button.
export function AppMenu({ isOpen, onClose, blurTarget }: AppMenuProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { profile, signOut } = useSession();
  const { width, fontScale } = useWindowDimensions();
  const panelWidth = width * PANEL_WIDTH_RATIO;
  const lineHeight = Typography.labelLarge.lineHeight * fontScale;

  // 0 = closed, 1 = open.
  const progress = useSharedValue(0);
  // The blur is only rendered while the menu is open or animating closed,
  // so it costs nothing the rest of the time.
  const [isBlurMounted, setIsBlurMounted] = useState(false);
  if (isOpen && !isBlurMounted) {
    setIsBlurMounted(true);
  }

  useEffect(() => {
    progress.set(
      withSpring(isOpen ? 1 : 0, SPRING, (finished) => {
        if (finished && !isOpen) scheduleOnRN(setIsBlurMounted, false);
      })
    );
  }, [isOpen, progress]);

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
        onMoveShouldSetPanResponder: (_event, gesture) =>
          gesture.dx < 0 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_event, gesture) => {
          progress.set(Math.min(1, Math.max(0, 1 + gesture.dx / panelWidth)));
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx < -panelWidth * SWIPE_CLOSE_RATIO || gesture.vx < -SWIPE_CLOSE_VELOCITY) {
            onClose();
          } else {
            progress.set(withSpring(1, SPRING));
          }
        },
      }),
    [panelWidth, onClose, progress]
  );

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.get() - 1) * panelWidth }],
  }));

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
            backgroundColor: theme.surfaceContainerLow,
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + Spacing.three,
          },
          panelStyle,
        ]}>
        <View style={styles.header}>
          <ProfileAvatar profile={profile} scale={2.5} />
          <ThemedText style={Typography.titleMedium} numberOfLines={1}>
            {profile?.display_name || 'Your account'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {profile?.email}
          </ThemedText>
        </View>

        <View style={styles.items}>
          {ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => go(item.href)}
                android_ripple={ripple}
                style={[
                  styles.item,
                  itemStyle,
                  isActive && { backgroundColor: theme.secondaryContainer },
                ]}>
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
            );
          })}
        </View>

        {/* Sign out stays pinned to the bottom of the menu. */}
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: Spacing.two,
    borderTopRightRadius: Shape.large,
    borderBottomRightRadius: Shape.large,
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
    borderRadius: Shape.full,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
});
