import { useState, useEffect } from 'react';
import { IngredientWithFood, FoodPortion, MeasurementType, Recipe } from '../types';
import { useIngredientForm } from '../hooks/useIngredientForm';
import { useFoodSearch } from '../hooks/useFoodSearch';

interface IngredientManagerProps {
  recipeId: number;
  ingredients: IngredientWithFood[];
  isLoadingIngredients: boolean;
  ingredientError: string | null;
  onIngredientsChange: (ingredients: IngredientWithFood[], updatedRecipe: Recipe) => void;
  onDeleteIngredient: (ingredientId: number) => Promise<void>;
  onViewFoodDetails?: (foodId: number) => void;
  getIngredientQuantity: (ingredient: IngredientWithFood) => string;
  getIngredientUnit: (ingredient: IngredientWithFood) => string;
}

export function IngredientManager({
  recipeId,
  ingredients,
  isLoadingIngredients,
  ingredientError,
  onIngredientsChange,
  onDeleteIngredient,
  onViewFoodDetails,
  getIngredientQuantity,
  getIngredientUnit,
}: IngredientManagerProps) {
  // Use hooks directly
  const foodSearch = useFoodSearch({ id: 0 }); // User passed from parent if needed
  const ingredientForm = useIngredientForm({
    recipeId,
    onIngredientChange: onIngredientsChange,
    onSelectFood: () => {
      foodSearch.clearSearchResults();
    },
  });

  const {
    newIngredient,
    setNewIngredient,
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
  } = ingredientForm.newIngredientState;

  const {
    editingIngredientId,
    editIngredientData,
    setEditIngredientData,
    isUpdatingIngredient,
    ingredientUpdateError,
    editAvailablePortions,
    isLoadingEditPortions,
    editPortionsError,
    editSelectedMeasurementType,
    setEditSelectedMeasurementType,
    editSelectedPortionId,
    setEditSelectedPortionId,
  } = ingredientForm.editIngredientState;

  const { onSelectFoodForIngredient, onAddIngredient, onStartEditIngredient, onCancelEditIngredient, onUpdateIngredient } = ingredientForm.handlers;
  const { resetNewIngredientForm } = ingredientForm.resetFunctions;

  const { categoryState, searchState, setQuery, search } = foodSearch;

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

  const renderMeasurementSelect = (
    measurementType: MeasurementType,
    setMeasurementType: (type: MeasurementType) => void,
    portionId: number | null,
    setPortionId: (id: number | null) => void,
    portions: FoodPortion[],
    isLoadingPortions: boolean,
    ingredientData: { gram_weight: string; quantity: string },
    setIngredientData: (data: any) => void,
    isEdit: boolean = false
  ) => {
    return (
      <select
        value={
          measurementType === 'grams'
            ? 'grams'
            : portionId
            ? `portion-${portionId}`
            : ''
        }
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'grams') {
            // Converting from portion to grams
            if (measurementType === 'portion' && portionId) {
              const previousPortion = portions.find((p) => p.id === portionId);
              if (previousPortion && ingredientData.quantity) {
                const quantity = parseFloat(ingredientData.quantity);
                if (!isNaN(quantity) && quantity > 0) {
                  const gramWeight = (quantity / previousPortion.amount) * previousPortion.gram_weight;
                  setIngredientData({
                    ...ingredientData,
                    gram_weight: gramWeight.toString(),
                    quantity: '',
                  });
                } else {
                  setIngredientData({ ...ingredientData, quantity: '' });
                }
              } else {
                setIngredientData({ ...ingredientData, quantity: '' });
              }
            } else {
              setIngredientData({ ...ingredientData, quantity: '' });
            }
            setMeasurementType('grams');
            setPortionId(null);
          } else if (value.startsWith('portion-')) {
            const newPortionId = parseInt(value.replace('portion-', ''), 10);
            const newPortion = portions.find((p) => p.id === newPortionId);
            
            if (newPortion) {
              let newQuantity: string;
              
              if (measurementType === 'grams' && ingredientData.gram_weight) {
                const gramWeight = parseFloat(ingredientData.gram_weight);
                if (!isNaN(gramWeight) && gramWeight > 0) {
                  const quantity = (gramWeight / newPortion.gram_weight) * newPortion.amount;
                  newQuantity = quantity.toString();
                } else {
                  newQuantity = newPortion.amount.toString();
                }
              } else if (measurementType === 'portion' && portionId && ingredientData.quantity) {
                const previousPortion = portions.find((p) => p.id === portionId);
                if (previousPortion) {
                  const oldQuantity = parseFloat(ingredientData.quantity);
                  if (!isNaN(oldQuantity) && oldQuantity > 0) {
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
                newQuantity = ingredientData.quantity || newPortion.amount.toString();
              }
              
              setIngredientData({
                ...ingredientData,
                quantity: newQuantity,
                gram_weight: '',
              });
              setMeasurementType('portion');
              setPortionId(newPortionId);
            }
          } else {
            setMeasurementType(null);
            setPortionId(null);
          }
        }}
        className={isEdit ? "form-input inline-select" : "form-input"}
        required
        disabled={isLoadingPortions}
      >
        <option value="">{isEdit ? "Select..." : "Select measurement type..."}</option>
        <option value="grams">{isEdit ? "g" : "Grams"}</option>
        {portions.map((portion) => {
          const modifier = portion.modifier ? ` ${portion.modifier}` : '';
          const portionLabel = `${portion.amount}${modifier ? ' ' + modifier : ''} (${Math.round(portion.gram_weight)}g)`;
          return (
            <option key={portion.id} value={`portion-${portion.id}`}>
              {portionLabel}
            </option>
          );
        })}
      </select>
    );
  };

  return (
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
                        renderMeasurementSelect(
                          editSelectedMeasurementType,
                          setEditSelectedMeasurementType,
                          editSelectedPortionId,
                          setEditSelectedPortionId,
                          editAvailablePortions,
                          isLoadingEditPortions,
                          editIngredientData,
                          setEditIngredientData,
                          true
                        )
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
                          isUpdatingIngredient ||
                          !editSelectedMeasurementType ||
                          (editSelectedMeasurementType === 'grams' && !editIngredientData.gram_weight) ||
                          (editSelectedMeasurementType === 'portion' &&
                            (!editSelectedPortionId || !editIngredientData.quantity))
                        }
                        className="edit-button"
                        type="button"
                      >
                        {isUpdatingIngredient ? 'Saving...' : 'Save'}
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
              {categoryState.isLoadingCategories ? (
                <p className="loading-message">Loading categories...</p>
              ) : categoryState.categoriesError ? (
                <p className="error-message">{categoryState.categoriesError}</p>
              ) : categoryState.foodCategories.length > 0 ? (
                <div className="category-selector">
                  <div className="category-select-all-buttons">
                    <button
                      type="button"
                      onClick={() => categoryState.setSelectedCategories(categoryState.foodCategories.map((cat) => cat.id))}
                      className="select-all-button"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => categoryState.setSelectedCategories([])}
                      className="deselect-all-button"
                    >
                      Deselect All
                    </button>
                  </div>
                  <div className="category-checkbox-list">
                    {categoryState.foodCategories.map((category) => (
                      <div key={category.id} className="category-checkbox-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={categoryState.selectedCategories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                categoryState.setSelectedCategories([...categoryState.selectedCategories, category.id]);
                              } else {
                                categoryState.setSelectedCategories(categoryState.selectedCategories.filter((id) => id !== category.id));
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
            <form onSubmit={search} className="search-form">
              <input
                type="text"
                value={searchState.ingredientSearchQuery}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for foods to add as ingredient..."
                className="search-input"
              />
              <button type="submit" disabled={searchState.isSearchingIngredient} className="search-button">
                {searchState.isSearchingIngredient ? 'Searching...' : 'Search'}
              </button>
            </form>

            {searchState.ingredientSearchError && <p className="error-message">{searchState.ingredientSearchError}</p>}

            {searchState.ingredientSearchResults.length > 0 && (
              <div className="ingredient-search-results">
                <ul className="food-results">
                  {searchState.ingredientSearchResults.map((food, index) => (
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
                {renderMeasurementSelect(
                  selectedMeasurementType,
                  setSelectedMeasurementType,
                  selectedPortionId,
                  setSelectedPortionId,
                  availablePortions,
                  isLoadingPortions,
                  newIngredient,
                  setNewIngredient,
                  false
                )}
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
  );
}
