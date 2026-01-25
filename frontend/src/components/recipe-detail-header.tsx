import { Recipe } from '../types';

interface RecipeDetailHeaderProps {
  recipe: Recipe;
  onBack: () => void;
}

export function RecipeDetailHeader({ recipe, onBack }: RecipeDetailHeaderProps) {
  return (
    <>
      <div className="recipe-detail-header">
        <h2>{recipe.name}</h2>
        <button onClick={onBack} className="back-button">
          Back to Recipes
        </button>
      </div>
      {recipe.calorie_density !== null && recipe.calorie_density !== undefined && (
        <div className="recipe-calorie-density">
          <strong>Calorie Density:</strong> {recipe.calorie_density.toFixed(1)} kcal/g
        </div>
      )}
    </>
  );
}
