import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn<typeof fetch>();
  });

  it('should check authentication before showing the login form', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    render(<App />);

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', { credentials: 'include' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should show the login form when auth check fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});
