import { FoodCategory } from '../types';
import { Dispatch, SetStateAction } from 'react';

interface CategoryFilterProps {
  foodCategories: FoodCategory[];
  isLoadingCategories: boolean;
  categoriesError: string | null;
  selectedCategories: number[];
  setSelectedCategories: Dispatch<SetStateAction<number[]>>;
}

export function CategoryFilter({
  foodCategories,
  isLoadingCategories,
  categoriesError,
  selectedCategories,
  setSelectedCategories,
}: CategoryFilterProps) {
  return (
    <div className="category-filter-container">
      <label className="category-filter-label">Filter by Category:</label>
      {isLoadingCategories ? (
        <p className="loading-message">Loading categories...</p>
      ) : categoriesError ? (
        <p className="error-message">{categoriesError}</p>
      ) : foodCategories.length > 0 ? (
        <div className="category-selector">
          <div className="category-select-all-buttons">
            <button
              type="button"
              onClick={() => setSelectedCategories(foodCategories.map((cat) => cat.id))}
              className="select-all-button"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategories([])}
              className="deselect-all-button"
            >
              Deselect All
            </button>
          </div>
          <div className="category-checkbox-list">
            {foodCategories.map((category) => (
              <div key={category.id} className="category-checkbox-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter((id) => id !== category.id));
                      }
                    }}
                    className="category-checkbox"
                  />
                  <span>
                    {category.emoji && <span className="category-emoji">{category.emoji}</span>}
                    {category.description}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
