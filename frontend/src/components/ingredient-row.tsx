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
  localAmountValue: string;
  setLocalAmountValue: (value: string) => void;
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
  onAmountBlur: () => void;
  onAmountKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function IngredientRow({
  ingredient,
  isEditing,
  localAmountValue,
  setLocalAmountValue,
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
  onAmountBlur,
  onAmountKeyDown,
}: IngredientRowProps) {
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
        {isEditing ? (
          <input
            type="number"
            step="0.1"
            min="0"
            value={localAmountValue}
            onChange={(e) => setLocalAmountValue(e.target.value)}
            onBlur={onAmountBlur}
            onKeyDown={onAmountKeyDown}
            className="form-input inline-input"
            placeholder="0"
            required
          />
        ) : (
          getIngredientQuantity(ingredient)
        )}
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
              disabled={
                isSavingIngredient ||
                !editSelectedMeasurementType ||
                (editSelectedMeasurementType === 'grams' && !editIngredientData.gram_weight) ||
                (editSelectedMeasurementType === 'portion' &&
                  (!editSelectedPortionId || !editIngredientData.quantity))
              }
              className="edit-button"
              type="button"
            >
              {isSavingIngredient ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onCancelEditIngredient} className="cancel-button" type="button">
              Cancel
            </button>
            {(ingredientUpdateError || editPortionsError) && (
              <span className="error-text">{ingredientUpdateError || editPortionsError}</span>
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
                if (!window.confirm('Are you sure you want to delete this ingredient?')) {
                  return;
                }
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
