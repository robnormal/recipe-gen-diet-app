import { ToastMessage } from '../../contexts/toast-context';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <div className="toast-content">
        <span>{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            className="toast-action"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          className="toast-dismiss"
          aria-label="Dismiss notification"
          onClick={() => onDismiss(toast.id)}
        >
          x
        </button>
      </div>
      <div
        className="toast-countdown"
        style={{ animationDuration: `${toast.durationMs}ms` }}
      />
    </div>
  );
}
