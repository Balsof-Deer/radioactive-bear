import { LoadingIndicator } from '@expo/ui/jetpack-compose';
import { size } from '@expo/ui/jetpack-compose/modifiers';
import { useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedHost } from '@/components/themed-host';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LoadingProps = {
  // Diameter as a multiple of the body line height x the phone's text size.
  scale?: number;
  style?: StyleProp<ViewStyle>;
};

// Material 3 Expressive's native morphing-shape loading indicator, in the
// brand colour.
export function Loading({ scale = 2, style }: LoadingProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const diameter = Typography.bodyLarge.lineHeight * fontScale * scale;

  return (
    <ThemedHost matchContents style={style}>
      <LoadingIndicator color={theme.primary} modifiers={[size(diameter, diameter)]} />
    </ThemedHost>
  );
}
