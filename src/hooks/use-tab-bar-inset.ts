import { useWindowDimensions } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';

// Size of the floating tab bar, relative to the text size (64 tall at
// default), and the gap it keeps from the bottom safe-area edge.
export function useTabBarMetrics() {
  const { fontScale } = useWindowDimensions();
  const height = Typography.bodyMediumBold.lineHeight * fontScale * 3.2;
  const margin = Spacing.three;
  return { height, margin };
}

// Space a tab screen leaves at the bottom (above the safe-area edge) so its
// last content can scroll clear of the floating tab bar.
export function useTabBarInset() {
  const { height, margin } = useTabBarMetrics();
  return height + margin * 2;
}
