import { FoodPortion, IngredientFormState, MeasurementType } from '../types';
import { Dispatch, SetStateAction } from 'react';
import { MeasurementTypeSelector } from './measurement-type-selector';

interface NewIngredientFormProps {
  newIngredient: IngredientFormState;
  setNewIngredient: Dispatch<SetStateAction<IngredientFormState>>;
  onAddIngredient: (e: React.FormEvent<HTMLFormElement>) => void;
  isCreatingIngredient: boolean;
  ingredientCreateError: string | null;
  setIngredientCreateError: Dispatch<SetStateAction<string | null>>;
  availablePortions: FoodPortion[];
  isLoadingPortions: boolean;
  portionsError: string | null;
  selectedMeasurementType: MeasurementType;
  setSelectedMeasurementType: Dispatch<SetStateAction<MeasurementType>>;
  selectedPortionId: number | null;
  setSelectedPortionId: Dispatch<SetStateAction<number | null>>;
  resetNewIngredientForm: () => void;
}

export function NewIngredientForm({
  newIngredient,
  setNewIngredient,
  onAddIngredient,
  isCreatingIngredient,
  ingredientCreateError,
  setIngredientCreateError,
  availablePortions,
  isLoadingPortions,
  portionsError,
  selectedMeasurementType,
  setSelectedMeasurementType,
  selectedPortionId,
  setSelectedPortionId,
  resetNewIngredientForm,
}: NewIngredientFormProps) {
  return (
    <div className="new-ingredient-form">
      <div className="selected-food">
        <strong>Selected Food:</strong> {newIngredient.food_description}
        <button onClick={resetNewIngredientForm} className="change-food-button" type="button">
          Change
        </button>
      </div>

      <form onSubmit={onAddIngredient} className="ingredient-form">
        {isLoadingPortions && <p className="loading-message">Loading measurement options...</p>}
        <div className="form-group">
          <label htmlFor="ingredient-measurement-type">Measurement Type:</label>
          <MeasurementTypeSelector
            id="ingredient-measurement-type"
            measurementType={selectedMeasurementType}
            setMeasurementType={setSelectedMeasurementType}
            portionId={selectedPortionId}
            setPortionId={setSelectedPortionId}
            portions={availablePortions}
            isLoadingPortions={isLoadingPortions}
            ingredientData={newIngredient}
            setIngredientData={setNewIngredient}
            isEdit={false}
          />
        </div>

        {selectedMeasurementType === 'grams' && (
          <div className="form-group">
            <label htmlFor="ingredient-gram-weight">Gram Weight (required):</label>
            <input
              id="ingredient-gram-weight"
              type="number"
              step="0.1"
              min="0"
              value={newIngredient.gram_weight}
              onChange={(e) => setNewIngredient({ ...newIngredient, gram_weight: e.target.value })}
              className="form-input"
              placeholder="Enter weight in grams"
              required
            />
          </div>
        )}

        {selectedMeasurementType === 'portion' && selectedPortionId && (() => {
          const selectedPortion = availablePortions.find((p) => p.id === selectedPortionId);
          return selectedPortion ? (
            <div className="form-group">
              <label htmlFor="ingredient-quantity">Quantity (required):</label>
              <input
                id="ingredient-quantity"
                type="number"
                step="0.1"
                min="0"
                value={newIngredient.quantity || selectedPortion.amount.toString()}
                onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                className="form-input"
                placeholder={`Enter quantity (base: ${selectedPortion.amount}${
                  selectedPortion.modifier ? ' ' + selectedPortion.modifier : ''
                })`}
                required
              />
            </div>
          ) : null;
        })()}

        {portionsError && <p className="error-message">{portionsError}</p>}
        {ingredientCreateError && <p className="error-message">{ingredientCreateError}</p>}

        <div className="form-actions">
          <button
            type="submit"
            disabled={
              isCreatingIngredient ||
              !selectedMeasurementType ||
              (selectedMeasurementType === 'grams' && !newIngredient.gram_weight) ||
              (selectedMeasurementType === 'portion' && (!selectedPortionId || !newIngredient.quantity))
            }
            className="submit-button"
          >
            {isCreatingIngredient ? 'Adding...' : 'Add Ingredient'}
          </button>
          <button
            type="button"
            onClick={() => {
              resetNewIngredientForm();
              setIngredientCreateError(null);
            }}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
