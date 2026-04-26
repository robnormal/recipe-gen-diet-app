import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { ToastHost } from '../components/toast/toast-host';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  action?: ToastAction;
  durationMs: number;
}

interface PushToastOptions {
  id?: string;
  message: string;
  action?: ToastAction;
  durationMs?: number;
  onDismiss?: () => void;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  pushToast: (toast: PushToastOptions) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const dismissCallbacksRef = useRef<Map<string, () => void>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    const onDismiss = dismissCallbacksRef.current.get(id);
    dismissCallbacksRef.current.delete(id);
    onDismiss?.();

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: PushToastOptions) => {
    const id = toast.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const durationMs = toast.durationMs ?? 5000;

    const existingTimer = timersRef.current.get(id);
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
    }

    if (toast.onDismiss) {
      dismissCallbacksRef.current.set(id, toast.onDismiss);
    } else {
      dismissCallbacksRef.current.delete(id);
    }

    setToasts((current) => [
      ...current.filter((currentToast) => currentToast.id !== id),
      { id, message: toast.message, action: toast.action, durationMs },
    ]);

    const timer = window.setTimeout(() => dismissToast(id), durationMs);
    timersRef.current.set(id, timer);

    return id;
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, pushToast, dismissToast }}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}
