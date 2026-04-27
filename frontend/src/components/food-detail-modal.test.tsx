import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodDetailModal } from './food-detail-modal';

describe('FoodDetailModal', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/portions')) {
        return Promise.resolve(
          new Response(JSON.stringify({ portions: [] }), { status: 200 })
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: 1,
            description: 'Test Food',
            calorie_density: 1.0,
            nutrients: [],
          }),
          { status: 200 }
        )
      );
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders and calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<FoodDetailModal foodId={1} onClose={onClose} onViewFullPage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on backdrop click', async () => {
    const onClose = vi.fn();
    render(<FoodDetailModal foodId={1} onClose={onClose} onViewFullPage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn();
    render(<FoodDetailModal foodId={1} onClose={onClose} onViewFullPage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('restores focus on unmount', async () => {
    const onClose = vi.fn();
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const { unmount } = render(<FoodDetailModal foodId={1} onClose={onClose} onViewFullPage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    unmount();

    expect(document.activeElement).toBe(button);
    document.body.removeChild(button);
  });

  it('calls onViewFullPage when View full page is clicked', async () => {
    const onViewFullPage = vi.fn();
    render(<FoodDetailModal foodId={1} onClose={vi.fn()} onViewFullPage={onViewFullPage} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'View full page' }));
    expect(onViewFullPage).toHaveBeenCalledWith(1);
  });
});
