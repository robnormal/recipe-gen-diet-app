import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IngredientRow } from './ingredient-row';
import { IngredientFormState, IngredientWithFood, MeasurementType } from '../types';

const ingredient: IngredientWithFood = {
  id: 1,
  recipe_id: 1,
  food_id: 10,
  food_portion_id: null,
  quantity: null,
  gram_weight: 100,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  food_description: 'Carrots',
  calorie_density: 0.4,
  portion_amount: null,
  portion_modifier: null,
  portion_gram_weight: null,
};

const editIngredientData: IngredientFormState = {
  food_id: ingredient.food_id,
  food_description: ingredient.food_description,
  gram_weight: '100',
  quantity: '',
};

function renderIngredientRow(overrides: Partial<Parameters<typeof IngredientRow>[0]> = {}) {
  const props = {
    ingredient,
    isEditing: false,
    editIngredientData,
    setEditIngredientData: vi.fn(),
    editSelectedMeasurementType: 'grams' as MeasurementType,
    setEditSelectedMeasurementType: vi.fn(),
    editSelectedPortionId: null,
    setEditSelectedPortionId: vi.fn(),
    editAvailablePortions: [],
    isLoadingEditPortions: false,
    editPortionsError: null,
    isSavingIngredient: false,
    ingredientUpdateError: null,
    isQuickSaving: false,
    quickSaveError: null,
    getIngredientQuantity: (row: IngredientWithFood) => row.gram_weight.toString(),
    getIngredientUnit: () => 'g',
    onStartEditIngredient: vi.fn(),
    onCancelEditIngredient: vi.fn(),
    onUpdateIngredient: vi.fn(),
    onDeleteIngredient: vi.fn(async () => undefined),
    onQuickAmountSave: vi.fn(async () => undefined),
    onClearQuickAmountError: vi.fn(),
    ...overrides,
  };

  render(
    <table>
      <tbody>
        <IngredientRow {...props} />
      </tbody>
    </table>
  );

  return props;
}

describe('IngredientRow', () => {
  it('saves direct amount edits on blur', async () => {
    const user = userEvent.setup();
    const onQuickAmountSave = vi.fn(async () => undefined);

    renderIngredientRow({ onQuickAmountSave });

    const amountInput = screen.getByRole('spinbutton', { name: /amount for carrots/i });
    await user.clear(amountInput);
    await user.type(amountInput, '125');
    await user.tab();

    await waitFor(() => expect(onQuickAmountSave).toHaveBeenCalledWith(ingredient, '125'));
  });

  it('explains why edit-mode save is disabled', () => {
    renderIngredientRow({
      isEditing: true,
      editIngredientData: { ...editIngredientData, gram_weight: '' },
    });

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    expect(screen.getByText('Enter a quantity')).toBeInTheDocument();
  });

  it('deletes without a browser confirm dialog', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');
    const onDeleteIngredient = vi.fn(async () => undefined);

    renderIngredientRow({ onDeleteIngredient });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onDeleteIngredient).toHaveBeenCalledWith(ingredient.id);
    confirmSpy.mockRestore();
  });
});
