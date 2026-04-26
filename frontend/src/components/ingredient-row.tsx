import { useEffect, useRef, useState } from 'react';
import {
  FoodPortion,
  IngredientFormState,
  IngredientWithFood,
  MeasurementType,
} from '../types';
import { MeasurementTypeSelector } from './measurement-type-selector';

interface IngredientRowProps {
  ingredient: IngredientWithFood;
  isEditing: boolean;
  editIngredientData: IngredientFormState;
  setEditIngredientData: (data: IngredientFormState) => void;
  editSelectedMeasurementType: MeasurementType;
  setEditSelectedMeasurementType: (type: MeasurementType) => void;
  editSelectedPortionId: number | null;
  setEditSelectedPortionId: (id: number | null) => void;
  editAvailablePortions: FoodPortion[];
  isLoadingEditPortions: boolean;
  editPortionsError: string | null;
  isSavingIngredient: boolean;
  ingredientUpdateError: string | null;
  isQuickSaving: boolean;
  quickSaveError: string | null;
  getIngredientQuantity: (ingredient: IngredientWithFood) => string;
  getIngredientUnit: (ingredient: IngredientWithFood) => string;
  onViewFoodDetails?: (foodId: number) => void;
  onStartEditIngredient: (ingredient: IngredientWithFood) => void;
  onCancelEditIngredient: () => void;
  onUpdateIngredient: () => void;
  onDeleteIngredient: (ingredientId: number) => Promise<void>;
  onQuickAmountSave: (ingredient: IngredientWithFood, draft: string) => Promise<void>;
  onClearQuickAmountError: (ingredientId: number) => void;
}

export function IngredientRow({
  ingredient,
  isEditing,
  editIngredientData,
  setEditIngredientData,
  editSelectedMeasurementType,
  setEditSelectedMeasurementType,
  editSelectedPortionId,
  setEditSelectedPortionId,
  editAvailablePortions,
  isLoadingEditPortions,
  editPortionsError,
  isSavingIngredient,
  ingredientUpdateError,
  isQuickSaving,
  quickSaveError,
  getIngredientQuantity,
  getIngredientUnit,
  onViewFoodDetails,
  onStartEditIngredient,
  onCancelEditIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  onQuickAmountSave,
  onClearQuickAmountError,
}: IngredientRowProps) {
  const savedAmount = getIngredientQuantity(ingredient);
  const editingAmount = editSelectedMeasurementType === 'grams'
    ? editIngredientData.gram_weight
    : editIngredientData.quantity || '';
  const [amountDraft, setAmountDraft] = useState(isEditing ? editingAmount : savedAmount);
  const [localAmountError, setLocalAmountError] = useState<string | null>(null);
  const inputFocusedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);
  const saveTokenRef = useRef(0);

  useEffect(() => {
    if (isEditing || !inputFocusedRef.current) {
      setAmountDraft(isEditing ? editingAmount : savedAmount);
    }
  }, [editingAmount, isEditing, savedAmount]);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const updateEditAmount = (value: string) => {
    if (editSelectedMeasurementType === 'grams') {
      setEditIngredientData({ ...editIngredientData, gram_weight: value });
    } else {
      setEditIngredientData({ ...editIngredientData, quantity: value });
    }
  };

  const commitQuickAmount = async (value: string, shouldShowValidation = true) => {
    if (isEditing) {
      return;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      if (shouldShowValidation) {
        setLocalAmountError('Enter a quantity');
      }
      return;
    }

    const numericValue = Number.parseFloat(trimmedValue);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      if (shouldShowValidation) {
        setLocalAmountError('Quantity must be greater than 0');
      }
      return;
    }

    const savedNumericValue = Number.parseFloat(savedAmount);
    if (Number.isFinite(savedNumericValue) && numericValue === savedNumericValue) {
      setLocalAmountError(null);
      return;
    }

    const saveToken = saveTokenRef.current + 1;
    saveTokenRef.current = saveToken;

    try {
      await onQuickAmountSave(ingredient, trimmedValue);
      if (saveTokenRef.current === saveToken) {
        setLocalAmountError(null);
      }
    } catch (err) {
      if (saveTokenRef.current === saveToken) {
        setLocalAmountError(err instanceof Error ? err.message : 'Failed to update amount');
      }
    }
  };

  const scheduleQuickSave = (value: string) => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setLocalAmountError(null);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      void commitQuickAmount(value, false);
    }, 600);
  };

  const handleAmountChange = (value: string) => {
    setAmountDraft(value);
    setLocalAmountError(null);

    if (isEditing) {
      updateEditAmount(value);
      return;
    }

    onClearQuickAmountError(ingredient.id);
    scheduleQuickSave(value);
  };

  const handleAmountBlur = () => {
    inputFocusedRef.current = false;
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (isEditing) {
      updateEditAmount(amountDraft);
      return;
    }

    void commitQuickAmount(amountDraft);
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
      return;
    }

    if (e.key === 'Escape') {
      setAmountDraft(isEditing ? editingAmount : savedAmount);
      setLocalAmountError(null);
      e.currentTarget.blur();
    }
  };

  const getSaveBlocker = () => {
    if (!editSelectedMeasurementType) {
      return 'Choose a measurement type';
    }

    if (editSelectedMeasurementType === 'grams') {
      const grams = Number.parseFloat(editIngredientData.gram_weight);
      if (!editIngredientData.gram_weight) {
        return 'Enter a quantity';
      }
      if (!Number.isFinite(grams) || grams <= 0) {
        return 'Quantity must be greater than 0';
      }
    }

    if (editSelectedMeasurementType === 'portion') {
      const quantity = Number.parseFloat(editIngredientData.quantity);
      if (!editSelectedPortionId) {
        return 'Pick a portion';
      }
      if (!editIngredientData.quantity) {
        return 'Enter a quantity';
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return 'Quantity must be greater than 0';
      }
    }

    return null;
  };

  const saveBlocker = getSaveBlocker();
  const amountError = localAmountError || quickSaveError;

  return (
    <tr className={isEditing ? 'editing-row' : ''}>
      <td>
        {onViewFoodDetails ? (
          <a
            href={`/foods/${ingredient.food_id}`}
            onClick={(e) => {
              e.preventDefault();
              onViewFoodDetails(ingredient.food_id);
            }}
            className="food-name-link"
          >
            {ingredient.food_description}
          </a>
        ) : (
          ingredient.food_description
        )}
      </td>
      <td>
        <div className="quantity-input-wrap">
          <input
            type="number"
            step="0.1"
            value={amountDraft}
            onFocus={() => {
              inputFocusedRef.current = true;
            }}
            onChange={(e) => handleAmountChange(e.target.value)}
            onBlur={handleAmountBlur}
            onKeyDown={handleAmountKeyDown}
            className={`form-input inline-input quantity-input${isQuickSaving ? ' quantity-input--saving' : ''}`}
            aria-label={`Amount for ${ingredient.food_description}`}
            aria-invalid={Boolean(amountError)}
            placeholder="0"
          />
          {isQuickSaving && <span className="quantity-save-status">Saving...</span>}
          {!isEditing && amountError && <span className="error-text quantity-error">{amountError}</span>}
        </div>
      </td>
      <td>
        {isEditing ? (
          <>
            {isLoadingEditPortions ? (
              <span>Loading...</span>
            ) : (
              <MeasurementTypeSelector
                measurementType={editSelectedMeasurementType}
                setMeasurementType={setEditSelectedMeasurementType}
                portionId={editSelectedPortionId}
                setPortionId={setEditSelectedPortionId}
                portions={editAvailablePortions}
                isLoadingPortions={isLoadingEditPortions}
                ingredientData={editIngredientData}
                setIngredientData={setEditIngredientData}
                isEdit={true}
              />
            )}
          </>
        ) : (
          getIngredientUnit(ingredient)
        )}
      </td>
      <td>{ingredient.calorie_density ? `${ingredient.calorie_density.toFixed(1)} kcal/g` : 'N/A'}</td>
      <td>
        {isEditing ? (
          <div className="ingredient-actions">
            <button
              onClick={onUpdateIngredient}
              disabled={isSavingIngredient || Boolean(saveBlocker)}
              className="edit-button"
              type="button"
              aria-describedby={saveBlocker ? `ingredient-save-hint-${ingredient.id}` : undefined}
            >
              {isSavingIngredient ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onCancelEditIngredient} className="cancel-button" type="button">
              Cancel
            </button>
            {(ingredientUpdateError || editPortionsError) && (
              <span className="error-text">{ingredientUpdateError || editPortionsError}</span>
            )}
            {saveBlocker && (
              <span id={`ingredient-save-hint-${ingredient.id}`} className="save-blocker-hint">
                {saveBlocker}
              </span>
            )}
          </div>
        ) : (
          <div className="ingredient-actions">
            <button
              onClick={() => onStartEditIngredient(ingredient)}
              className="edit-button"
              type="button"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                await onDeleteIngredient(ingredient.id);
              }}
              className="delete-button"
              type="button"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
