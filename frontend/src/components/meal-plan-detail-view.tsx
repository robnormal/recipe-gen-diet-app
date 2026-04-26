import { useState, useEffect } from 'react';
import { MealPlanWithRecipes, Recipe, IngredientWithFood } from '../types';
import { fetchIngredients } from '../services/api';
import { getTotalKcal } from '../utils/nutrients';

interface MealPlanDetailViewProps {
  mealPlan: MealPlanWithRecipes | null;
  isLoadingMealPlan: boolean;
  mealPlanUpdateError: string | null;
  mealPlanUpdateSuccess: string | null;
  isUpdatingMealPlan: boolean;
  isDeletingMealPlan: boolean;
  isAddingRecipe: boolean;
  isUpdatingRecipe: boolean;
  recipeError: string | null;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  onBack: () => void;
  onUpdateMealPlan: (e: React.FormEvent) => void;
  onDeleteMealPlan: () => void;
  onAddRecipe: (recipe: Recipe, quantity: number) => void;
  onUpdateRecipeQuantity: (recipeId: number, quantity: number) => void;
  onRemoveRecipe: (recipeId: number) => void;
  availableRecipes?: Recipe[];
}

export function MealPlanDetailView({
  mealPlan,
  isLoadingMealPlan,
  mealPlanUpdateError,
  mealPlanUpdateSuccess,
  isUpdatingMealPlan,
  isDeletingMealPlan,
  isAddingRecipe,
  isUpdatingRecipe,
  recipeError,
  name,
  setName,
  description,
  setDescription,
  onBack,
  onUpdateMealPlan,
  onDeleteMealPlan,
  onAddRecipe,
  onUpdateRecipeQuantity,
  onRemoveRecipe,
  availableRecipes = [],
}: MealPlanDetailViewProps) {
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string>('');
  const [editingInputMode, setEditingInputMode] = useState<'quantity' | 'grams'>('quantity');
  const [newRecipeId, setNewRecipeId] = useState<string>('');
  const [newRecipeQuantity, setNewRecipeQuantity] = useState<string>('1.0');
  const [newRecipeInputMode, setNewRecipeInputMode] = useState<'quantity' | 'grams'>('quantity');
  const [selectedRecipeWeight, setSelectedRecipeWeight] = useState<number | null>(null);
  const [isLoadingRecipeWeight, setIsLoadingRecipeWeight] = useState<boolean>(false);

  // Fetch recipe weight when a recipe is selected and grams mode is active
  useEffect(() => {
    if (newRecipeId && newRecipeInputMode === 'grams' && !selectedRecipeWeight) {
      const recipeId = parseInt(newRecipeId);
      if (!isNaN(recipeId)) {
        setIsLoadingRecipeWeight(true);
        fetchIngredients(recipeId)
          .then((ingredients: IngredientWithFood[]) => {
            const totalWeight = ingredients.reduce((sum, ing) => sum + ing.gram_weight, 0);
            setSelectedRecipeWeight(totalWeight);
            setIsLoadingRecipeWeight(false);
          })
          .catch(() => {
            setIsLoadingRecipeWeight(false);
            setSelectedRecipeWeight(0);
          });
      }
    } else if (!newRecipeId) {
      setSelectedRecipeWeight(null);
    }
  }, [newRecipeId, newRecipeInputMode, selectedRecipeWeight]);

  if (!mealPlan && !isLoadingMealPlan) {
    return null;
  }

  const handleStartEditRecipe = (recipeId: number, currentQuantity: number) => {
    setEditingRecipeId(recipeId);
    setEditingInputMode('quantity');
    setEditingQuantity(currentQuantity.toString());
  };

  const handleCancelEditRecipe = () => {
    setEditingRecipeId(null);
    setEditingQuantity('');
    setEditingInputMode('quantity');
  };

  const handleSaveRecipeQuantity = (recipeId: number, recipeTotalWeight: number) => {
    let quantity: number;
    
    if (editingInputMode === 'grams') {
      const grams = parseFloat(editingQuantity);
      if (isNaN(grams) || grams <= 0) {
        return;
      }
      if (recipeTotalWeight <= 0) {
        return; // Cannot convert grams to quantity if recipe has no weight
      }
      quantity = grams / recipeTotalWeight;
    } else {
      quantity = parseFloat(editingQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        return;
      }
    }
    
    onUpdateRecipeQuantity(recipeId, quantity);
    setEditingRecipeId(null);
    setEditingQuantity('');
    setEditingInputMode('quantity');
  };

  const handleAddNewRecipe = () => {
    const recipeId = parseInt(newRecipeId);
    if (isNaN(recipeId)) {
      return;
    }
    
    const recipe = availableRecipes.find((r) => r.id === recipeId);
    if (!recipe) {
      return;
    }
    
    // Get the recipe's total weight
    const existingMealPlanRecipe = mealPlan?.recipes.find((r) => r.recipe_id === recipeId);
    const recipeTotalWeight = existingMealPlanRecipe?.recipe_total_weight || selectedRecipeWeight || 0;
    
    let quantity: number;
    
    if (newRecipeInputMode === 'grams') {
      const grams = parseFloat(newRecipeQuantity);
      if (isNaN(grams) || grams <= 0) {
        return;
      }
      if (recipeTotalWeight <= 0) {
        alert('Recipe weight not available. Please use quantity mode or wait for recipe weight to load.');
        return;
      }
      quantity = grams / recipeTotalWeight;
    } else {
      quantity = parseFloat(newRecipeQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        return;
      }
    }
    
    onAddRecipe(recipe, quantity);
    setNewRecipeId('');
    setNewRecipeQuantity('1.0');
    setNewRecipeInputMode('quantity');
    setSelectedRecipeWeight(null);
  };

  const totalKcal = mealPlan ? getTotalKcal(mealPlan.nutrients) : null;

  return (
    <div className="meal-plan-detail-container">
      <div className="meal-plan-detail-header">
        <h2>{mealPlan?.name || 'Meal Plan'}</h2>
        <button onClick={onBack} className="back-button">
          Back to Meal Plans
        </button>
      </div>

      {(totalKcal !== null || (mealPlan?.calorie_density !== null && mealPlan?.calorie_density !== undefined)) && (
        <div className="meal-plan-stats-block">
          {totalKcal !== null && (
            <div className="stat-item">
              <span className="stat-value">{Math.round(totalKcal)}</span>
              <span className="stat-label">kcal total</span>
            </div>
          )}
          {mealPlan?.calorie_density !== null && mealPlan?.calorie_density !== undefined && (
            <div className="stat-item">
              <span className="stat-value">{mealPlan.calorie_density.toFixed(1)}</span>
              <span className="stat-label">kcal/g</span>
            </div>
          )}
        </div>
      )}

      {isLoadingMealPlan ? (
        <p className="loading-message">Loading meal plan details...</p>
      ) : (
        <>
          <div className="meal-plan-info-section">
            <h3>Meal Plan Information</h3>
            <form onSubmit={onUpdateMealPlan}>
              <div className="form-group">
                <label htmlFor="meal-plan-name">Name:</label>
                <input
                  id="meal-plan-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="meal-plan-description">Description:</label>
                <textarea
                  id="meal-plan-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={isUpdatingMealPlan} className="submit-button">
                  {isUpdatingMealPlan ? 'Updating...' : 'Update Meal Plan'}
                </button>
                <button
                  type="button"
                  onClick={onDeleteMealPlan}
                  disabled={isDeletingMealPlan}
                  className="delete-button"
                >
                  {isDeletingMealPlan ? 'Deleting...' : 'Delete Meal Plan'}
                </button>
              </div>
              {mealPlanUpdateError && <p className="error-message">{mealPlanUpdateError}</p>}
              {mealPlanUpdateSuccess && <p className="success-message">{mealPlanUpdateSuccess}</p>}
            </form>
          </div>

          <div className="meal-plan-recipes-section">
            <h3>Recipes</h3>
            {mealPlan?.recipes.length === 0 ? (
              <p className="no-results">No recipes in this meal plan yet. Add recipes below.</p>
            ) : (
              <table className="recipes-table">
                <thead>
                  <tr>
                    <th>Recipe Name</th>
                    <th>Quantity</th>
                    <th>Gram Weight</th>
                    <th>Total kcal</th>
                    <th>Calorie Density</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mealPlan?.recipes.map((mealPlanRecipe) => {
                    const totalGramWeight = mealPlanRecipe.recipe_total_weight * mealPlanRecipe.quantity;
                    const rowKcal = mealPlanRecipe.recipe_calorie_density !== null
                      ? mealPlanRecipe.recipe_calorie_density * totalGramWeight
                      : null;
                    return (
                      <tr key={mealPlanRecipe.id}>
                        <td>{mealPlanRecipe.recipe_name}</td>
                        <td>
                          {editingRecipeId === mealPlanRecipe.recipe_id ? (
                            <div className="inline-edit">
                              <select
                                value={editingInputMode}
                                onChange={(e) => {
                                  const mode = e.target.value as 'quantity' | 'grams';
                                  const currentValue = parseFloat(editingQuantity);
                                  
                                  if (!isNaN(currentValue) && currentValue > 0) {
                                    if (editingInputMode === 'quantity' && mode === 'grams') {
                                      // Convert quantity to grams
                                      const grams = currentValue * mealPlanRecipe.recipe_total_weight;
                                      setEditingQuantity(grams.toFixed(1));
                                    } else if (editingInputMode === 'grams' && mode === 'quantity') {
                                      // Convert grams to quantity
                                      if (mealPlanRecipe.recipe_total_weight > 0) {
                                        const quantity = currentValue / mealPlanRecipe.recipe_total_weight;
                                        setEditingQuantity(quantity.toFixed(2));
                                      }
                                    }
                                  }
                                  setEditingInputMode(mode);
                                }}
                                className="form-input inline-input"
                                style={{ marginRight: '8px', width: 'auto' }}
                              >
                                <option value="quantity">Quantity</option>
                                <option value="grams">Grams</option>
                              </select>
                              <input
                                type="number"
                                step={editingInputMode === 'grams' ? '1' : '0.1'}
                                value={editingQuantity}
                                onChange={(e) => setEditingQuantity(e.target.value)}
                                className="form-input inline-input"
                                placeholder={editingInputMode === 'grams' ? 'Grams' : 'Quantity'}
                                style={{ width: '100px' }}
                              />
                              <span style={{ marginLeft: '4px', marginRight: '8px' }}>
                                {editingInputMode === 'grams' ? 'g' : 'x'}
                              </span>
                              <button
                                onClick={() => handleSaveRecipeQuantity(mealPlanRecipe.recipe_id, mealPlanRecipe.recipe_total_weight)}
                                disabled={isUpdatingRecipe || !editingQuantity || parseFloat(editingQuantity) <= 0}
                                className="save-button"
                                type="button"
                              >
                                Save
                              </button>
                              <button onClick={handleCancelEditRecipe} className="cancel-button" type="button">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span>{mealPlanRecipe.quantity}x</span>
                          )}
                        </td>
                        <td>{totalGramWeight.toFixed(1)} g</td>
                        <td>{rowKcal !== null ? `${Math.round(rowKcal)} kcal` : 'N/A'}</td>
                        <td>
                          {mealPlanRecipe.recipe_calorie_density !== null
                            ? `${mealPlanRecipe.recipe_calorie_density.toFixed(1)} kcal/g`
                            : 'N/A'}
                        </td>
                        <td>
                          {editingRecipeId === mealPlanRecipe.recipe_id ? null : (
                            <div className="recipe-actions">
                              <button
                                onClick={() => handleStartEditRecipe(mealPlanRecipe.recipe_id, mealPlanRecipe.quantity)}
                                className="edit-button"
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => onRemoveRecipe(mealPlanRecipe.recipe_id)}
                                className="delete-button"
                                type="button"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {recipeError && <p className="error-message">{recipeError}</p>}

            {availableRecipes.length > 0 && (
              <div className="add-recipe-section">
                <h4>Add Recipe</h4>
                <div className="add-recipe-form">
                  <select
                    value={newRecipeId}
                    onChange={(e) => {
                      setNewRecipeId(e.target.value);
                      setSelectedRecipeWeight(null);
                      if (newRecipeInputMode === 'grams') {
                        setNewRecipeQuantity('0');
                      } else {
                        setNewRecipeQuantity('1.0');
                      }
                    }}
                    className="form-input"
                  >
                    <option value="">Select a recipe...</option>
                    {availableRecipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id.toString()}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newRecipeInputMode}
                    onChange={(e) => {
                      const mode = e.target.value as 'quantity' | 'grams';
                      const currentValue = parseFloat(newRecipeQuantity);
                      
                      // Get recipe weight if available
                      const recipeId = newRecipeId ? parseInt(newRecipeId) : null;
                      const existingMealPlanRecipe = recipeId ? mealPlan?.recipes.find((r) => r.recipe_id === recipeId) : null;
                      const recipeTotalWeight = existingMealPlanRecipe?.recipe_total_weight || selectedRecipeWeight || 0;
                      
                      if (!isNaN(currentValue) && currentValue > 0) {
                        if (newRecipeInputMode === 'quantity' && mode === 'grams') {
                          // Convert quantity to grams
                          if (recipeTotalWeight > 0) {
                            const grams = currentValue * recipeTotalWeight;
                            setNewRecipeQuantity(grams.toFixed(1));
                          } else {
                            // Weight not available, reset to 0
                            setNewRecipeQuantity('0');
                          }
                        } else if (newRecipeInputMode === 'grams' && mode === 'quantity') {
                          // Convert grams to quantity
                          if (recipeTotalWeight > 0) {
                            const quantity = currentValue / recipeTotalWeight;
                            setNewRecipeQuantity(quantity.toFixed(2));
                          } else {
                            // Weight not available, reset to 1.0
                            setNewRecipeQuantity('1.0');
                          }
                        }
                      } else {
                        // No valid value, set defaults
                        if (mode === 'grams') {
                          setNewRecipeQuantity('0');
                        } else {
                          setNewRecipeQuantity('1.0');
                        }
                      }
                      setNewRecipeInputMode(mode);
                    }}
                    className="form-input"
                    style={{ width: 'auto' }}
                  >
                    <option value="quantity">Quantity</option>
                    <option value="grams">Grams</option>
                  </select>
                  <input
                    type="number"
                    step={newRecipeInputMode === 'grams' ? '1' : '0.1'}
                    value={newRecipeQuantity}
                    onChange={(e) => setNewRecipeQuantity(e.target.value)}
                    className="form-input"
                    placeholder={newRecipeInputMode === 'grams' ? 'Grams' : 'Quantity'}
                    disabled={newRecipeInputMode === 'grams' && isLoadingRecipeWeight}
                  />
                  {newRecipeInputMode === 'grams' && (
                    <span style={{ marginLeft: '4px', marginRight: '8px' }}>g</span>
                  )}
                  {newRecipeInputMode === 'quantity' && (
                    <span style={{ marginLeft: '4px', marginRight: '8px' }}>x</span>
                  )}
                  {newRecipeInputMode === 'grams' && isLoadingRecipeWeight && (
                    <span style={{ marginLeft: '8px', fontSize: '0.9em', color: '#666' }}>Loading weight...</span>
                  )}
                  <button
                    onClick={handleAddNewRecipe}
                    disabled={
                      isAddingRecipe ||
                      !newRecipeId ||
                      !newRecipeQuantity ||
                      parseFloat(newRecipeQuantity) <= 0 ||
                      (newRecipeInputMode === 'grams' && isLoadingRecipeWeight)
                    }
                    className="add-button"
                    type="button"
                  >
                    {isAddingRecipe ? 'Adding...' : 'Add Recipe'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {mealPlan?.nutrients && mealPlan.nutrients.length > 0 && (
            <div className="meal-plan-nutrients-section">
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
                  {mealPlan.nutrients.map((nutrient) => {
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
