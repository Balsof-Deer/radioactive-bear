import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'subtitle'
    | 'heading'
    | 'small'
    | 'smallBold'
    | 'label'
    | 'micro'
    | 'link'
    | 'linkPrimary'
    | 'code';
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
        type === 'subtitle' && styles.subtitle,
        type === 'heading' && styles.heading,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'label' && styles.label,
        type === 'micro' && styles.micro,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.link, { color: theme.primary }],
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

// Each app text style is a role from the Warm Academic type scale (Source Serif 4 and DM Sans).
const styles = StyleSheet.create({
  // Screen titles, spot names, profile name.
  title: Typography.display,
  // Section headers.
  subtitle: Typography.heading2,
  // Card titles.
  heading: Typography.heading3,
  // Descriptions and review text.
  default: Typography.bodyLarge,
  // General body, addresses, metadata.
  small: Typography.bodyMedium,
  // Button labels and short emphasised text.
  smallBold: Typography.bodyMediumBold,
  // Badges, tags, status pills.
  label: Typography.labelSmall,
  // Map pin ratings and dense data.
  micro: Typography.micro,
  link: Typography.bodyMedium,
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
