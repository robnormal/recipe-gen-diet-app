import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  it('should fetch and display the health status from the backend', async () => {
    // Mock the fetch response
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ status: 'ok', message: 'Backend API is running' }),
    });

    render(<App />);

    // Initially shows loading message
    expect(screen.getByText('Connecting to backend...')).toBeInTheDocument();

    // Wait for the health status to be displayed
    await waitFor(() => {
      expect(screen.getByText('Backend API is running')).toBeInTheDocument();
    });

    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith('/api/health');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should display loading message when fetch fails', async () => {
    // Mock fetch to reject
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    // Should still show connecting message on error
    expect(screen.getByText('Connecting to backend...')).toBeInTheDocument();

    // Wait a bit to ensure the component doesn't update
    await waitFor(() => {
      expect(screen.getByText('Connecting to backend...')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});
