import { IconButton } from '@/components/icon-button';
import { useAppMenu } from '@/lib/app-menu';

// Opens the sidebar.
export function MenuButton() {
  const { openMenu } = useAppMenu();
  return <IconButton icon="menu" label="Open menu" onPress={openMenu} />;
}
