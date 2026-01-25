import { FoodResult } from '../types';

interface FoodSearchResultsProps {
  searchResults: FoodResult[];
  onSelectFood: (food: FoodResult) => void;
  onViewFoodDetails?: (foodId: number) => void;
}

export function FoodSearchResults({
  searchResults,
  onSelectFood,
  onViewFoodDetails,
}: FoodSearchResultsProps) {
  if (searchResults.length === 0) {
    return null;
  }

  return (
    <div className="ingredient-search-results">
      <ul className="food-results">
        {searchResults.map((food, index) => (
          <li key={index} className="food-item">
            <div className="food-details" onClick={() => onSelectFood(food)}>
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
  );
}
