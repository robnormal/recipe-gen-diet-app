import { useState, useCallback } from 'react';
import { FoodDetail } from '../types';
import { View } from './useNavigation';
import { fetchFoodDetails as apiFetchFoodDetails, ApiError } from '../services/api';

interface UseFoodDetailOptions {
  navigate?: (view: View, id?: number | null) => void;
}

export function useFoodDetail(options: UseFoodDetailOptions = {}) {
  const { navigate } = options;

  // Food detail state
  const [selectedFood, setSelectedFood] = useState<FoodDetail | null>(null);
  const [isLoadingFood, setIsLoadingFood] = useState<boolean>(false);
  const [foodError, setFoodError] = useState<string | null>(null);

  const handleUnauthorizedError = (error: unknown): boolean => {
    if (error instanceof ApiError && error.status === 401) {
      return true;
    }
    return false;
  };

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const handleFoodClick = useCallback(async (foodId: number) => {
    if (navigate) {
      navigate('food', foodId);
    }
    setIsLoadingFood(true);
    setFoodError(null);
    setSelectedFood(null);

    try {
      const foodDetails = await apiFetchFoodDetails(foodId);
      setSelectedFood(foodDetails);
    } catch (err) {
      console.error('Error loading food details:', err);
      if (handleUnauthorizedError(err)) {
        setFoodError('Session expired. Please login again.');
      } else {
        setFoodError(getErrorMessage(err, 'Failed to load food details'));
      }
    } finally {
      setIsLoadingFood(false);
    }
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (navigate) {
      navigate('list');
    }
    setSelectedFood(null);
    setFoodError(null);
  }, [navigate]);

  return {
    foodDetailState: {
      selectedFood,
      isLoadingFood,
      foodError,
    },
    handlers: {
      onFoodClick: handleFoodClick,
      onBack: handleBack,
    },
  };
}
