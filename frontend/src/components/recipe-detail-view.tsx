import { Dispatch, SetStateAction } from 'react';
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
                            value={
                              editSelectedMeasurementType === 'grams'
                                ? editIngredientData.gram_weight
                                : editIngredientData.quantity || ''
                            }
                            onChange={(e) => {
                              if (editSelectedMeasurementType === 'grams') {
                                setEditIngredientData({ ...editIngredientData, gram_weight: e.target.value });
                              } else {
                                setEditIngredientData({ ...editIngredientData, quantity: e.target.value });
                              }
                            }}
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
                                    setEditSelectedMeasurementType('grams');
                                    setEditSelectedPortionId(null);
                                    setEditIngredientData({ ...editIngredientData, quantity: '' });
                                  } else if (value.startsWith('portion-')) {
                                    const portionId = parseInt(value.replace('portion-', ''), 10);
                                    setEditSelectedMeasurementType('portion');
                                    setEditSelectedPortionId(portionId);
                                    const selectedPortion = editAvailablePortions.find((p) => p.id === portionId);
                                    if (selectedPortion) {
                                      const newQuantity =
                                        editIngredientData.quantity || selectedPortion.amount.toString();
                                      setEditIngredientData({
                                        ...editIngredientData,
                                        quantity: newQuantity,
                                        gram_weight: '',
                                      });
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
                    <label htmlFor="ingredient-category-filter" className="category-filter-label">
                      Filter by Category:
                    </label>
                    {isLoadingCategories ? (
                      <p className="loading-message">Loading categories...</p>
                    ) : categoriesError ? (
                      <p className="error-message">{categoriesError}</p>
                    ) : foodCategories.length > 0 ? (
                      <div className="category-selector">
                        <select
                          id="ingredient-category-filter"
                          multiple
                          value={selectedCategories.map(String)}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, (option) => parseInt(option.value, 10));
                            setSelectedCategories(selected);
                          }}
                          className="category-multiselect"
                          size={Math.min(foodCategories.length, 8)}
                        >
                          {foodCategories.map((category) => (
                            <option key={category.id} value={category.id.toString()}>
                              {category.description}
                            </option>
                          ))}
                        </select>
                        {selectedCategories.length > 0 && (
                          <button type="button" onClick={() => setSelectedCategories([])} className="clear-categories-button">
                            Clear All
                          </button>
                        )}
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
                            setSelectedMeasurementType('grams');
                            setSelectedPortionId(null);
                            setNewIngredient({ ...newIngredient, quantity: '' });
                          } else if (value.startsWith('portion-')) {
                            const portionId = parseInt(value.replace('portion-', ''), 10);
                            setSelectedMeasurementType('portion');
                            setSelectedPortionId(portionId);
                            const selectedPortion = availablePortions.find((p) => p.id === portionId);
                            if (selectedPortion) {
                              setNewIngredient({
                                ...newIngredient,
                                quantity: selectedPortion.amount.toString(),
                                gram_weight: '',
                              });
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
        </>
      )}
    </div>
  );
}

