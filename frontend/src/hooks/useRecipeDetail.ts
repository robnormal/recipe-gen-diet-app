import { useState } from 'react';
import { Recipe, RecipeFormData, IngredientWithFood } from '../types';
import { fetchRecipeDetails as apiFetchRecipeDetails, updateRecipeDetails as apiUpdateRecipeDetails, fetchIngredients as apiFetchIngredients, deleteIngredient as apiDeleteIngredient, ApiError } from '../services/api';

const RECIPE_FORM_INITIAL_STATE: RecipeFormData = {
  name: '',
  description: '',
  instructions: '',
  servings: '',
  total_time_minutes: '',
};

interface UseRecipeDetailOptions {
  onRecipeChange?: (recipe: Recipe) => void;
  onBack?: () => void;
}

export function useRecipeDetail(options: UseRecipeDetailOptions = {}) {
  const { onRecipeChange, onBack } = options;

  // Recipe detail state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState<boolean>(false);
  const [recipeUpdateError, setRecipeUpdateError] = useState<string | null>(null);
  const [recipeUpdateSuccess, setRecipeUpdateSuccess] = useState<string | null>(null);
  const [isUpdatingRecipe, setIsUpdatingRecipe] = useState<boolean>(false);

  // Ingredients state
  const [ingredients, setIngredients] = useState<IngredientWithFood[]>([]);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState<boolean>(false);
  const [ingredientError, setIngredientError] = useState<string | null>(null);

  // Recipe form data state
  const [recipeFormData, setRecipeFormData] = useState<RecipeFormData>({
    ...RECIPE_FORM_INITIAL_STATE
  });

  const handleUnauthorizedError = (error: unknown): boolean => {
    if (error instanceof ApiError && error.status === 401) {
      return true;
    }
    return false;
  };

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  // Helper function to get ingredient quantity
  const getIngredientQuantity = (ingredient: IngredientWithFood): string => {
    if (ingredient.quantity !== null) {
      return ingredient.quantity.toString();
    }
    return ingredient.gram_weight.toString();
  };

  // Helper function to get ingredient unit/modifier (portion description)
  const getIngredientUnit = (ingredient: IngredientWithFood): string => {
    if (ingredient.food_portion_id && ingredient.portion_amount !== null) {
      // Show portion description: amount + modifier (e.g., "2 cups" or "1 tablespoon")
      const amount = ingredient.portion_amount.toString();
      const modifier = ingredient.portion_modifier ? ` ${ingredient.portion_modifier}` : '';
      return `${amount}${modifier}`;
    }
    return 'g';
  };

  const handleRecipeClick = async (recipe: Recipe) => {
    setIsLoadingRecipe(true);
    setRecipeUpdateError(null);
    setRecipeUpdateSuccess(null);
    setIsLoadingIngredients(true);
    setIngredientError(null);
    setSelectedRecipe(recipe);

    try {
      // Fetch full recipe details
      const recipeDetails = await apiFetchRecipeDetails(recipe.id);
      setSelectedRecipe(recipeDetails);

      // Initialize form data with recipe details
      setRecipeFormData({
        name: recipeDetails.name,
        description: recipeDetails.description || '',
        instructions: recipeDetails.instructions || '',
        servings: recipeDetails.servings?.toString() || '',
        total_time_minutes: recipeDetails.total_time_minutes?.toString() || ''
      });

      // Fetch ingredients
      const ingredientsList = await apiFetchIngredients(recipe.id);
      setIngredients(ingredientsList);
    } catch (err) {
      console.error('Error loading recipe details:', err);
      if (handleUnauthorizedError(err)) {
        setRecipeUpdateError('Session expired. Please login again.');
        setIngredientError('Session expired. Please login again.');
      } else {
        setRecipeUpdateError(getErrorMessage(err, 'Failed to load recipe details'));
        setIngredientError(getErrorMessage(err, 'Failed to load ingredients'));
      }
    } finally {
      setIsLoadingRecipe(false);
      setIsLoadingIngredients(false);
    }
  };

  const handleUpdateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRecipe) {
      return;
    }

    setIsUpdatingRecipe(true);
    setRecipeUpdateError(null);
    setRecipeUpdateSuccess(null);

    try {
      const updateData: {
        name?: string;
        description?: string | null;
        instructions?: string | null;
        servings?: number | null;
        total_time_minutes?: number | null;
      } = {
        name: recipeFormData.name.trim(),
      };

      if (recipeFormData.description.trim()) {
        updateData.description = recipeFormData.description.trim();
      } else {
        updateData.description = null;
      }

      if (recipeFormData.instructions.trim()) {
        updateData.instructions = recipeFormData.instructions.trim();
      } else {
        updateData.instructions = null;
      }

      if (recipeFormData.servings) {
        const servings = parseInt(recipeFormData.servings);
        if (!isNaN(servings) && servings > 0) {
          updateData.servings = servings;
        } else {
          updateData.servings = null;
        }
      } else {
        updateData.servings = null;
      }

      if (recipeFormData.total_time_minutes) {
        const time = parseInt(recipeFormData.total_time_minutes);
        if (!isNaN(time) && time > 0) {
          updateData.total_time_minutes = time;
        } else {
          updateData.total_time_minutes = null;
        }
      } else {
        updateData.total_time_minutes = null;
      }

      const updatedRecipe = await apiUpdateRecipeDetails(selectedRecipe.id, updateData);
      setSelectedRecipe(updatedRecipe);

      // Update form data with the updated recipe
      setRecipeFormData({
        name: updatedRecipe.name,
        description: updatedRecipe.description || '',
        instructions: updatedRecipe.instructions || '',
        servings: updatedRecipe.servings?.toString() || '',
        total_time_minutes: updatedRecipe.total_time_minutes?.toString() || ''
      });

      setRecipeUpdateSuccess('Recipe updated successfully!');

      if (onRecipeChange) {
        onRecipeChange(updatedRecipe);
      }
    } catch (err) {
      console.error('Recipe update error:', err);
      if (handleUnauthorizedError(err)) {
        setRecipeUpdateError('Session expired. Please login again.');
      } else {
        setRecipeUpdateError(getErrorMessage(err, 'Failed to update recipe. Please try again.'));
      }
    } finally {
      setIsUpdatingRecipe(false);
    }
  };

  const handleDeleteIngredient = async (ingredientId: number) => {
    if (!selectedRecipe) return;

    try {
      await apiDeleteIngredient(selectedRecipe.id, ingredientId);
      const [ingredientsList, updatedRecipe] = await Promise.all([
        apiFetchIngredients(selectedRecipe.id),
        apiFetchRecipeDetails(selectedRecipe.id)
      ]);
      setIngredients(ingredientsList);
      setSelectedRecipe(updatedRecipe);

      if (onRecipeChange) {
        onRecipeChange(updatedRecipe);
      }
    } catch (err) {
      console.error('Delete ingredient error:', err);
      if (handleUnauthorizedError(err)) {
        setIngredientError('Session expired. Please login again.');
      } else {
        setIngredientError(getErrorMessage(err, 'Failed to delete ingredient'));
      }
    }
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
    setIngredients([]);
    setRecipeUpdateError(null);
    setRecipeUpdateSuccess(null);
    setIngredientError(null);
    setRecipeFormData({ ...RECIPE_FORM_INITIAL_STATE });
    if (onBack) {
      onBack();
    }
  };

  const resetRecipeFormData = () => {
    setRecipeFormData({ ...RECIPE_FORM_INITIAL_STATE });
  };

  return {
    recipeDetailState: {
      selectedRecipe,
      isLoadingRecipe,
      recipeUpdateError,
      recipeUpdateSuccess,
      isUpdatingRecipe,
    },
    setSelectedRecipe,
    recipeFormData,
    setRecipeFormData,
    ingredients,
    setIngredients,
    isLoadingIngredients,
    ingredientError,
    setIngredientError,
    handlers: {
      onRecipeClick: handleRecipeClick,
      onUpdateRecipe: handleUpdateRecipe,
      onDeleteIngredient: handleDeleteIngredient,
      onBack: handleBackToRecipes,
    },
    helpers: {
      getIngredientQuantity,
      getIngredientUnit,
    },
    resetRecipeFormData,
  };
}

