import { Host, type HostProps } from '@expo/ui/jetpack-compose';
import { useColorScheme } from 'react-native';

import { useThemePreference } from '@/lib/theme-preference';

// A Jetpack Compose Host themed with the same Material 3 scheme as the
// rest of the app (the user's accent as seed, or their wallpaper).
export function ThemedHost(props: Omit<HostProps, 'seedColor' | 'colorScheme'>) {
  const { seedColor } = useThemePreference();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return <Host seedColor={seedColor} colorScheme={scheme} {...props} />;
}
