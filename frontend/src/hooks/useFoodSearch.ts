import { useState, useCallback, useEffect } from 'react';
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

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIngredientSearchResults([]);
      return;
    }

    setIsSearchingIngredient(true);
    setIngredientSearchError(null);

    try {
      let url = `/api/foods/search?q=${encodeURIComponent(query.trim())}&limit=20&offset=0`;
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
  }, [selectedCategories]);

  // Debounced typeahead: search 200ms after query changes
  useEffect(() => {
    if (!ingredientSearchQuery.trim()) {
      setIngredientSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      performSearch(ingredientSearchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [ingredientSearchQuery, performSearch]);

  const handleIngredientSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Bypass debounce on explicit form submit (Enter key)
    performSearch(ingredientSearchQuery);
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

