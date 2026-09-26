import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Elevation, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  icon: AndroidSymbol;
  // Read by screen readers, since the button has no visible text.
  label: string;
  onPress: () => void;
  // standard = no container (headers); floating = white surface with the
  // spec's floating shadow (map controls); filled = a solid colour (FAB).
  variant?: 'standard' | 'floating' | 'filled';
  // For variant="filled": container and icon colours.
  containerColor?: string;
  iconColor?: string;
  // Diameter as a multiple of the body line height x the phone's text
  // size (2 = 44 at default, the spec's minimum touch target).
  scale?: number;
};

// Material 3 icon button, sized relative to text size, icon at half the
// diameter.
export function IconButton({
  icon,
  label,
  onPress,
  variant = 'standard',
  containerColor,
  iconColor,
  scale = 2,
}: IconButtonProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const diameter = Typography.bodyLarge.lineHeight * fontScale * scale;

  const background =
    variant === 'floating' ? theme.surfaceContainer : variant === 'filled' ? (containerColor ?? theme.primary) : undefined;
  const tint =
    iconColor ?? (variant === 'filled' ? theme.onPrimary : variant === 'floating' ? theme.onSurface : theme.onSurfaceVariant);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{
        color: withAlpha(variant === 'filled' ? tint : theme.onSurface, variant === 'filled' ? 0.2 : 0.1),
        borderless: variant === 'standard',
        radius: diameter / 2,
        foreground: variant !== 'standard',
      }}
      style={[
        styles.button,
        { width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: background },
        variant !== 'standard' && styles.raised,
      ]}>
      <SymbolView name={{ android: icon, web: icon }} size={diameter / 2} tintColor={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  raised: {
    overflow: 'hidden',
    boxShadow: Elevation.level2,
  },
});
