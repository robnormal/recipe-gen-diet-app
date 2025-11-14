import { useState, useCallback } from 'react';
import { Recipe } from '../types';
import { fetchRecipes as apiFetchRecipes, ApiError } from '../services/api';

export function useRecipesList(user: { id: number } | null) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState<boolean>(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);

  const refreshRecipes = useCallback(async () => {
    if (!user) return;

    setIsLoadingRecipes(true);
    setRecipesError(null);

    try {
      const recipeResults = await apiFetchRecipes();
      setRecipes(recipeResults);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      if (err instanceof ApiError && err.status === 401) {
        setRecipesError('Session expired. Please login again.');
      } else {
        setRecipesError(err instanceof Error ? err.message : 'Failed to load recipes');
      }
    } finally {
      setIsLoadingRecipes(false);
    }
  }, [user]);

  return {
    recipes,
    setRecipes,
    isLoadingRecipes,
    recipesError,
    setRecipesError,
    refreshRecipes,
  };
}

