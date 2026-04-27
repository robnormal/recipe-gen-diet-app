import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumbs } from './breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders crumbs with last as current page', () => {
    render(<Breadcrumbs crumbs={[{ label: 'Recipes' }, { label: 'Chili' }]} />);

    expect(screen.getByRole('button', { name: 'Recipes' })).toBeInTheDocument();
    expect(screen.getByText('Chili')).toHaveAttribute('aria-current', 'page');
  });

  it('calls onClick for intermediate crumbs', async () => {
    const onClick = vi.fn();
    render(<Breadcrumbs crumbs={[{ label: 'Recipes', onClick }, { label: 'Chili' }]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Recipes' }));
    expect(onClick).toHaveBeenCalled();
  });

  it('truncates long labels with title attribute', () => {
    render(<Breadcrumbs crumbs={[{ label: 'A very long label that should be truncated' }]} />);

    const current = screen.getByText('A very long label that should be truncated');
    expect(current).toHaveAttribute('title', 'A very long label that should be truncated');
  });
});
