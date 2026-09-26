import { Host, type HostProps } from '@expo/ui/jetpack-compose';
import { useColorScheme } from 'react-native';

import { BRAND_SEED } from '@/constants/theme';

// A Jetpack Compose Host themed from the brand's forest green, so any
// colours a native component doesn't take explicitly stay on-palette.
export function ThemedHost(props: Omit<HostProps, 'seedColor' | 'colorScheme'>) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return <Host seedColor={BRAND_SEED} colorScheme={scheme} {...props} />;
}
