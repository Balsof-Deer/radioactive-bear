import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Profile } from '@/lib/auth-context';
import { getAvatarUrl } from '@/lib/profile';

type ProfileAvatarProps = {
  profile: Profile | null;
  // Diameter as a multiple of the body text line height (scaled by the
  // phone's text-size setting), so it's relative rather than fixed pixels.
  scale?: number;
};

// The profile photo, or the first letter of the name/email on a tonal
// circle when there's no photo.
export function ProfileAvatar({ profile, scale = 2 }: ProfileAvatarProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const diameter = Typography.bodyLarge.lineHeight * fontScale * scale;
  const avatarPath = profile?.avatar_path ?? null;
  const [loaded, setLoaded] = useState<{ path: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!avatarPath) return;
    let cancelled = false;
    getAvatarUrl(avatarPath).then((url) => {
      if (!cancelled) setLoaded({ path: avatarPath, url });
    });
    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  // Ignore a URL loaded for a previous photo.
  const url = avatarPath && loaded?.path === avatarPath ? loaded.url : null;
  const initial = (profile?.display_name || profile?.email || '?').trim().charAt(0).toUpperCase();
  const circle = { width: diameter, height: diameter, borderRadius: diameter / 2 };

  if (url) {
    return <Image source={{ uri: url }} style={circle} contentFit="cover" accessibilityLabel="Profile photo" />;
  }

  return (
    <View style={[styles.fallback, circle, { backgroundColor: theme.primaryContainer }]}>
      <ThemedText
        style={{
          color: theme.onPrimaryContainer,
          fontSize: diameter * 0.45,
          lineHeight: diameter * 0.6,
          fontWeight: 600,
        }}>
        {initial}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
