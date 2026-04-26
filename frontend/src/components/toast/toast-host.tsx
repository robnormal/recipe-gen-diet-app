import { ToastMessage } from '../../contexts/toast-context';
import { Toast } from './toast';

interface ToastHostProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-host">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
