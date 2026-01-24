import { useState } from 'react';
import { MealPlanWithRecipes, Recipe } from '../types';

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
  onRecipeSelect?: (recipe: Recipe) => void;
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
  onRecipeSelect,
}: MealPlanDetailViewProps) {
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string>('');
  const [newRecipeId, setNewRecipeId] = useState<string>('');
  const [newRecipeQuantity, setNewRecipeQuantity] = useState<string>('1.0');

  if (!mealPlan && !isLoadingMealPlan) {
    return null;
  }

  const handleStartEditRecipe = (recipeId: number, currentQuantity: number) => {
    setEditingRecipeId(recipeId);
    setEditingQuantity(currentQuantity.toString());
  };

  const handleCancelEditRecipe = () => {
    setEditingRecipeId(null);
    setEditingQuantity('');
  };

  const handleSaveRecipeQuantity = (recipeId: number) => {
    const quantity = parseFloat(editingQuantity);
    if (!isNaN(quantity) && quantity > 0) {
      onUpdateRecipeQuantity(recipeId, quantity);
      setEditingRecipeId(null);
      setEditingQuantity('');
    }
  };

  const handleAddNewRecipe = () => {
    const recipeId = parseInt(newRecipeId);
    const quantity = parseFloat(newRecipeQuantity);
    if (!isNaN(recipeId) && !isNaN(quantity) && quantity > 0) {
      const recipe = availableRecipes.find((r) => r.id === recipeId);
      if (recipe) {
        onAddRecipe(recipe, quantity);
        setNewRecipeId('');
        setNewRecipeQuantity('1.0');
      }
    }
  };

  return (
    <div className="meal-plan-detail-container">
      <div className="meal-plan-detail-header">
        <h2>{mealPlan?.name || 'Meal Plan'}</h2>
        <button onClick={onBack} className="back-button">
          Back to Meal Plans
        </button>
      </div>

      {mealPlan?.calorie_density !== null && mealPlan?.calorie_density !== undefined && (
        <div className="meal-plan-calorie-density">
          <strong>Calorie Density:</strong> {mealPlan.calorie_density.toFixed(1)} kcal/g
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
                    <th>Calorie Density</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mealPlan?.recipes.map((mealPlanRecipe) => {
                    const totalGramWeight = mealPlanRecipe.recipe_total_weight * mealPlanRecipe.quantity;
                    return (
                      <tr key={mealPlanRecipe.id}>
                        <td>{mealPlanRecipe.recipe_name}</td>
                        <td>
                          {editingRecipeId === mealPlanRecipe.recipe_id ? (
                            <div className="inline-edit">
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={editingQuantity}
                                onChange={(e) => setEditingQuantity(e.target.value)}
                                className="form-input inline-input"
                              />
                              <button
                                onClick={() => handleSaveRecipeQuantity(mealPlanRecipe.recipe_id)}
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
                    onChange={(e) => setNewRecipeId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select a recipe...</option>
                    {availableRecipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id.toString()}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newRecipeQuantity}
                    onChange={(e) => setNewRecipeQuantity(e.target.value)}
                    className="form-input"
                    placeholder="Quantity"
                  />
                  <button
                    onClick={handleAddNewRecipe}
                    disabled={isAddingRecipe || !newRecipeId || !newRecipeQuantity || parseFloat(newRecipeQuantity) <= 0}
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
