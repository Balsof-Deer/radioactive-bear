import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useTabBarMetrics } from '@/hooks/use-tab-bar-inset';
import { useTheme } from '@/hooks/use-theme';
import { useAdminBadges } from '@/lib/admin-badges';
import { useSession } from '@/lib/auth-context';

type TabDef = {
  name: string;
  href: '/' | '/explore' | '/my-spots' | '/admin';
  label: string;
  icon: AndroidSymbol;
};

const STUDENT_TABS: TabDef[] = [
  { name: 'index', href: '/', label: 'Home', icon: 'home' },
  { name: 'explore', href: '/explore', label: 'Explore', icon: 'explore' },
  { name: 'my-spots', href: '/my-spots', label: 'My spots', icon: 'bookmark' },
];

const ADMIN_TAB: TabDef = { name: 'admin', href: '/admin', label: 'Admin', icon: 'shield_person' };

// One motion for the whole bar: Material's standard curve, 250 ms. The
// active pill widens and fills in together; its label fades in just after
// it starts growing and fades out quickly when another tab is picked.
// (Layout and fade animations follow the phone's reduce-motion setting.)
const DURATION = 250;
const EASING = Easing.bezier(0.2, 0, 0, 1);
const LAYOUT = LinearTransition.duration(DURATION).easing(EASING);
const LABEL_IN = FadeIn.duration(150).delay(100);
const LABEL_OUT = FadeOut.duration(100);
// The bar fades out of the way while typing and back afterwards.
const BAR_IN = FadeIn.duration(150);
const BAR_OUT = FadeOut.duration(100);

// The app's tab bar: a pill in the primary colour floating above the
// content (the Warm Academic mockup's bar). The active tab grows into an
// ivory pill with its label; the others are icons only. The Admin tab is
// only registered for admins, so students can't navigate to it. Profile and
// Settings aren't tabs: they open from the menu.
export default function AppTabs() {
  const { profile } = useSession();
  const isAdmin = profile?.role === 'admin';
  const didLandAdmin = useRef(false);
  const tabs = isAdmin ? [...STUDENT_TABS, ADMIN_TAB] : STUDENT_TABS;

  // Admins land on their own home (the Admin tab) when the app opens,
  // but can still switch to the other tabs freely afterwards.
  useEffect(() => {
    if (isAdmin && !didLandAdmin.current) {
      didLandAdmin.current = true;
      router.navigate('/admin');
    }
  }, [isAdmin]);

  return (
    <Tabs>
      <TabSlot />
      <FloatingTabBar tabs={tabs} />
      {/* The routes the tabs switch between; the bar above draws them. */}
      <TabList style={styles.hidden}>
        {tabs.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} />
        ))}
      </TabList>
    </Tabs>
  );
}

function FloatingTabBar({ tabs }: { tabs: TabDef[] }) {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { height, margin } = useTabBarMetrics();
  const { total: adminBadgeTotal } = useAdminBadges();
  // Primary-colour bar in light mode; in dark mode a raised surface, so it
  // still stands off the dark canvas.
  const barColor = isDark ? theme.surfaceContainerHigh : theme.primary;
  // Out of the way while typing: Android would otherwise lift the bar
  // above the keyboard, on top of the field being edited.
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (isKeyboardOpen) return null;

  return (
    <Animated.View
      entering={BAR_IN}
      exiting={BAR_OUT}
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          height,
          left: margin,
          right: margin,
          bottom: insets.bottom + margin,
          borderRadius: height / 2,
          backgroundColor: barColor,
        },
      ]}>
      {tabs.map((tab) => (
        <TabTrigger key={tab.name} name={tab.name} asChild>
          <TabButton tab={tab} height={height} badge={tab.name === 'admin' ? adminBadgeTotal : 0} />
        </TabTrigger>
      ))}
    </Animated.View>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  tab: TabDef;
  height: number;
  badge: number;
};

const TabButton = forwardRef<View, TabButtonProps>(function TabButton(
  { tab, height, badge, isFocused, ...pressableProps },
  ref
) {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const pillHeight = height * 0.75;
  // Active pill and its content, and the inactive icon colour, on the bar.
  const pillColor = isDark ? theme.primary : theme.surface;
  const activeContent = isDark ? theme.onPrimary : theme.onSurface;
  const inactiveContent = isDark ? theme.onSurface : theme.onPrimary;
  const iconSize = pillHeight * 0.5;
  const reduceMotion = useReducedMotion();

  // 0 = inactive, 1 = active: fades the pill's fill in step with its width.
  const focus = useSharedValue(isFocused ? 1 : 0);
  useEffect(() => {
    focus.set(withTiming(isFocused ? 1 : 0, { duration: reduceMotion ? 0 : DURATION, easing: EASING }));
  }, [isFocused, focus, reduceMotion]);
  const transparentPill = withAlpha(pillColor, 0);
  const pillFillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(focus.get(), [0, 1], [transparentPill, pillColor]),
  }));

  return (
    <Animated.View layout={LAYOUT}>
      <Pressable
        ref={ref}
        {...pressableProps}
        accessibilityRole="tab"
        accessibilityLabel={badge > 0 ? `${tab.label}, ${badge} to check` : tab.label}
        accessibilityState={{ selected: isFocused }}
        android_ripple={{ color: withAlpha(isFocused ? activeContent : inactiveContent, 0.16) }}
        style={[styles.button, { borderRadius: pillHeight / 2 }]}>
        {/* The pill is its own layer: on Android a ripple replaces the
            pressable's own background colour, which hid it. */}
        <Animated.View
          style={[
            styles.pill,
            {
              height: pillHeight,
              minWidth: pillHeight,
              borderRadius: pillHeight / 2,
              paddingHorizontal: isFocused ? pillHeight * 0.4 : 0,
            },
            pillFillStyle,
          ]}>
          <View>
            <SymbolView
              name={{ android: tab.icon, web: tab.icon }}
              size={iconSize}
              tintColor={isFocused ? activeContent : inactiveContent}
            />
            {badge > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.error,
                    borderColor: isFocused ? pillColor : isDark ? theme.surfaceContainerHigh : theme.primary,
                    minWidth: iconSize * 0.7,
                    height: iconSize * 0.7,
                    borderRadius: iconSize * 0.35,
                  },
                ]}>
                <ThemedText type="micro" style={{ color: theme.onError, lineHeight: iconSize * 0.6 }}>
                  {badge > 99 ? '99+' : badge}
                </ThemedText>
              </View>
            )}
          </View>
          {isFocused && (
            <Animated.View entering={LABEL_IN} exiting={LABEL_OUT}>
              <ThemedText type="smallBold" numberOfLines={1} style={{ color: activeContent }}>
                {tab.label}
              </ThemedText>
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
  bar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.two,
    boxShadow: Elevation.level2,
  },
  // Clips the ripple to the pill's rounded shape.
  button: {
    overflow: 'hidden',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  badge: {
    position: 'absolute',
    top: -Spacing.one,
    right: -Spacing.two,
    borderWidth: 2,
    paddingHorizontal: Spacing.half,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
});
