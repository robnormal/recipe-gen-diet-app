import { useState, useCallback } from 'react';
import { FoodCategory, FoodResult, SearchResponse } from '../types';
import { fetchCategories as apiFetchCategories, ApiError } from '../services/api';

export function useFoodSearch(user: { id: number } | null) {
  // Category state
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Search state
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState<string>('');
  const [ingredientSearchResults, setIngredientSearchResults] = useState<FoodResult[]>([]);
  const [isSearchingIngredient, setIsSearchingIngredient] = useState<boolean>(false);
  const [ingredientSearchError, setIngredientSearchError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    setIsLoadingCategories(true);
    setCategoriesError(null);

    try {
      const categories = await apiFetchCategories();
      setFoodCategories(categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      if (err instanceof ApiError && err.status === 401) {
        setCategoriesError('Session expired. Please login again.');
      } else {
        setCategoriesError(err instanceof Error ? err.message : 'Failed to load categories');
      }
    } finally {
      setIsLoadingCategories(false);
    }
  }, [user]);

  const handleIngredientSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ingredientSearchQuery.trim()) {
      setIngredientSearchResults([]);
      return;
    }

    setIsSearchingIngredient(true);
    setIngredientSearchError(null);

    try {
      let url = `/api/foods/search?q=${encodeURIComponent(ingredientSearchQuery.trim())}&limit=20&offset=0`;
      if (selectedCategories.length > 0) {
        url += `&categories=${selectedCategories.join(',')}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to search foods');
      }

      const data: SearchResponse = await response.json();
      setIngredientSearchResults(data.results);
    } catch (err) {
      setIngredientSearchError(err instanceof Error ? err.message : 'Failed to search foods. Please try again.');
      console.error('Ingredient search error:', err);
      setIngredientSearchResults([]);
    } finally {
      setIsSearchingIngredient(false);
    }
  };

  const clearSearchResults = () => {
    setIngredientSearchResults([]);
    setIngredientSearchQuery('');
  };

  return {
    categoryState: {
      foodCategories,
      isLoadingCategories,
      categoriesError,
      selectedCategories,
      setSelectedCategories,
      fetchCategories,
    },
    searchState: {
      ingredientSearchQuery,
      ingredientSearchResults,
      isSearchingIngredient,
      ingredientSearchError,
    },
    setQuery: setIngredientSearchQuery,
    search: handleIngredientSearch,
    clearSearchResults,
  };
}

