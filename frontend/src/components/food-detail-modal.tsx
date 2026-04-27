import { useEffect, useRef, useCallback } from 'react';
import { FoodDetailView } from './food-detail-view';
import { useFoodDetail } from '../hooks/useFoodDetail';

interface FoodDetailModalProps {
  foodId: number;
  onClose: () => void;
  onViewFullPage: (foodId: number) => void;
}

export function FoodDetailModal({ foodId, onClose, onViewFullPage }: FoodDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { foodDetailState, handlers } = useFoodDetail();

  useEffect(() => {
    handlers.loadFood(foodId);
  }, [foodId, handlers]);

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      trigger?.focus();
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        ref={dialogRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Food details"
      >
        <div className="modal-header">
          <h2>Food Details</h2>
          <div className="modal-actions">
            <button
              type="button"
              className="view-full-page-link"
              onClick={() => onViewFullPage(foodId)}
            >
              View full page
            </button>
            <button
              type="button"
              ref={closeButtonRef}
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        <div className="modal-body">
          <FoodDetailView
            food={foodDetailState.selectedFood}
            isLoading={foodDetailState.isLoadingFood}
            error={foodDetailState.foodError}
            onBack={onClose}
            mode="modal"
          />
        </div>
      </div>
    </div>
  );
}
