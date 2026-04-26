import { useState } from 'react';
import {
  Recipe,
  RecipeEditableField,
  RecipeEditableValue,
  RecipeUpdateData,
  IngredientWithFood,
} from '../types';
import { fetchRecipeDetails as apiFetchRecipeDetails, updateRecipeDetails as apiUpdateRecipeDetails, fetchIngredients as apiFetchIngredients, deleteIngredient as apiDeleteIngredient, ApiError } from '../services/api';
import { View } from './useNavigation';

interface UseRecipeDetailOptions {
  onRecipeChange?: (recipe: Recipe) => void;
  navigate?: (view: View, id?: number | null) => void;
}

export function useRecipeDetail(options: UseRecipeDetailOptions = {}) {
  const { onRecipeChange, navigate } = options;

  // Recipe detail state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState<boolean>(false);
  const [recipeUpdateError, setRecipeUpdateError] = useState<string | null>(null);
  const [instructionsDraft, setInstructionsDraft] = useState<string>('');

  // Ingredients state
  const [ingredients, setIngredients] = useState<IngredientWithFood[]>([]);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState<boolean>(false);
  const [ingredientError, setIngredientError] = useState<string | null>(null);

  const handleUnauthorizedError = (error: unknown): boolean => {
    if (error instanceof ApiError && error.status === 401) {
      return true;
    }
    return false;
  };

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const normalizeRecipeField = (
    field: RecipeEditableField,
    value: RecipeEditableValue
  ): RecipeUpdateData => {
    if (field === 'name') {
      const name = String(value ?? '').trim();
      if (!name) {
        throw new Error('Recipe name is required.');
      }
      return { name };
    }

    if (field === 'description' || field === 'instructions') {
      const text = String(value ?? '').trim();
      return { [field]: text || null };
    }

    const rawValue = String(value ?? '').trim();
    if (!rawValue) {
      return { [field]: null };
    }

    const numericValue = Number.parseInt(rawValue, 10);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      throw new Error(field === 'servings' ? 'Enter a positive servings count.' : 'Enter a positive time.');
    }

    return { [field]: numericValue };
  };

  const getRecipeFieldValue = (recipe: Recipe, field: RecipeEditableField): RecipeEditableValue =>
    recipe[field];

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
      const gramWeight = ingredient.portion_gram_weight !== null 
        ? ` (${Math.round(ingredient.portion_gram_weight)}g)`
        : '';
      return `${amount}${modifier}${gramWeight}`;
    }
    return 'g';
  };

  const handleRecipeClick = async (recipe: Recipe) => {
    if (navigate) {
      navigate('detail', recipe.id);
    }
      setIsLoadingRecipe(true);
      setRecipeUpdateError(null);
      setIsLoadingIngredients(true);
      setIngredientError(null);
      setSelectedRecipe(recipe);
      setInstructionsDraft(recipe.instructions || '');

    try {
      // Fetch full recipe details
      const recipeDetails = await apiFetchRecipeDetails(recipe.id);
      setSelectedRecipe(recipeDetails);
      setInstructionsDraft(recipeDetails.instructions || '');

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

  const handleFieldSave = async (field: RecipeEditableField, value: RecipeEditableValue) => {
    if (!selectedRecipe) {
      return;
    }

    const previousRecipe = selectedRecipe;
    const updateData = normalizeRecipeField(field, value);
    const normalizedValue = updateData[field];

    if (getRecipeFieldValue(previousRecipe, field) === normalizedValue) {
      return;
    }

    const optimisticRecipe = {
      ...previousRecipe,
      [field]: normalizedValue,
    };

    setRecipeUpdateError(null);
    setSelectedRecipe(optimisticRecipe);
    if (onRecipeChange) {
      onRecipeChange(optimisticRecipe);
    }

    try {
      const updatedRecipe = await apiUpdateRecipeDetails(selectedRecipe.id, updateData);
      setSelectedRecipe(updatedRecipe);
      if (field === 'instructions') {
        setInstructionsDraft(updatedRecipe.instructions || '');
      }

      if (onRecipeChange) {
        onRecipeChange(updatedRecipe);
      }
    } catch (err) {
      console.error('Recipe update error:', err);
      setSelectedRecipe(previousRecipe);
      if (field === 'instructions') {
        setInstructionsDraft(previousRecipe.instructions || '');
      }
      if (onRecipeChange) {
        onRecipeChange(previousRecipe);
      }

      let message: string;
      if (handleUnauthorizedError(err)) {
        message = 'Session expired. Please login again.';
      } else {
        message = getErrorMessage(err, 'Failed to update recipe. Please try again.');
      }
      setRecipeUpdateError(message);
      throw new Error(message);
    }
  };

  const handleInstructionsBlur = async () => {
    if (!selectedRecipe || instructionsDraft === (selectedRecipe.instructions || '')) {
      return;
    }

    await handleFieldSave('instructions', instructionsDraft);
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
    setIngredientError(null);
    setInstructionsDraft('');
  };

  return {
    recipeDetailState: {
      selectedRecipe,
      isLoadingRecipe,
      recipeUpdateError,
    },
    setSelectedRecipe,
    instructionsDraft,
    setInstructionsDraft,
    ingredients,
    setIngredients,
    isLoadingIngredients,
    ingredientError,
    setIngredientError,
    handlers: {
      onRecipeClick: handleRecipeClick,
      onSaveRecipeField: handleFieldSave,
      onInstructionsBlur: handleInstructionsBlur,
      onDeleteIngredient: handleDeleteIngredient,
      onBack: handleBackToRecipes,
    },
    helpers: {
      getIngredientQuantity,
      getIngredientUnit,
    },
  };
}
