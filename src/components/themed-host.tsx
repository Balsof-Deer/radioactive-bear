import { Host, type HostProps } from '@expo/ui/jetpack-compose';
import { useColorScheme } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// A Jetpack Compose Host seeded from the chosen colour scheme's primary, so
// any colours a native component doesn't take explicitly stay on-palette.
export function ThemedHost(props: Omit<HostProps, 'seedColor' | 'colorScheme'>) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = useTheme();

  return <Host seedColor={theme.primary} colorScheme={scheme} {...props} />;
}
