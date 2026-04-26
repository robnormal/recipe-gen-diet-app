import { Recipe } from '../types';

interface RecipeListProps {
  recipes: Recipe[];
  isLoadingRecipes: boolean;
  recipesError: string | null;
  onRecipeClick: (recipe: Recipe) => void;
}

export function RecipeList({ recipes, isLoadingRecipes, recipesError, onRecipeClick }: RecipeListProps) {
  return (
    <div className="recipes-section">
      <h2>My Recipes</h2>
      {isLoadingRecipes ? (
        <p className="loading-message">Loading recipes...</p>
      ) : recipesError ? (
        <p className="error-message">{recipesError}</p>
      ) : recipes.length === 0 ? (
        <p className="no-results">No recipes yet. Create your first recipe above!</p>
      ) : (
        <ul className="recipes-list">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="recipe-item">
              <button onClick={() => onRecipeClick(recipe)} className="recipe-name-link" type="button">
                {recipe.name}
              </button>
              {recipe.description && <div className="recipe-description">{recipe.description}</div>}
              <div className="recipe-meta">
                {recipe.servings && (
                  <span className="recipe-servings">
                    {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
                  </span>
                )}
                {recipe.total_time_minutes && <span className="recipe-time">{recipe.total_time_minutes} min</span>}
                {recipe.calorie_density !== null && recipe.calorie_density !== undefined && (
                  <span className="recipe-calorie-badge">{recipe.calorie_density.toFixed(1)} kcal/g</span>
                )}
                <span className="recipe-date">Created: {new Date(recipe.created_at).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
