import { FoodSearchResults } from './food-search-results';
import { CategoryFilter } from './category-filter';
import { EmptyState } from './empty-state';
import { Dispatch, SetStateAction } from 'react';
import { FoodCategory, FoodResult } from '../types';

interface FoodsListViewProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: (e: React.FormEvent) => void;
  searchResults: FoodResult[];
  isSearching: boolean;
  searchError: string | null;
  foodCategories: FoodCategory[];
  isLoadingCategories: boolean;
  categoriesError: string | null;
  selectedCategories: number[];
  setSelectedCategories: Dispatch<SetStateAction<number[]>>;
  onFoodClick: (foodId: number) => void;
}

export function FoodsListView({
  query,
  setQuery,
  onSearch,
  searchResults,
  isSearching,
  searchError,
  foodCategories,
  isLoadingCategories,
  categoriesError,
  selectedCategories,
  setSelectedCategories,
  onFoodClick,
}: FoodsListViewProps) {
  const hasSearched = query.trim().length > 0;
  const showEmpty = hasSearched && searchResults.length === 0 && !isSearching && !searchError;

  return (
    <div className="foods-list-view">
      <h2>Foods</h2>
      <form onSubmit={onSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods..."
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      <CategoryFilter
        foodCategories={foodCategories}
        isLoadingCategories={isLoadingCategories}
        categoriesError={categoriesError}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
      />

      {searchError && <p className="error-message">{searchError}</p>}

      {showEmpty ? (
        <EmptyState
          title="No foods found"
          description="Try adjusting your search terms or category filters."
        />
      ) : !hasSearched && !isSearching ? (
        <p className="no-results">Enter a search term to find foods.</p>
      ) : (
        <FoodSearchResults
          searchResults={searchResults}
          onSelectFood={(food) => onFoodClick(food.id)}
          onViewFoodDetails={onFoodClick}
        />
      )}
    </div>
  );
}
