import { createContext, use, useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { Toast, type ToastKind, type ToastMessage } from '@/components/toast';

type ToastValue = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

const ToastContext = createContext<ToastValue | null>(null);

export function useToast() {
  const value = use(ToastContext);
  if (!value) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return value;
}

// Drop-in replacement for useState<string | null>(null) for a screen's
// own error messages: every non-null set also shows an error toast, even
// when it's the same message as last time (e.g. the same mistake twice).
export function useErrorState(): [string | null, (message: string | null) => void] {
  const { showError } = useToast();
  const [error, setError] = useState<string | null>(null);
  const set = useCallback(
    (message: string | null) => {
      setError(message);
      if (message) showError(message);
    },
    [showError]
  );
  return [error, set];
}

// For errors that arrive from elsewhere (a data hook or a prop): shows a
// toast whenever the message changes to a new non-empty value.
export function useErrorToast(message: string | null | undefined) {
  const { showError } = useToast();
  useEffect(() => {
    if (message) showError(message);
  }, [message, showError]);
}

let nextId = 1;

// One toast at a time, drawn above every screen (including the sidebar and
// modals). A new message replaces the current one.
export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const show = useCallback((kind: ToastKind, message: string) => {
    setToast({ id: nextId++, kind, message });
  }, []);
  const showError = useCallback((message: string) => show('error', message), [show]);
  const showSuccess = useCallback((message: string) => show('success', message), [show]);
  const dismiss = useCallback((id: number) => {
    setToast((current) => (current?.id === id ? null : current));
  }, []);

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      <View style={styles.fill}>
        {children}
        {toast && <Toast key={toast.id} toast={toast} onDismiss={dismiss} />}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
