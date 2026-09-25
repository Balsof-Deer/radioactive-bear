import { BlurTargetView } from 'expo-blur';
import { createContext, use, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, type View } from 'react-native';

import { AppMenu } from '@/components/app-menu';

type AppMenuValue = {
  openMenu: () => void;
};

const AppMenuContext = createContext<AppMenuValue | null>(null);

export function useAppMenu() {
  const value = use(AppMenuContext);
  if (!value) {
    throw new Error('useAppMenu must be used within an AppMenuProvider');
  }
  return value;
}

// Renders the sidebar above everything in the signed-in app, so any tab
// can open it with useAppMenu().openMenu(). The app is wrapped in a blur
// target so the menu can blur what's behind it (Android needs this).
export function AppMenuProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const blurTargetRef = useRef<View | null>(null);

  return (
    <AppMenuContext.Provider value={{ openMenu: () => setIsOpen(true) }}>
      <BlurTargetView ref={blurTargetRef} style={styles.fill}>
        {children}
      </BlurTargetView>
      <AppMenu isOpen={isOpen} onClose={() => setIsOpen(false)} blurTarget={blurTargetRef} />
    </AppMenuContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
