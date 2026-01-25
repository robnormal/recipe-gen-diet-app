import { Recipe } from '../types';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import { RecipeEditor } from './recipe-editor';
import { IngredientManager } from './ingredient-manager';

interface RecipeDetailContainerProps {
  recipeId: number;
  onBack: () => void;
  onRecipeChange?: (recipe: Recipe) => void;
  onViewFoodDetails?: (foodId: number) => void;
}

export function RecipeDetailContainer({
  recipeId,
  onBack,
  onRecipeChange,
  onViewFoodDetails,
}: RecipeDetailContainerProps) {
  const recipeDetail = useRecipeDetail({
    onRecipeChange,
  });

  const {
    recipeDetailState,
    recipeFormData,
    setRecipeFormData,
    ingredients,
    setIngredients,
    isLoadingIngredients,
    ingredientError,
    handlers,
    helpers,
  } = recipeDetail;

  const { selectedRecipe } = recipeDetailState;

  // If we don't have the selected recipe yet or it doesn't match recipeId, we need the parent
  // (App.tsx) to have triggered onRecipeClick already. This component assumes that has happened.
  if (!selectedRecipe || selectedRecipe.id !== recipeId) {
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

      <IngredientManager
        recipeId={selectedRecipe.id}
        ingredients={ingredients}
        isLoadingIngredients={isLoadingIngredients}
        ingredientError={ingredientError}
        onIngredientsChange={(ings, updatedRecipe) => {
          setIngredients(ings);
          if (onRecipeChange) {
            onRecipeChange(updatedRecipe);
          }
        }}
        onDeleteIngredient={handlers.onDeleteIngredient}
        onViewFoodDetails={onViewFoodDetails}
        getIngredientQuantity={helpers.getIngredientQuantity}
        getIngredientUnit={helpers.getIngredientUnit}
      />

      <RecipeEditor
        formData={recipeFormData}
        setFormData={setRecipeFormData}
        onSubmit={handlers.onUpdateRecipe}
        isUpdating={recipeDetailState.isUpdatingRecipe}
        error={recipeDetailState.recipeUpdateError}
        success={recipeDetailState.recipeUpdateSuccess}
      />

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
    </div>
  );
}
