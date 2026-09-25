import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.link, { color: theme.primary }],
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

// Each app text style maps onto a Material 3 type-scale role. Headings and
// bold labels use a heavier weight for Material 3 Expressive's emphasis.
const styles = StyleSheet.create({
  default: {
    ...Typography.bodyLarge,
    fontWeight: 400,
  },
  small: {
    ...Typography.bodyMedium,
    fontWeight: 400,
  },
  smallBold: {
    ...Typography.titleSmall,
    fontWeight: 600,
  },
  title: {
    ...Typography.displayMedium,
    fontWeight: 600,
  },
  subtitle: {
    ...Typography.headlineMedium,
    fontWeight: 600,
  },
  link: {
    ...Typography.bodyMedium,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
