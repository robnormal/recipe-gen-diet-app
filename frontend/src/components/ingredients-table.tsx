import { useState, useEffect } from 'react';
import {
  FoodPortion,
  IngredientFormState,
  IngredientWithFood,
  MeasurementType,
} from '../types';
import { IngredientRow } from './ingredient-row';

interface IngredientsTableProps {
  ingredients: IngredientWithFood[];
  isLoadingIngredients: boolean;
  ingredientError: string | null;
  editingIngredientId: number | null;
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
  getIngredientQuantity: (ingredient: IngredientWithFood) => string;
  getIngredientUnit: (ingredient: IngredientWithFood) => string;
  onViewFoodDetails?: (foodId: number) => void;
  onStartEditIngredient: (ingredient: IngredientWithFood) => void;
  onCancelEditIngredient: () => void;
  onUpdateIngredient: () => void;
  onDeleteIngredient: (ingredientId: number) => Promise<void>;
}

export function IngredientsTable({
  ingredients,
  isLoadingIngredients,
  ingredientError,
  editingIngredientId,
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
  getIngredientQuantity,
  getIngredientUnit,
  onViewFoodDetails,
  onStartEditIngredient,
  onCancelEditIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
}: IngredientsTableProps) {
  // Local state for ingredient amount input to allow normal editing
  const [localAmountValue, setLocalAmountValue] = useState<string>('');

  // Sync local input value when editing starts or measurement type changes
  useEffect(() => {
    if (editingIngredientId !== null) {
      const value = editSelectedMeasurementType === 'grams'
        ? editIngredientData.gram_weight
        : editIngredientData.quantity || '';
      setLocalAmountValue(value);
    } else {
      setLocalAmountValue('');
    }
  }, [editingIngredientId, editSelectedMeasurementType, editIngredientData.gram_weight, editIngredientData.quantity]);

  // Update parent state from local input value
  const updateParentState = () => {
    if (editSelectedMeasurementType === 'grams') {
      setEditIngredientData({ ...editIngredientData, gram_weight: localAmountValue });
    } else {
      setEditIngredientData({ ...editIngredientData, quantity: localAmountValue });
    }
  };

  // Handle blur - update parent state
  const handleAmountBlur = () => {
    updateParentState();
  };

  // Handle Enter key - update parent state
  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateParentState();
      e.currentTarget.blur();
    }
  };

  if (isLoadingIngredients) {
    return <p className="loading-message">Loading ingredients...</p>;
  }

  if (ingredientError) {
    return <p className="error-message">{ingredientError}</p>;
  }

  if (ingredients.length === 0) {
    return <p className="no-results">No ingredients yet. Add ingredients below.</p>;
  }

  return (
    <table className="ingredients-table">
      <thead>
        <tr>
          <th>Food Name</th>
          <th>Quantity</th>
          <th>Unit</th>
          <th>Calorie Density</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {ingredients.map((ingredient) => (
          <IngredientRow
            key={ingredient.id}
            ingredient={ingredient}
            isEditing={editingIngredientId === ingredient.id}
            localAmountValue={localAmountValue}
            setLocalAmountValue={setLocalAmountValue}
            editIngredientData={editIngredientData}
            setEditIngredientData={setEditIngredientData}
            editSelectedMeasurementType={editSelectedMeasurementType}
            setEditSelectedMeasurementType={setEditSelectedMeasurementType}
            editSelectedPortionId={editSelectedPortionId}
            setEditSelectedPortionId={setEditSelectedPortionId}
            editAvailablePortions={editAvailablePortions}
            isLoadingEditPortions={isLoadingEditPortions}
            editPortionsError={editPortionsError}
            isSavingIngredient={isSavingIngredient}
            ingredientUpdateError={ingredientUpdateError}
            getIngredientQuantity={getIngredientQuantity}
            getIngredientUnit={getIngredientUnit}
            onViewFoodDetails={onViewFoodDetails}
            onStartEditIngredient={onStartEditIngredient}
            onCancelEditIngredient={onCancelEditIngredient}
            onUpdateIngredient={onUpdateIngredient}
            onDeleteIngredient={onDeleteIngredient}
            onAmountBlur={handleAmountBlur}
            onAmountKeyDown={handleAmountKeyDown}
          />
        ))}
      </tbody>
    </table>
  );
}
