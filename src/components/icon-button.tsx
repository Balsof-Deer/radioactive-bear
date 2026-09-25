import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  icon: AndroidSymbol;
  // Read by screen readers, since the button has no visible text.
  label: string;
  onPress: () => void;
};

// Material 3 standard icon button. Sized from the body line height x the
// phone's text-size setting (48 across at default), icon at half that.
export function IconButton({ icon, label, onPress }: IconButtonProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const diameter = Typography.bodyLarge.lineHeight * fontScale * 2;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{ color: withAlpha(theme.onSurface, 0.1), borderless: true, radius: diameter / 2 }}
      style={[styles.button, { width: diameter, height: diameter, borderRadius: diameter / 2 }]}>
      <SymbolView name={{ android: icon, web: icon }} size={diameter / 2} tintColor={theme.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
