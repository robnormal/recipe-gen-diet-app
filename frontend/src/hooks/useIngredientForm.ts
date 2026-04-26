import { useState, useEffect, useRef } from 'react';
import { IngredientFormState, IngredientWithFood, FoodResult, FoodPortion, MeasurementType } from '../types';
import { fetchFoodPortions as apiFetchFoodPortions, createIngredient as apiCreateIngredient, updateIngredient as apiUpdateIngredient, fetchIngredients as apiFetchIngredients, fetchRecipeDetails as apiFetchRecipeDetails, ApiError } from '../services/api';

const NEW_INGREDIENT_INITIAL_STATE: IngredientFormState = {
  food_id: null,
  food_description: '',
  gram_weight: '',
  quantity: '',
};

const EDIT_INGREDIENT_INITIAL_STATE: IngredientFormState = {
  food_id: null,
  food_description: '',
  gram_weight: '',
  quantity: '',
};

interface UseIngredientFormOptions {
  recipeId: number | null;
  onIngredientChange?: (ingredients: IngredientWithFood[], updatedRecipe: any) => void;
  onSelectFood?: (food: FoodResult) => void;
}

export function useIngredientForm(options: UseIngredientFormOptions) {
  const { recipeId, onIngredientChange, onSelectFood } = options;

  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState<IngredientFormState>({
    ...NEW_INGREDIENT_INITIAL_STATE
  });
  const [isCreatingIngredient, setIsCreatingIngredient] = useState<boolean>(false);
  const [ingredientCreateError, setIngredientCreateError] = useState<string | null>(null);

  // Portion state
  const [availablePortions, setAvailablePortions] = useState<FoodPortion[]>([]);
  const [isLoadingPortions, setIsLoadingPortions] = useState<boolean>(false);
  const [portionsError, setPortionsError] = useState<string | null>(null);
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<MeasurementType>(null);
  const [selectedPortionId, setSelectedPortionId] = useState<number | null>(null);

  // Edit portion state
  const [editAvailablePortions, setEditAvailablePortions] = useState<FoodPortion[]>([]);
  const [isLoadingEditPortions, setIsLoadingEditPortions] = useState<boolean>(false);
  const [editPortionsError, setEditPortionsError] = useState<string | null>(null);
  const [editSelectedMeasurementType, setEditSelectedMeasurementType] = useState<MeasurementType>(null);
  const [editSelectedPortionId, setEditSelectedPortionId] = useState<number | null>(null);

  // Edit ingredient state
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(null);
  const [editIngredientData, setEditIngredientData] = useState<IngredientFormState>({
    ...EDIT_INGREDIENT_INITIAL_STATE
  });
  const [isUpdatingIngredient, setIsUpdatingIngredient] = useState<boolean>(false);
  const [ingredientUpdateError, setIngredientUpdateError] = useState<string | null>(null);
  const [quickSaveStateById, setQuickSaveStateById] = useState<Record<number, { isSaving: boolean; error: string | null }>>({});

  // Refs to track which portion IDs have already been auto-seeded so we
  // only fill the default quantity once per selection.
  const seededNewPortionIdRef = useRef<number | null>(null);
  const seededEditPortionIdRef = useRef<number | null>(null);

  // Seed default quantity for new-ingredient form when a portion is selected
  useEffect(() => {
    if (selectedPortionId !== seededNewPortionIdRef.current) {
      seededNewPortionIdRef.current = selectedPortionId;
      if (selectedPortionId && selectedMeasurementType === 'portion') {
        const portion = availablePortions.find((p) => p.id === selectedPortionId);
        if (portion) {
          setNewIngredient((prev) => {
            if (!prev.quantity) {
              return { ...prev, quantity: portion.amount.toString() };
            }
            return prev;
          });
        }
      }
    }
  }, [selectedPortionId, selectedMeasurementType, availablePortions]);

  // Seed default quantity for edit-ingredient form when a portion is selected
  useEffect(() => {
    if (editSelectedPortionId !== seededEditPortionIdRef.current) {
      seededEditPortionIdRef.current = editSelectedPortionId;
      if (editSelectedPortionId && editSelectedMeasurementType === 'portion') {
        const portion = editAvailablePortions.find((p) => p.id === editSelectedPortionId);
        if (portion) {
          setEditIngredientData((prev) => {
            if (!prev.quantity) {
              return { ...prev, quantity: portion.amount.toString() };
            }
            return prev;
          });
        }
      }
    }
  }, [editSelectedPortionId, editSelectedMeasurementType, editAvailablePortions]);

  const handleUnauthorizedError = (error: unknown): boolean => {
    if (error instanceof ApiError && error.status === 401) {
      return true;
    }
    return false;
  };

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const setQuickSaveState = (ingredientId: number, state: { isSaving?: boolean; error?: string | null }) => {
    setQuickSaveStateById((current) => ({
      ...current,
      [ingredientId]: {
        isSaving: state.isSaving ?? current[ingredientId]?.isSaving ?? false,
        error: state.error !== undefined ? state.error : current[ingredientId]?.error ?? null,
      },
    }));
  };

  const clearQuickSaveError = (ingredientId: number) => {
    setQuickSaveState(ingredientId, { error: null });
  };

  const resetNewIngredientForm = () => {
    setNewIngredient({ ...NEW_INGREDIENT_INITIAL_STATE });
    setSelectedMeasurementType(null);
    setSelectedPortionId(null);
    setAvailablePortions([]);
    setPortionsError(null);
    seededNewPortionIdRef.current = null;
  };

  const resetEditIngredientState = () => {
    setEditingIngredientId(null);
    setEditIngredientData({ ...EDIT_INGREDIENT_INITIAL_STATE });
    setEditSelectedMeasurementType(null);
    setEditSelectedPortionId(null);
    setEditAvailablePortions([]);
    setEditPortionsError(null);
    setIngredientUpdateError(null);
    seededEditPortionIdRef.current = null;
  };

  const handleSelectFoodForIngredient = async (food: FoodResult) => {
    setNewIngredient({
      food_id: food.id,
      food_description: food.description,
      gram_weight: '',
      quantity: ''
    });
    setSelectedMeasurementType(null);
    setSelectedPortionId(null);
    setPortionsError(null);

    // Clear search if callback provided
    if (onSelectFood) {
      onSelectFood(food);
    }

    // Fetch portions for this food
    setIsLoadingPortions(true);
    try {
      const portions = await apiFetchFoodPortions(food.id);
      setAvailablePortions(portions);
    } catch (err) {
      console.error('Error fetching food portions:', err);
      if (handleUnauthorizedError(err)) {
        setPortionsError('Session expired. Please login again.');
      } else {
        setPortionsError(getErrorMessage(err, 'Failed to load portions'));
      }
      setAvailablePortions([]);
    } finally {
      setIsLoadingPortions(false);
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipeId || !newIngredient.food_id) {
      setIngredientCreateError('Food is required');
      return;
    }

    setIsCreatingIngredient(true);
    setIngredientCreateError(null);

    try {
      let gramWeight: number;
      let quantity: number | null = null;

      if (selectedMeasurementType === 'grams') {
        // Direct gram entry
        gramWeight = parseFloat(newIngredient.gram_weight);
        if (isNaN(gramWeight) || gramWeight <= 0) {
          throw new Error('Gram weight must be a positive number');
        }
      } else if (selectedMeasurementType === 'portion' && selectedPortionId) {
        // Portion-based entry
        const selectedPortion = availablePortions.find(p => p.id === selectedPortionId);
        if (!selectedPortion) {
          throw new Error('Selected portion not found');
        }

        const userQuantity = parseFloat(newIngredient.quantity);
        if (isNaN(userQuantity) || userQuantity <= 0) {
          throw new Error('Quantity must be a positive number');
        }

        // Calculate gram_weight: (user_quantity / portion.amount) * portion.gram_weight
        gramWeight = (userQuantity / selectedPortion.amount) * selectedPortion.gram_weight;
        quantity = userQuantity;
      } else {
        throw new Error('Please select a measurement type');
      }

      const ingredientData: {
        food_id: number;
        gram_weight: number;
        food_portion_id?: number | null;
        quantity?: number | null;
      } = {
        food_id: newIngredient.food_id,
        gram_weight: gramWeight,
        food_portion_id: selectedMeasurementType === 'portion' && selectedPortionId ? selectedPortionId : null,
        quantity: quantity,
      };

      await apiCreateIngredient(recipeId, ingredientData);

      // Refresh ingredients list and recipe details (to update calorie density)
      if (onIngredientChange) {
        const [ingredientsList, updatedRecipe] = await Promise.all([
          apiFetchIngredients(recipeId),
          apiFetchRecipeDetails(recipeId)
        ]);
        onIngredientChange(ingredientsList, updatedRecipe);
      }

      // Clear form
      resetNewIngredientForm();
    } catch (err) {
      console.error('Ingredient creation error:', err);
      if (handleUnauthorizedError(err)) {
        setIngredientCreateError('Session expired. Please login again.');
      } else {
        setIngredientCreateError(getErrorMessage(err, 'Failed to create ingredient. Please try again.'));
      }
    } finally {
      setIsCreatingIngredient(false);
    }
  };

  const handleStartEditIngredient = async (ingredient: IngredientWithFood) => {
    setEditingIngredientId(ingredient.id);
    setEditIngredientData({
      food_id: ingredient.food_id,
      food_description: ingredient.food_description,
      gram_weight: ingredient.gram_weight.toString(),
      quantity: ingredient.quantity?.toString() || ''
    });
    setIngredientUpdateError(null);
    setEditSelectedMeasurementType(null);
    setEditSelectedPortionId(null);
    setEditPortionsError(null);
    seededEditPortionIdRef.current = null;

    // Determine measurement type
    if (ingredient.food_portion_id) {
      setEditSelectedMeasurementType('portion');
      setEditSelectedPortionId(ingredient.food_portion_id);
    } else {
      setEditSelectedMeasurementType('grams');
    }

    // Fetch portions for this food
    setIsLoadingEditPortions(true);
    try {
      const portions = await apiFetchFoodPortions(ingredient.food_id);
      setEditAvailablePortions(portions);
    } catch (err) {
      console.error('Failed to load portions for editing:', err);
      if (handleUnauthorizedError(err)) {
        setEditPortionsError('Session expired. Please login again.');
      } else {
        setEditPortionsError(getErrorMessage(err, 'Failed to load portions'));
      }
      setEditAvailablePortions([]);
    } finally {
      setIsLoadingEditPortions(false);
    }
  };

  const handleCancelEditIngredient = () => {
    resetEditIngredientState();
  };

  const handleUpdateIngredient = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!recipeId || !editingIngredientId || !editIngredientData.food_id) {
      setIngredientUpdateError('Food is required');
      return;
    }

    setIsUpdatingIngredient(true);
    setIngredientUpdateError(null);

    try {
      let gramWeight: number;
      let quantity: number | null = null;
      let foodPortionId: number | null = null;

      if (editSelectedMeasurementType === 'grams') {
        // Direct gram entry
        gramWeight = parseFloat(editIngredientData.gram_weight);
        if (isNaN(gramWeight) || gramWeight <= 0) {
          throw new Error('Gram weight must be a positive number');
        }
      } else if (editSelectedMeasurementType === 'portion' && editSelectedPortionId) {
        // Portion-based entry
        const selectedPortion = editAvailablePortions.find(p => p.id === editSelectedPortionId);
        if (!selectedPortion) {
          throw new Error('Selected portion not found');
        }

        const userQuantity = parseFloat(editIngredientData.quantity);
        if (isNaN(userQuantity) || userQuantity <= 0) {
          throw new Error('Quantity must be a positive number');
        }

        // Calculate gram_weight: (user_quantity / portion.amount) * portion.gram_weight
        gramWeight = (userQuantity / selectedPortion.amount) * selectedPortion.gram_weight;
        quantity = userQuantity;
        foodPortionId = editSelectedPortionId;
      } else {
        throw new Error('Please select a measurement type');
      }

      const updateData: {
        food_id?: number;
        gram_weight?: number;
        food_portion_id?: number | null;
        quantity?: number | null;
      } = {
        gram_weight: gramWeight,
        food_portion_id: foodPortionId,
        quantity: quantity,
      };

      await apiUpdateIngredient(recipeId, editingIngredientId, updateData);

      // Refresh ingredients list and recipe details (to update calorie density)
      if (onIngredientChange) {
        const [ingredientsList, updatedRecipe] = await Promise.all([
          apiFetchIngredients(recipeId),
          apiFetchRecipeDetails(recipeId)
        ]);
        onIngredientChange(ingredientsList, updatedRecipe);
      }

      // Clear edit state
      handleCancelEditIngredient();
    } catch (err) {
      console.error('Ingredient update error:', err);
      if (handleUnauthorizedError(err)) {
        setIngredientUpdateError('Session expired. Please login again.');
      } else {
        setIngredientUpdateError(getErrorMessage(err, 'Failed to update ingredient. Please try again.'));
      }
    } finally {
      setIsUpdatingIngredient(false);
    }
  };

  const handleQuickAmountSave = async (ingredient: IngredientWithFood, draft: string) => {
    if (!recipeId) {
      return;
    }

    const amount = Number.parseFloat(draft);
    if (!Number.isFinite(amount) || amount <= 0) {
      const message = 'Enter a number greater than 0';
      setQuickSaveState(ingredient.id, { error: message });
      throw new Error(message);
    }

    setQuickSaveState(ingredient.id, { isSaving: true, error: null });

    try {
      let gramWeight = amount;
      let quantity: number | null = null;
      let foodPortionId: number | null = null;

      if (ingredient.food_portion_id) {
        quantity = amount;
        foodPortionId = ingredient.food_portion_id;

        if (ingredient.quantity && ingredient.quantity > 0) {
          gramWeight = (amount / ingredient.quantity) * ingredient.gram_weight;
        } else if (ingredient.portion_amount && ingredient.portion_gram_weight) {
          gramWeight = (amount / ingredient.portion_amount) * ingredient.portion_gram_weight;
        } else {
          const portions = await apiFetchFoodPortions(ingredient.food_id);
          const selectedPortion = portions.find((portion) => portion.id === ingredient.food_portion_id);
          if (!selectedPortion) {
            throw new Error('Selected portion not found');
          }
          gramWeight = (amount / selectedPortion.amount) * selectedPortion.gram_weight;
        }
      }

      await apiUpdateIngredient(recipeId, ingredient.id, {
        gram_weight: gramWeight,
        food_portion_id: foodPortionId,
        quantity,
      });

      if (onIngredientChange) {
        const [ingredientsList, updatedRecipe] = await Promise.all([
          apiFetchIngredients(recipeId),
          apiFetchRecipeDetails(recipeId)
        ]);
        onIngredientChange(ingredientsList, updatedRecipe);
      }

      setQuickSaveState(ingredient.id, { isSaving: false, error: null });
    } catch (err) {
      console.error('Ingredient quick update error:', err);
      const message = handleUnauthorizedError(err)
        ? 'Session expired. Please login again.'
        : getErrorMessage(err, 'Failed to update ingredient. Please try again.');
      setQuickSaveState(ingredient.id, { isSaving: false, error: message });
      throw new Error(message);
    }
  };

  return {
    newIngredientState: {
      newIngredient,
      setNewIngredient,
      isCreatingIngredient,
      ingredientCreateError,
      setIngredientCreateError,
      availablePortions,
      isLoadingPortions,
      portionsError,
      selectedMeasurementType,
      setSelectedMeasurementType,
      selectedPortionId,
      setSelectedPortionId,
    },
    editIngredientState: {
      editingIngredientId,
      editIngredientData,
      setEditIngredientData,
      isUpdatingIngredient,
      ingredientUpdateError,
      setIngredientUpdateError,
      editAvailablePortions,
      isLoadingEditPortions,
      editPortionsError,
      editSelectedMeasurementType,
      setEditSelectedMeasurementType,
      editSelectedPortionId,
      setEditSelectedPortionId,
      quickSaveStateById,
      clearQuickSaveError,
    },
    handlers: {
      onSelectFoodForIngredient: handleSelectFoodForIngredient,
      onAddIngredient: handleAddIngredient,
      onStartEditIngredient: handleStartEditIngredient,
      onCancelEditIngredient: handleCancelEditIngredient,
      onUpdateIngredient: () => handleUpdateIngredient(),
      onQuickAmountSave: handleQuickAmountSave,
    },
    resetFunctions: {
      resetNewIngredientForm,
      resetEditIngredientState,
    },
  };
}
