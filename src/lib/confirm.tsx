import { BlurTargetView } from 'expo-blur';
import { createContext, use, useCallback, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, type View } from 'react-native';

import { ConfirmDialog, type ConfirmRequest } from '@/components/confirm-dialog';

type ConfirmValue = {
  // Asks before a destructive action; onConfirm runs only if confirmed.
  confirm: (request: ConfirmRequest) => void;
};

const ConfirmContext = createContext<ConfirmValue | null>(null);

export function useConfirm() {
  const value = use(ConfirmContext);
  if (!value) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return value.confirm;
}

// Styled replacement for the system Alert on delete confirmations. The
// app is wrapped in a blur target so the dialog can blur what's behind it,
// like the sidebar does.
export function ConfirmProvider({ children }: PropsWithChildren) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const blurTargetRef = useRef<View | null>(null);

  const confirm = useCallback((next: ConfirmRequest) => setRequest(next), []);
  const close = useCallback(() => setRequest(null), []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      <BlurTargetView ref={blurTargetRef} style={styles.fill}>
        {children}
      </BlurTargetView>
      {request && <ConfirmDialog request={request} onClose={close} blurTarget={blurTargetRef} />}
    </ConfirmContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
