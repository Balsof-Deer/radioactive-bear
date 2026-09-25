import { router } from 'expo-router';

import { IconButton } from '@/components/icon-button';

// Goes back one screen. Always placed at the left of a page header.
export function BackButton() {
  return <IconButton icon="arrow_back" label="Back" onPress={() => router.back()} />;
}
