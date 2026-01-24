import { useState } from 'react';
import { MealPlan, MealPlanWithRecipes, Recipe } from '../types';
import {
  fetchMealPlan as apiFetchMealPlan,
  updateMealPlan as apiUpdateMealPlan,
  deleteMealPlan as apiDeleteMealPlan,
  addRecipeToMealPlan as apiAddRecipeToMealPlan,
  updateMealPlanRecipe as apiUpdateMealPlanRecipe,
  removeRecipeFromMealPlan as apiRemoveRecipeFromMealPlan,
  ApiError,
} from '../services/api';
import { View } from './useNavigation';

interface UseMealPlanDetailOptions {
  onMealPlanChange?: (mealPlan: MealPlan) => void;
  navigate?: (view: View, id?: number | null) => void;
}

export function useMealPlanDetail(options: UseMealPlanDetailOptions = {}) {
  const { onMealPlanChange, navigate } = options;

  // Meal plan detail state
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlanWithRecipes | null>(null);
  const [isLoadingMealPlan, setIsLoadingMealPlan] = useState<boolean>(false);
  const [mealPlanUpdateError, setMealPlanUpdateError] = useState<string | null>(null);
  const [mealPlanUpdateSuccess, setMealPlanUpdateSuccess] = useState<string | null>(null);
  const [isUpdatingMealPlan, setIsUpdatingMealPlan] = useState<boolean>(false);
  const [isDeletingMealPlan, setIsDeletingMealPlan] = useState<boolean>(false);

  // Recipe management state
  const [isAddingRecipe, setIsAddingRecipe] = useState<boolean>(false);
  const [isUpdatingRecipe, setIsUpdatingRecipe] = useState<boolean>(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleUnauthorizedError = (error: unknown): boolean => {
    if (error instanceof ApiError && error.status === 401) {
      return true;
    }
    return false;
  };

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const handleMealPlanClick = async (mealPlan: MealPlan) => {
    if (navigate) {
      navigate('mealPlanDetail', mealPlan.id);
    }
    setIsLoadingMealPlan(true);
    setMealPlanUpdateError(null);
    setMealPlanUpdateSuccess(null);
    setRecipeError(null);
    setSelectedMealPlan(null);

    try {
      const mealPlanDetails = await apiFetchMealPlan(mealPlan.id);
      setSelectedMealPlan(mealPlanDetails);
      setName(mealPlanDetails.name);
      setDescription(mealPlanDetails.description || '');
    } catch (err) {
      console.error('Error loading meal plan details:', err);
      if (handleUnauthorizedError(err)) {
        setMealPlanUpdateError('Session expired. Please login again.');
      } else {
        setMealPlanUpdateError(getErrorMessage(err, 'Failed to load meal plan details'));
      }
    } finally {
      setIsLoadingMealPlan(false);
    }
  };

  const handleUpdateMealPlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMealPlan) {
      return;
    }

    setIsUpdatingMealPlan(true);
    setMealPlanUpdateError(null);
    setMealPlanUpdateSuccess(null);

    try {
      const updateData: {
        name?: string;
        description?: string | null;
      } = {
        name: name.trim(),
      };

      if (description.trim()) {
        updateData.description = description.trim();
      } else {
        updateData.description = null;
      }

      const updatedMealPlan = await apiUpdateMealPlan(selectedMealPlan.id, updateData);
      
      // Refresh full meal plan details
      const fullMealPlan = await apiFetchMealPlan(selectedMealPlan.id);
      setSelectedMealPlan(fullMealPlan);
      setName(fullMealPlan.name);
      setDescription(fullMealPlan.description || '');

      setMealPlanUpdateSuccess('Meal plan updated successfully!');

      if (onMealPlanChange) {
        onMealPlanChange(updatedMealPlan);
      }
    } catch (err) {
      console.error('Meal plan update error:', err);
      if (handleUnauthorizedError(err)) {
        setMealPlanUpdateError('Session expired. Please login again.');
      } else {
        setMealPlanUpdateError(getErrorMessage(err, 'Failed to update meal plan. Please try again.'));
      }
    } finally {
      setIsUpdatingMealPlan(false);
    }
  };

  const handleDeleteMealPlan = async () => {
    if (!selectedMealPlan) return;

    if (!confirm('Are you sure you want to delete this meal plan?')) {
      return;
    }

    setIsDeletingMealPlan(true);
    setMealPlanUpdateError(null);

    try {
      await apiDeleteMealPlan(selectedMealPlan.id);
      if (navigate) {
        navigate('mealPlans');
      }
      handleBackToMealPlans();
    } catch (err) {
      console.error('Delete meal plan error:', err);
      if (handleUnauthorizedError(err)) {
        setMealPlanUpdateError('Session expired. Please login again.');
      } else {
        setMealPlanUpdateError(getErrorMessage(err, 'Failed to delete meal plan'));
      }
    } finally {
      setIsDeletingMealPlan(false);
    }
  };

  const handleAddRecipe = async (recipe: Recipe, quantity: number = 1.0) => {
    if (!selectedMealPlan) return;

    setIsAddingRecipe(true);
    setRecipeError(null);

    try {
      await apiAddRecipeToMealPlan(selectedMealPlan.id, recipe.id, quantity);
      const updatedMealPlan = await apiFetchMealPlan(selectedMealPlan.id);
      setSelectedMealPlan(updatedMealPlan);
    } catch (err) {
      console.error('Add recipe error:', err);
      if (handleUnauthorizedError(err)) {
        setRecipeError('Session expired. Please login again.');
      } else {
        setRecipeError(getErrorMessage(err, 'Failed to add recipe to meal plan'));
      }
    } finally {
      setIsAddingRecipe(false);
    }
  };

  const handleUpdateRecipeQuantity = async (recipeId: number, quantity: number) => {
    if (!selectedMealPlan) return;

    setIsUpdatingRecipe(true);
    setRecipeError(null);

    try {
      await apiUpdateMealPlanRecipe(selectedMealPlan.id, recipeId, quantity);
      const updatedMealPlan = await apiFetchMealPlan(selectedMealPlan.id);
      setSelectedMealPlan(updatedMealPlan);
    } catch (err) {
      console.error('Update recipe quantity error:', err);
      if (handleUnauthorizedError(err)) {
        setRecipeError('Session expired. Please login again.');
      } else {
        setRecipeError(getErrorMessage(err, 'Failed to update recipe quantity'));
      }
    } finally {
      setIsUpdatingRecipe(false);
    }
  };

  const handleRemoveRecipe = async (recipeId: number) => {
    if (!selectedMealPlan) return;

    if (!confirm('Are you sure you want to remove this recipe from the meal plan?')) {
      return;
    }

    setIsUpdatingRecipe(true);
    setRecipeError(null);

    try {
      await apiRemoveRecipeFromMealPlan(selectedMealPlan.id, recipeId);
      const updatedMealPlan = await apiFetchMealPlan(selectedMealPlan.id);
      setSelectedMealPlan(updatedMealPlan);
    } catch (err) {
      console.error('Remove recipe error:', err);
      if (handleUnauthorizedError(err)) {
        setRecipeError('Session expired. Please login again.');
      } else {
        setRecipeError(getErrorMessage(err, 'Failed to remove recipe from meal plan'));
      }
    } finally {
      setIsUpdatingRecipe(false);
    }
  };

  const handleBackToMealPlans = () => {
    setSelectedMealPlan(null);
    setMealPlanUpdateError(null);
    setMealPlanUpdateSuccess(null);
    setRecipeError(null);
    setName('');
    setDescription('');
  };

  return {
    mealPlanDetailState: {
      selectedMealPlan,
      isLoadingMealPlan,
      mealPlanUpdateError,
      mealPlanUpdateSuccess,
      isUpdatingMealPlan,
      isDeletingMealPlan,
      isAddingRecipe,
      isUpdatingRecipe,
      recipeError,
    },
    setSelectedMealPlan,
    name,
    setName,
    description,
    setDescription,
    handlers: {
      onMealPlanClick: handleMealPlanClick,
      onUpdateMealPlan: handleUpdateMealPlan,
      onDeleteMealPlan: handleDeleteMealPlan,
      onAddRecipe: handleAddRecipe,
      onUpdateRecipeQuantity: handleUpdateRecipeQuantity,
      onRemoveRecipe: handleRemoveRecipe,
      onBack: handleBackToMealPlans,
    },
  };
}
