import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import {
  FoodCategory,
  FoodPortion,
  FoodResult,
  IngredientFormState,
  IngredientWithFood,
  MeasurementType,
  Recipe,
  RecipeFormData,
} from '../types';

interface RecipeDetailState {
  selectedRecipe: Recipe | null;
  isLoadingRecipe: boolean;
  recipeUpdateError: string | null;
  recipeUpdateSuccess: string | null;
  isUpdatingRecipe: boolean;
  ingredients: IngredientWithFood[];
  isLoadingIngredients: boolean;
  ingredientError: string | null;
  ingredientSearchQuery: string;
  ingredientSearchResults: FoodResult[];
  isSearchingIngredient: boolean;
  ingredientSearchError: string | null;
  newIngredient: IngredientFormState;
  isCreatingIngredient: boolean;
  ingredientCreateError: string | null;
  recipeFormData: RecipeFormData;
  availablePortions: FoodPortion[];
  isLoadingPortions: boolean;
  portionsError: string | null;
  selectedMeasurementType: MeasurementType;
  selectedPortionId: number | null;
  editAvailablePortions: FoodPortion[];
  isLoadingEditPortions: boolean;
  editPortionsError: string | null;
  editSelectedMeasurementType: MeasurementType;
  editSelectedPortionId: number | null;
  editingIngredientId: number | null;
  editIngredientData: IngredientFormState;
  isUpdatingIngredient: boolean;
  ingredientUpdateError: string | null;
  foodCategories: FoodCategory[];
  isLoadingCategories: boolean;
  categoriesError: string | null;
  selectedCategories: number[];
}

interface RecipeDetailActions {
  onBack: () => void;
  onUpdateRecipe: (e: React.FormEvent<HTMLFormElement>) => void;
  onIngredientSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  onSelectFoodForIngredient: (food: FoodResult) => void;
  onViewFoodDetails?: (foodId: number) => void;
  onAddIngredient: (e: React.FormEvent<HTMLFormElement>) => void;
  onStartEditIngredient: (ingredient: IngredientWithFood) => void;
  onCancelEditIngredient: () => void;
  onUpdateIngredient: () => void;
  onDeleteIngredient: (ingredientId: number) => Promise<void>;
  setIngredientSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedCategories: Dispatch<SetStateAction<number[]>>;
  setNewIngredient: Dispatch<SetStateAction<IngredientFormState>>;
  setSelectedMeasurementType: Dispatch<SetStateAction<MeasurementType>>;
  setSelectedPortionId: Dispatch<SetStateAction<number | null>>;
  resetNewIngredientForm: () => void;
  setEditIngredientData: Dispatch<SetStateAction<IngredientFormState>>;
  setEditSelectedMeasurementType: Dispatch<SetStateAction<MeasurementType>>;
  setEditSelectedPortionId: Dispatch<SetStateAction<number | null>>;
  setIngredientCreateError: Dispatch<SetStateAction<string | null>>;
  setRecipeFormData: Dispatch<SetStateAction<RecipeFormData>>;
}

interface RecipeDetailHelpers {
  getIngredientQuantity: (ingredient: IngredientWithFood) => string;
  getIngredientUnit: (ingredient: IngredientWithFood) => string;
}

interface RecipeDetailViewProps {
  state: RecipeDetailState;
  actions: RecipeDetailActions;
  helpers: RecipeDetailHelpers;
}

export function RecipeDetailView({ state, actions, helpers }: RecipeDetailViewProps) {
  // Local state for ingredient amount input to allow normal editing
  const [localAmountValue, setLocalAmountValue] = useState<string>('');

  const {
    selectedRecipe,
    isLoadingRecipe,
    recipeUpdateError,
    recipeUpdateSuccess,
    isUpdatingRecipe,
    ingredients,
    isLoadingIngredients,
    ingredientError,
    ingredientSearchQuery,
    ingredientSearchResults,
    isSearchingIngredient,
    ingredientSearchError,
    newIngredient,
    isCreatingIngredient,
    ingredientCreateError,
    recipeFormData,
    availablePortions,
    isLoadingPortions,
    portionsError,
    selectedMeasurementType,
    selectedPortionId,
    editAvailablePortions,
    isLoadingEditPortions,
    editPortionsError,
    editSelectedMeasurementType,
    editSelectedPortionId,
    editingIngredientId,
    editIngredientData,
    isUpdatingIngredient: isSavingIngredient,
    ingredientUpdateError,
    foodCategories,
    isLoadingCategories,
    categoriesError,
    selectedCategories,
  } = state;

  const {
    onBack,
    onUpdateRecipe,
    onIngredientSearch,
    onSelectFoodForIngredient,
    onViewFoodDetails,
    onAddIngredient,
    onStartEditIngredient,
    onCancelEditIngredient,
    onUpdateIngredient,
    onDeleteIngredient,
    setIngredientSearchQuery,
    setSelectedCategories,
    setNewIngredient,
    setSelectedMeasurementType,
    setSelectedPortionId,
    resetNewIngredientForm,
    setEditIngredientData,
    setEditSelectedMeasurementType,
    setEditSelectedPortionId,
    setIngredientCreateError,
    setRecipeFormData,
  } = actions;

  const { getIngredientQuantity, getIngredientUnit } = helpers;

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

  if (!selectedRecipe) {
    return null;
  }

  return (
    <div className="recipe-detail-container">
      <div className="recipe-detail-header">
        <h2>{selectedRecipe.name}</h2>
        <button onClick={onBack} className="back-button">
          Back to Recipes
        </button>
      </div>
      {selectedRecipe.calorie_density !== null && selectedRecipe.calorie_density !== undefined && (
        <div className="recipe-calorie-density">
          <strong>Calorie Density:</strong> {selectedRecipe.calorie_density.toFixed(1)} kcal/g
        </div>
      )}

      {isLoadingRecipe ? (
        <p className="loading-message">Loading recipe details...</p>
      ) : (
        <>
          <div className="ingredients-section">
            <h3>Ingredients</h3>
            {isLoadingIngredients ? (
              <p className="loading-message">Loading ingredients...</p>
            ) : ingredientError ? (
              <p className="error-message">{ingredientError}</p>
            ) : ingredients.length === 0 ? (
              <p className="no-results">No ingredients yet. Add ingredients below.</p>
            ) : (
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
                    <tr key={ingredient.id} className={editingIngredientId === ingredient.id ? 'editing-row' : ''}>
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
                        {editingIngredientId === ingredient.id ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={localAmountValue}
                            onChange={(e) => setLocalAmountValue(e.target.value)}
                            onBlur={handleAmountBlur}
                            onKeyDown={handleAmountKeyDown}
                            className="form-input inline-input"
                            placeholder="0"
                            required
                          />
                        ) : (
                          getIngredientQuantity(ingredient)
                        )}
                      </td>
                      <td>
                        {editingIngredientId === ingredient.id ? (
                          <>
                            {isLoadingEditPortions ? (
                              <span>Loading...</span>
                            ) : (
                              <select
                                value={
                                  editSelectedMeasurementType === 'grams'
                                    ? 'grams'
                                    : editSelectedPortionId
                                    ? `portion-${editSelectedPortionId}`
                                    : ''
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === 'grams') {
                                    // Converting from portion to grams
                                    if (editSelectedMeasurementType === 'portion' && editSelectedPortionId) {
                                      const previousPortion = editAvailablePortions.find((p) => p.id === editSelectedPortionId);
                                      if (previousPortion && editIngredientData.quantity) {
                                        const quantity = parseFloat(editIngredientData.quantity);
                                        if (!isNaN(quantity) && quantity > 0) {
                                          // Calculate gram weight: (quantity / portion.amount) * portion.gram_weight
                                          const gramWeight = (quantity / previousPortion.amount) * previousPortion.gram_weight;
                                          setEditIngredientData({
                                            ...editIngredientData,
                                            gram_weight: gramWeight.toString(),
                                            quantity: '',
                                          });
                                        } else {
                                          setEditIngredientData({ ...editIngredientData, quantity: '' });
                                        }
                                      } else {
                                        setEditIngredientData({ ...editIngredientData, quantity: '' });
                                      }
                                    } else {
                                      // No previous value to convert, just clear quantity
                                      setEditIngredientData({ ...editIngredientData, quantity: '' });
                                    }
                                    setEditSelectedMeasurementType('grams');
                                    setEditSelectedPortionId(null);
                                  } else if (value.startsWith('portion-')) {
                                    const portionId = parseInt(value.replace('portion-', ''), 10);
                                    const newPortion = editAvailablePortions.find((p) => p.id === portionId);
                                    
                                    if (newPortion) {
                                      let newQuantity: string;
                                      
                                      if (editSelectedMeasurementType === 'grams' && editIngredientData.gram_weight) {
                                        // Converting from grams to portion
                                        const gramWeight = parseFloat(editIngredientData.gram_weight);
                                        if (!isNaN(gramWeight) && gramWeight > 0) {
                                          // Calculate quantity: (gram_weight / portion.gram_weight) * portion.amount
                                          const quantity = (gramWeight / newPortion.gram_weight) * newPortion.amount;
                                          newQuantity = quantity.toString();
                                        } else {
                                          newQuantity = newPortion.amount.toString();
                                        }
                                      } else if (editSelectedMeasurementType === 'portion' && editSelectedPortionId && editIngredientData.quantity) {
                                        // Converting from one portion to another
                                        const previousPortion = editAvailablePortions.find((p) => p.id === editSelectedPortionId);
                                        if (previousPortion) {
                                          const oldQuantity = parseFloat(editIngredientData.quantity);
                                          if (!isNaN(oldQuantity) && oldQuantity > 0) {
                                            // Convert to grams first, then to new portion
                                            const gramWeight = (oldQuantity / previousPortion.amount) * previousPortion.gram_weight;
                                            const quantity = (gramWeight / newPortion.gram_weight) * newPortion.amount;
                                            newQuantity = quantity.toString();
                                          } else {
                                            newQuantity = newPortion.amount.toString();
                                          }
                                        } else {
                                          newQuantity = newPortion.amount.toString();
                                        }
                                      } else {
                                        // No previous value, use base portion amount
                                        newQuantity = editIngredientData.quantity || newPortion.amount.toString();
                                      }
                                      
                                      setEditIngredientData({
                                        ...editIngredientData,
                                        quantity: newQuantity,
                                        gram_weight: '',
                                      });
                                      setEditSelectedMeasurementType('portion');
                                      setEditSelectedPortionId(portionId);
                                    }
                                  } else {
                                    setEditSelectedMeasurementType(null);
                                    setEditSelectedPortionId(null);
                                  }
                                }}
                                className="form-input inline-select"
                                required
                                disabled={isLoadingEditPortions}
                              >
                                <option value="">Select...</option>
                                <option value="grams">g</option>
                                {editAvailablePortions.map((portion) => {
                                  const modifier = portion.modifier ? ` ${portion.modifier}` : '';
                                  const portionLabel = `${portion.amount}${modifier ? ' ' + modifier : ''} (${Math.round(portion.gram_weight)}g)`;
                                  return (
                                    <option key={portion.id} value={`portion-${portion.id}`}>
                                      {portionLabel}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </>
                        ) : (
                          getIngredientUnit(ingredient)
                        )}
                      </td>
                      <td>{ingredient.calorie_density ? `${ingredient.calorie_density.toFixed(1)} kcal/g` : 'N/A'}</td>
                      <td>
                        {editingIngredientId === ingredient.id ? (
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
                  ))}
                </tbody>
              </table>
            )}

            <div className="add-ingredient-section">
              <h4>Add Ingredient</h4>

              {!newIngredient.food_id ? (
                <div className="ingredient-search-container">
                  <div className="category-filter-container">
                    <label className="category-filter-label">
                      Filter by Category:
                    </label>
                    {isLoadingCategories ? (
                      <p className="loading-message">Loading categories...</p>
                    ) : categoriesError ? (
                      <p className="error-message">{categoriesError}</p>
                    ) : foodCategories.length > 0 ? (
                      <div className="category-selector">
                        <div className="category-select-all-buttons">
                          <button
                            type="button"
                            onClick={() => setSelectedCategories(foodCategories.map((cat) => cat.id))}
                            className="select-all-button"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCategories([])}
                            className="deselect-all-button"
                          >
                            Deselect All
                          </button>
                        </div>
                        <div className="category-checkbox-list">
                          {foodCategories.map((category) => (
                            <div key={category.id} className="category-checkbox-item">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.includes(category.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCategories([...selectedCategories, category.id]);
                                    } else {
                                      setSelectedCategories(selectedCategories.filter((id) => id !== category.id));
                                    }
                                  }}
                                  className="category-checkbox"
                                />
                                <span>
                                  {category.emoji && <span className="category-emoji">{category.emoji}</span>}
                                  {category.description}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <form onSubmit={onIngredientSearch} className="search-form">
                    <input
                      type="text"
                      value={ingredientSearchQuery}
                      onChange={(e) => setIngredientSearchQuery(e.target.value)}
                      placeholder="Search for foods to add as ingredient..."
                      className="search-input"
                    />
                    <button type="submit" disabled={isSearchingIngredient} className="search-button">
                      {isSearchingIngredient ? 'Searching...' : 'Search'}
                    </button>
                  </form>

                  {ingredientSearchError && <p className="error-message">{ingredientSearchError}</p>}

                  {ingredientSearchResults.length > 0 && (
                    <div className="ingredient-search-results">
                      <ul className="food-results">
                        {ingredientSearchResults.map((food, index) => (
                          <li key={index} className="food-item">
                            <div className="food-details" onClick={() => onSelectFoodForIngredient(food)}>
                              <span className="food-description">{food.description}</span>
                              <span className="calorie-density">{food.calorie_density?.toFixed(1) || 'N/A'}</span>
                            </div>
                            {onViewFoodDetails && (
                              <a
                                href={`/foods/${food.id}`}
                                className="view-food-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  onViewFoodDetails(food.id);
                                }}
                                title="View food details"
                              >
                                View
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
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
                      <select
                        id="ingredient-measurement-type"
                        value={
                          selectedMeasurementType === 'grams'
                            ? 'grams'
                            : selectedPortionId
                            ? `portion-${selectedPortionId}`
                            : ''
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === 'grams') {
                            // Converting from portion to grams
                            if (selectedMeasurementType === 'portion' && selectedPortionId) {
                              const previousPortion = availablePortions.find((p) => p.id === selectedPortionId);
                              if (previousPortion && newIngredient.quantity) {
                                const quantity = parseFloat(newIngredient.quantity);
                                if (!isNaN(quantity) && quantity > 0) {
                                  // Calculate gram weight: (quantity / portion.amount) * portion.gram_weight
                                  const gramWeight = (quantity / previousPortion.amount) * previousPortion.gram_weight;
                                  setNewIngredient({
                                    ...newIngredient,
                                    gram_weight: gramWeight.toString(),
                                    quantity: '',
                                  });
                                } else {
                                  setNewIngredient({ ...newIngredient, quantity: '' });
                                }
                              } else {
                                setNewIngredient({ ...newIngredient, quantity: '' });
                              }
                            } else {
                              // No previous value to convert, just clear quantity
                              setNewIngredient({ ...newIngredient, quantity: '' });
                            }
                            setSelectedMeasurementType('grams');
                            setSelectedPortionId(null);
                          } else if (value.startsWith('portion-')) {
                            const portionId = parseInt(value.replace('portion-', ''), 10);
                            const newPortion = availablePortions.find((p) => p.id === portionId);
                            
                            if (newPortion) {
                              let newQuantity: string;
                              
                              if (selectedMeasurementType === 'grams' && newIngredient.gram_weight) {
                                // Converting from grams to portion
                                const gramWeight = parseFloat(newIngredient.gram_weight);
                                if (!isNaN(gramWeight) && gramWeight > 0) {
                                  // Calculate quantity: (gram_weight / portion.gram_weight) * portion.amount
                                  const quantity = (gramWeight / newPortion.gram_weight) * newPortion.amount;
                                  newQuantity = quantity.toString();
                                } else {
                                  newQuantity = newPortion.amount.toString();
                                }
                              } else if (selectedMeasurementType === 'portion' && selectedPortionId && newIngredient.quantity) {
                                // Converting from one portion to another
                                const previousPortion = availablePortions.find((p) => p.id === selectedPortionId);
                                if (previousPortion) {
                                  const oldQuantity = parseFloat(newIngredient.quantity);
                                  if (!isNaN(oldQuantity) && oldQuantity > 0) {
                                    // Convert to grams first, then to new portion
                                    const gramWeight = (oldQuantity / previousPortion.amount) * previousPortion.gram_weight;
                                    const quantity = (gramWeight / newPortion.gram_weight) * newPortion.amount;
                                    newQuantity = quantity.toString();
                                  } else {
                                    newQuantity = newPortion.amount.toString();
                                  }
                                } else {
                                  newQuantity = newPortion.amount.toString();
                                }
                              } else {
                                // No previous value, use base portion amount
                                newQuantity = newPortion.amount.toString();
                              }
                              
                              setNewIngredient({
                                ...newIngredient,
                                quantity: newQuantity,
                                gram_weight: '',
                              });
                              setSelectedMeasurementType('portion');
                              setSelectedPortionId(portionId);
                            }
                          } else {
                            setSelectedMeasurementType(null);
                            setSelectedPortionId(null);
                          }
                        }}
                        className="form-input"
                        required
                        disabled={isLoadingPortions}
                      >
                        <option value="">Select measurement type...</option>
                        <option value="grams">Grams</option>
                        {availablePortions.map((portion) => {
                          const modifier = portion.modifier ? ` ${portion.modifier}` : '';
                          const portionLabel = `${portion.amount}${modifier ? ' ' + modifier : ''} (${Math.round(portion.gram_weight)}g)`;
                          return (
                            <option key={portion.id} value={`portion-${portion.id}`}>
                              {portionLabel}
                            </option>
                          );
                        })}
                      </select>
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
              )}
            </div>
          </div>

          <div className="recipe-detail-form">
            <form onSubmit={onUpdateRecipe} className="recipe-form">
              <div className="form-group">
                <label htmlFor="detail-recipe-name">Recipe Name:</label>
                <input
                  id="detail-recipe-name"
                  type="text"
                  value={recipeFormData.name}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, name: e.target.value })}
                  className="form-input"
                  placeholder="Enter recipe name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="detail-recipe-description">Description:</label>
                <textarea
                  id="detail-recipe-description"
                  value={recipeFormData.description}
                  onChange={(e) => setRecipeFormData({ ...recipeFormData, description: e.target.value })}
                  className="form-input"
                  placeholder="Enter recipe description (optional)"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="detail-recipe-instructions">Instructions:</label>
                <textarea
                  id="detail-recipe-instructions"
                  value={recipeFormData.instructions}
                  onChange={(e) => setRecipeFormData({ ...recipeFormData, instructions: e.target.value })}
                  className="form-input"
                  placeholder="Enter recipe instructions (optional)"
                  rows={6}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="detail-recipe-servings">Servings:</label>
                  <input
                    id="detail-recipe-servings"
                    type="number"
                    min="1"
                    value={recipeFormData.servings}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, servings: e.target.value })}
                    className="form-input"
                    placeholder="Number of servings"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="detail-recipe-time">Total Time (minutes):</label>
                  <input
                    id="detail-recipe-time"
                    type="number"
                    min="1"
                    value={recipeFormData.total_time_minutes}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, total_time_minutes: e.target.value })}
                    className="form-input"
                    placeholder="Total time in minutes"
                  />
                </div>
              </div>

              {recipeUpdateError && <p className="error-message">{recipeUpdateError}</p>}
              {recipeUpdateSuccess && <p className="success-message">{recipeUpdateSuccess}</p>}

              <div className="form-actions">
                <button type="submit" disabled={isUpdatingRecipe} className="submit-button">
                  {isUpdatingRecipe ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {selectedRecipe.nutrients && selectedRecipe.nutrients.length > 0 && (
            <div className="recipe-nutrients-section">
              <h3>Nutrient Totals</h3>
              <table className="nutrients-table">
                <thead>
                  <tr>
                    <th>Nutrient</th>
                    <th>Total Amount</th>
                    <th>% RDA</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecipe.nutrients.map((nutrient) => {
                    const unit = nutrient.unit || '';
                    return (
                      <tr key={nutrient.id}>
                        <td>{nutrient.name}</td>
                        <td>
                          {nutrient.amount.toFixed(2)}
                          {unit ? ` ${unit}` : ''}
                        </td>
                        <td>
                          {nutrient.rda_percent !== null
                            ? `${nutrient.rda_percent.toFixed(1)}%`
                            : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </>
      )}
    </div>
  );
}

