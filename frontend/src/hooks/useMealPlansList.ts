import { useState, useCallback } from 'react';
import { MealPlan } from '../types';
import { fetchMealPlans as apiFetchMealPlans, createMealPlan as apiCreateMealPlan, ApiError } from '../services/api';

export function useMealPlansList(user: { id: number } | null) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoadingMealPlans, setIsLoadingMealPlans] = useState<boolean>(false);
  const [mealPlansError, setMealPlansError] = useState<string | null>(null);
  const [isCreatingMealPlan, setIsCreatingMealPlan] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const refreshMealPlans = useCallback(async () => {
    if (!user) return;

    setIsLoadingMealPlans(true);
    setMealPlansError(null);

    try {
      const mealPlanResults = await apiFetchMealPlans();
      setMealPlans(mealPlanResults);
    } catch (err) {
      console.error('Error fetching meal plans:', err);
      if (err instanceof ApiError && err.status === 401) {
        setMealPlansError('Session expired. Please login again.');
      } else {
        setMealPlansError(err instanceof Error ? err.message : 'Failed to load meal plans');
      }
    } finally {
      setIsLoadingMealPlans(false);
    }
  }, [user]);

  const createMealPlan = useCallback(async (name: string, description: string): Promise<MealPlan> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsCreatingMealPlan(true);
    setCreateError(null);

    try {
      const newMealPlan = await apiCreateMealPlan({ name, description: description || null });
      await refreshMealPlans();
      return newMealPlan;
    } catch (err) {
      console.error('Error creating meal plan:', err);
      if (err instanceof ApiError && err.status === 401) {
        setCreateError('Session expired. Please login again.');
      } else {
        setCreateError(err instanceof Error ? err.message : 'Failed to create meal plan');
      }
      throw err;
    } finally {
      setIsCreatingMealPlan(false);
    }
  }, [user, refreshMealPlans]);

  return {
    mealPlans,
    setMealPlans,
    isLoadingMealPlans,
    mealPlansError,
    setMealPlansError,
    refreshMealPlans,
    createMealPlan,
    isCreatingMealPlan,
    createError,
    setCreateError,
  };
}
