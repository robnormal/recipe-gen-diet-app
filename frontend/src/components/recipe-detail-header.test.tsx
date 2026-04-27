import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InlineField, RecipeDetailHeader } from './recipe-detail-header';
import { Recipe, RecipeEditableValue } from '../types';

function InlineFieldHarness({
  initialValue,
  onSave,
}: {
  initialValue: RecipeEditableValue;
  onSave?: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <InlineField
      value={value}
      placeholder="Add value"
      ariaLabel="Test field"
      onSave={async (nextValue) => {
        if (onSave) {
          await onSave(nextValue);
        }
        setValue(nextValue || null);
      }}
    />
  );
}

const recipe: Recipe = {
  id: 1,
  user_id: 1,
  name: 'Chili',
  description: 'Bean-heavy dinner',
  instructions: 'Simmer until thick.',
  servings: 4,
  total_time_minutes: 30,
  calorie_density: 1.2,
  nutrients: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('InlineField', () => {
  it('commits edits with Enter', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => undefined);

    render(<InlineFieldHarness initialValue="Old value" onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: /test field/i }));
    const input = screen.getByRole('textbox', { name: /test field/i });
    await user.clear(input);
    await user.type(input, 'New value{Enter}');

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('New value'));
    expect(screen.getByRole('button', { name: /new value/i })).toBeInTheDocument();
  });

  it('cancels edits with Escape', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => undefined);

    render(<InlineFieldHarness initialValue="Old value" onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: /test field/i }));
    const input = screen.getByRole('textbox', { name: /test field/i });
    await user.clear(input);
    await user.type(input, 'Discarded{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /old value/i })).toBeInTheDocument();
  });

  it('reverts and shows an error when save rejects', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => {
      throw new Error('Unable to save');
    });

    render(<InlineFieldHarness initialValue="Old value" onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: /test field/i }));
    const input = screen.getByRole('textbox', { name: /test field/i });
    await user.clear(input);
    await user.type(input, 'New value{Enter}');

    expect(await screen.findByText('Unable to save')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /old value/i })).toBeInTheDocument();
  });
});

describe('RecipeDetailHeader', () => {
  it('saves individual metadata fields', async () => {
    const user = userEvent.setup();
    const onFieldSave = vi.fn(async () => undefined);

    render(<RecipeDetailHeader recipe={recipe} onFieldSave={onFieldSave} />);

    await user.click(screen.getByRole('button', { name: /recipe servings/i }));
    const servingsInput = screen.getByRole('spinbutton', { name: /recipe servings/i });
    await user.clear(servingsInput);
    await user.type(servingsInput, '6');
    await user.tab();

    await waitFor(() => expect(onFieldSave).toHaveBeenCalledWith('servings', '6'));
  });
});
