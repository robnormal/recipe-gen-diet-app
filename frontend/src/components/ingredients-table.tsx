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
  quickSaveStateById: Record<number, { isSaving: boolean; error: string | null }>;
  getIngredientQuantity: (ingredient: IngredientWithFood) => string;
  getIngredientUnit: (ingredient: IngredientWithFood) => string;
  onViewFoodDetails?: (foodId: number) => void;
  onStartEditIngredient: (ingredient: IngredientWithFood) => void;
  onCancelEditIngredient: () => void;
  onUpdateIngredient: () => void;
  onDeleteIngredient: (ingredientId: number) => Promise<void>;
  onQuickAmountSave: (ingredient: IngredientWithFood, draft: string) => Promise<void>;
  onClearQuickAmountError: (ingredientId: number) => void;
  onAddIngredientClick?: () => void;
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
  quickSaveStateById,
  getIngredientQuantity,
  getIngredientUnit,
  onViewFoodDetails,
  onStartEditIngredient,
  onCancelEditIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  onQuickAmountSave,
  onClearQuickAmountError,
  onAddIngredientClick,
}: IngredientsTableProps) {
  if (isLoadingIngredients) {
    return <p className="loading-message">Loading ingredients...</p>;
  }

  if (ingredientError) {
    return <p className="error-message">{ingredientError}</p>;
  }

  if (ingredients.length === 0) {
    return (
      <div className="no-results ingredient-empty-state">
        <p>No ingredients yet.</p>
        <button type="button" className="add-ingredient-cta-button" onClick={onAddIngredientClick}>
          Add your first ingredient
        </button>
      </div>
    );
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
            isQuickSaving={quickSaveStateById[ingredient.id]?.isSaving ?? false}
            quickSaveError={quickSaveStateById[ingredient.id]?.error ?? null}
            getIngredientQuantity={getIngredientQuantity}
            getIngredientUnit={getIngredientUnit}
            onViewFoodDetails={onViewFoodDetails}
            onStartEditIngredient={onStartEditIngredient}
            onCancelEditIngredient={onCancelEditIngredient}
            onUpdateIngredient={onUpdateIngredient}
            onDeleteIngredient={onDeleteIngredient}
            onQuickAmountSave={onQuickAmountSave}
            onClearQuickAmountError={onClearQuickAmountError}
          />
        ))}
      </tbody>
      <tfoot>
        <tr className="add-ingredient-cta-row">
          <td colSpan={5}>
            <button type="button" className="add-ingredient-cta-button" onClick={onAddIngredientClick}>
              + Add ingredient
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
