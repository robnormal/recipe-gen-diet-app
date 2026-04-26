import { useState } from 'react';
import { Recipe } from '../types';
import { createIngredient as apiCreateIngredient } from '../services/api';

type View = 'list' | 'detail' | 'create' | 'generate';

interface UseRecipeCreationOptions {
  onRecipeCreated?: (recipe: Recipe) => void;
  onRecipeGenerated?: (recipe: Recipe) => void;
  navigate?: (view: View, recipeId?: number | null) => void;
}

export function useRecipeCreation(options: UseRecipeCreationOptions = {}) {
  const { onRecipeCreated, onRecipeGenerated, navigate } = options;

  // Recipe creation state
  const [showRecipeForm, setShowRecipeForm] = useState<boolean>(false);
  const [recipeName, setRecipeName] = useState<string>('');
  const [isCreatingRecipe, setIsCreatingRecipe] = useState<boolean>(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [recipeSuccess, setRecipeSuccess] = useState<string | null>(null);

  // Recipe generation state
  const [showGenerateForm, setShowGenerateForm] = useState<boolean>(false);

  // Wrapped setters that also update URL
  const setShowRecipeFormWithNavigation = (show: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof show === 'function' ? show(showRecipeForm) : show;
    // Only update if the value actually changes
    if (newValue === showRecipeForm) return;
    setShowRecipeForm(newValue);
    if (navigate) {
      if (newValue) {
        navigate('create');
      } else {
        navigate('list');
      }
    }
  };

  const setShowGenerateFormWithNavigation = (show: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof show === 'function' ? show(showGenerateForm) : show;
    // Only update if the value actually changes
    if (newValue === showGenerateForm) return;
    setShowGenerateForm(newValue);
    if (navigate) {
      if (newValue) {
        navigate('generate');
      } else {
        navigate('list');
      }
    }
  };
  const [generateRecipeName, setGenerateRecipeName] = useState<string>('');
  const [generatePrompt, setGeneratePrompt] = useState<string>('');
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingRecipe(true);
    setRecipeError(null);
    setRecipeSuccess(null);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: recipeName.trim() }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create recipe');
      }

      const recipeData = await response.json();
      setRecipeSuccess(`Recipe "${recipeData.name}" created successfully!`);
      setRecipeName('');
      setShowRecipeFormWithNavigation(false);
      
      if (onRecipeCreated) {
        onRecipeCreated(recipeData);
      }
    } catch (err) {
      setRecipeError(err instanceof Error ? err.message : 'Failed to create recipe. Please try again.');
      console.error('Recipe creation error:', err);
    } finally {
      setIsCreatingRecipe(false);
    }
  };

  const handleGenerateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingRecipe(true);
    setGenerateError(null);

    try {
      // Step 1: Generate recipe using AI
      const generateResponse = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: generateRecipeName.trim(),
          prompt: generatePrompt.trim()
        }),
      });

      if (!generateResponse.ok) {
        if (generateResponse.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Failed to generate recipe');
      }

      const generatedData: {
        recipe: {
          name: string;
          description: string;
          instructions: string | null;
          servings: number | null;
          total_time_minutes: number | null;
        };
        ingredients: Array<{
          food_id: number;
          gram_weight: number;
          food_portion_id: number | null;
          quantity: number | null;
        }>;
      } = await generateResponse.json();

      // Step 2: Create the recipe in the database
      const createResponse = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: generatedData.recipe.name,
          description: generatedData.recipe.description,
          instructions: generatedData.recipe.instructions,
          servings: generatedData.recipe.servings,
          total_time_minutes: generatedData.recipe.total_time_minutes
        }),
      });

      if (!createResponse.ok) {
        if (createResponse.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create recipe');
      }

      const createdRecipe: Recipe = await createResponse.json();

      // Step 3: Add all ingredients
      for (const ingredient of generatedData.ingredients) {
        try {
          await apiCreateIngredient(createdRecipe.id, {
            food_id: ingredient.food_id,
            gram_weight: ingredient.gram_weight,
            food_portion_id: ingredient.food_portion_id ?? undefined,
            quantity: ingredient.quantity ?? undefined
          });
        } catch (ingredientErr) {
          console.error('Error adding ingredient:', ingredientErr);
          // Continue with other ingredients even if one fails
        }
      }

      // Step 4: Clear form
      setGenerateRecipeName('');
      setGeneratePrompt('');
      setShowGenerateFormWithNavigation(false);

      if (onRecipeGenerated) {
        onRecipeGenerated(createdRecipe);
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate recipe. Please try again.');
      console.error('Recipe generation error:', err);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  return {
    createState: {
      showRecipeForm,
      setShowRecipeForm: setShowRecipeFormWithNavigation,
      recipeName,
      setRecipeName,
      isCreatingRecipe,
      recipeError,
      recipeSuccess,
      setRecipeError,
      setRecipeSuccess,
    },
    generateState: {
      showGenerateForm,
      setShowGenerateForm: setShowGenerateFormWithNavigation,
      generateRecipeName,
      setGenerateRecipeName,
      generatePrompt,
      setGeneratePrompt,
      isGeneratingRecipe,
      generateError,
      setGenerateError,
    },
    handlers: {
      onCreateRecipe: handleCreateRecipe,
      onGenerateRecipe: handleGenerateRecipe,
    },
  };
}
