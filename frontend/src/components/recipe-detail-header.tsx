import { Recipe } from '../types';
import { getTotalKcal } from '../utils/nutrients';

interface RecipeDetailHeaderProps {
  recipe: Recipe;
  onBack: () => void;
}

export function RecipeDetailHeader({ recipe, onBack }: RecipeDetailHeaderProps) {
  const totalKcal = getTotalKcal(recipe.nutrients ?? []);

  return (
    <>
      <div className="recipe-detail-header">
        <h2>{recipe.name}</h2>
        <button onClick={onBack} className="back-button">
          Back to Recipes
        </button>
      </div>
      {(totalKcal !== null || recipe.calorie_density !== null) && (
        <div className="recipe-stats-block">
          {totalKcal !== null && (
            <div className="stat-item">
              <span className="stat-value">{Math.round(totalKcal)}</span>
              <span className="stat-label">kcal total</span>
            </div>
          )}
          {recipe.calorie_density !== null && recipe.calorie_density !== undefined && (
            <div className="stat-item">
              <span className="stat-value">{recipe.calorie_density.toFixed(1)}</span>
              <span className="stat-label">kcal/g</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
