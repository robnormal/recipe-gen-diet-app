import { FoodCategory, FoodResult } from '../types';
import { Dispatch, SetStateAction } from 'react';
import { CategoryFilter } from './category-filter';
import { FoodSearchResults } from './food-search-results';

interface IngredientSearchSectionProps {
  ingredientSearchQuery: string;
  setIngredientSearchQuery: Dispatch<SetStateAction<string>>;
  onIngredientSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  isSearchingIngredient: boolean;
  ingredientSearchError: string | null;
  ingredientSearchResults: FoodResult[];
  onSelectFoodForIngredient: (food: FoodResult) => void;
  onViewFoodDetails?: (foodId: number) => void;
  foodCategories: FoodCategory[];
  isLoadingCategories: boolean;
  categoriesError: string | null;
  selectedCategories: number[];
  setSelectedCategories: Dispatch<SetStateAction<number[]>>;
}

export function IngredientSearchSection({
  ingredientSearchQuery,
  setIngredientSearchQuery,
  onIngredientSearch,
  isSearchingIngredient,
  ingredientSearchError,
  ingredientSearchResults,
  onSelectFoodForIngredient,
  onViewFoodDetails,
  foodCategories,
  isLoadingCategories,
  categoriesError,
  selectedCategories,
  setSelectedCategories,
}: IngredientSearchSectionProps) {
  return (
    <div className="ingredient-search-container">
      <CategoryFilter
        foodCategories={foodCategories}
        isLoadingCategories={isLoadingCategories}
        categoriesError={categoriesError}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
      />
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

      <FoodSearchResults
        searchResults={ingredientSearchResults}
        onSelectFood={onSelectFoodForIngredient}
        onViewFoodDetails={onViewFoodDetails}
      />
    </div>
  );
}
