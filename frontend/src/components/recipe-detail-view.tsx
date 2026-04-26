import { Dispatch, SetStateAction, useRef } from 'react';
import {
  RecipeEditableField,
  RecipeEditableValue,
  FoodCategory,
  FoodPortion,
  FoodResult,
  IngredientFormState,
  IngredientWithFood,
  MeasurementType,
  Recipe,
} from '../types';
import { RecipeDetailHeader } from './recipe-detail-header';
import { RecipeNutrientsTable } from './recipe-nutrients-table';
import { IngredientsTable } from './ingredients-table';
import { IngredientSearchSection } from './ingredient-search-section';
import { NewIngredientForm } from './new-ingredient-form';

interface RecipeDetailViewProps {
  recipe: {
    data: Recipe | null;
    isLoading: boolean;
    instructionsDraft: string;
    updateError: string | null;
    actions: {
      onFieldSave: (field: RecipeEditableField, value: RecipeEditableValue) => Promise<void>;
      setInstructionsDraft: Dispatch<SetStateAction<string>>;
      onInstructionsBlur: () => Promise<void>;
      onBack: () => void;
    };
  };
  ingredients: {
    list: {
      items: IngredientWithFood[];
      isLoading: boolean;
      error: string | null;
    };
    helpers: {
      getQuantity: (ingredient: IngredientWithFood) => string;
      getUnit: (ingredient: IngredientWithFood) => string;
    };
    actions: {
      onViewFoodDetails?: (foodId: number) => void;
    };
  };
  ingredientEdit: {
    state: {
      editingId: number | null;
      formData: IngredientFormState;
      measurementType: MeasurementType;
      portionId: number | null;
      portions: {
        items: FoodPortion[];
        isLoading: boolean;
        error: string | null;
      };
      isUpdating: boolean;
      error: string | null;
      quickSaveStateById: Record<number, { isSaving: boolean; error: string | null }>;
    };
    actions: {
      setFormData: Dispatch<SetStateAction<IngredientFormState>>;
      setMeasurementType: Dispatch<SetStateAction<MeasurementType>>;
      setPortionId: Dispatch<SetStateAction<number | null>>;
      onStart: (ingredient: IngredientWithFood) => void;
      onCancel: () => void;
      onUpdate: () => void;
      onDelete: (ingredientId: number) => Promise<void>;
      onQuickAmountSave: (ingredient: IngredientWithFood, draft: string) => Promise<void>;
      onClearQuickAmountError: (ingredientId: number) => void;
    };
  };
  ingredientSearch: {
    query: string;
    results: FoodResult[];
    isLoading: boolean;
    error: string | null;
    categories: {
      items: FoodCategory[];
      isLoading: boolean;
      error: string | null;
      selected: number[];
    };
    actions: {
      setQuery: Dispatch<SetStateAction<string>>;
      onSearch: (e: React.FormEvent<HTMLFormElement>) => void;
      onSelectFood: (food: FoodResult) => void;
      setSelectedCategories: Dispatch<SetStateAction<number[]>>;
    };
  };
  newIngredient: {
    formData: IngredientFormState;
    isCreating: boolean;
    error: string | null;
    measurement: {
      type: MeasurementType;
      portionId: number | null;
      portions: {
        items: FoodPortion[];
        isLoading: boolean;
        error: string | null;
      };
    };
    actions: {
      setFormData: Dispatch<SetStateAction<IngredientFormState>>;
      setError: Dispatch<SetStateAction<string | null>>;
      setMeasurementType: Dispatch<SetStateAction<MeasurementType>>;
      setPortionId: Dispatch<SetStateAction<number | null>>;
      onAdd: (e: React.FormEvent<HTMLFormElement>) => void;
      onReset: () => void;
    };
  };
}

export function RecipeDetailView({
  recipe,
  ingredients,
  ingredientEdit,
  ingredientSearch,
  newIngredient,
}: RecipeDetailViewProps) {
  const addIngredientSectionRef = useRef<HTMLDivElement>(null);

  // Early return if no recipe data
  if (!recipe.data) {
    return null;
  }

  // Destructure for easier access
  const {
    data: selectedRecipe,
    isLoading: isLoadingRecipe,
    instructionsDraft,
    updateError: recipeUpdateError,
    actions: {
      onFieldSave,
      setInstructionsDraft,
      onInstructionsBlur,
      onBack,
    },
  } = recipe;

  const {
    list: {
      items: ingredientsList,
      isLoading: isLoadingIngredients,
      error: ingredientError,
    },
    helpers: { getQuantity: getIngredientQuantity, getUnit: getIngredientUnit },
    actions: { onViewFoodDetails },
  } = ingredients;

  const {
    state: {
      editingId: editingIngredientId,
      formData: editIngredientData,
      measurementType: editSelectedMeasurementType,
      portionId: editSelectedPortionId,
      portions: {
        items: editAvailablePortions,
        isLoading: isLoadingEditPortions,
        error: editPortionsError,
      },
      isUpdating: isSavingIngredient,
      error: ingredientUpdateError,
      quickSaveStateById,
    },
    actions: {
      setFormData: setEditIngredientData,
      setMeasurementType: setEditSelectedMeasurementType,
      setPortionId: setEditSelectedPortionId,
      onStart: onStartEditIngredient,
      onCancel: onCancelEditIngredient,
      onUpdate: onUpdateIngredient,
      onDelete: onDeleteIngredient,
      onQuickAmountSave,
      onClearQuickAmountError,
    },
  } = ingredientEdit;

  const {
    query: ingredientSearchQuery,
    results: ingredientSearchResults,
    isLoading: isSearchingIngredient,
    error: ingredientSearchError,
    categories: {
      items: foodCategories,
      isLoading: isLoadingCategories,
      error: categoriesError,
      selected: selectedCategories,
    },
    actions: {
      setQuery: setIngredientSearchQuery,
      onSearch: onIngredientSearch,
      onSelectFood: onSelectFoodForIngredient,
      setSelectedCategories,
    },
  } = ingredientSearch;

  const {
    formData: newIngredientFormData,
    isCreating: isCreatingIngredient,
    error: ingredientCreateError,
    measurement: {
      type: selectedMeasurementType,
      portionId: selectedPortionId,
      portions: {
        items: availablePortions,
        isLoading: isLoadingPortions,
        error: portionsError,
      },
    },
    actions: {
      setFormData: setNewIngredient,
      setError: setIngredientCreateError,
      setMeasurementType: setSelectedMeasurementType,
      setPortionId: setSelectedPortionId,
      onAdd: onAddIngredient,
      onReset: resetNewIngredientForm,
    },
  } = newIngredient;

  const focusAddIngredientSection = () => {
    const addSection = addIngredientSectionRef.current;
    if (!addSection) {
      return;
    }

    addSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      const focusTarget = addSection.querySelector<HTMLElement>(
        '.search-input, .ingredient-form select, .ingredient-form input'
      );
      focusTarget?.focus();
    }, 250);
  };

  return (
    <div className="recipe-detail-container">
      <RecipeDetailHeader recipe={selectedRecipe} onBack={onBack} onFieldSave={onFieldSave} />

      {isLoadingRecipe ? (
        <p className="loading-message">Loading recipe details...</p>
      ) : (
        <>
          <div className="ingredients-section">
            <h3>Ingredients</h3>
            <IngredientsTable
              ingredients={ingredientsList}
              isLoadingIngredients={isLoadingIngredients}
              ingredientError={ingredientError}
              editingIngredientId={editingIngredientId}
              editIngredientData={editIngredientData}
              setEditIngredientData={setEditIngredientData}
              editSelectedMeasurementType={editSelectedMeasurementType}
              setEditSelectedMeasurementType={setEditSelectedMeasurementType}
              editSelectedPortionId={editSelectedPortionId}
              setEditSelectedPortionId={setEditSelectedPortionId}
              editAvailablePortions={editAvailablePortions}
              isLoadingEditPortions={isLoadingEditPortions}
              editPortionsError={editPortionsError}
              isSavingIngredient={isSavingIngredient}
              ingredientUpdateError={ingredientUpdateError}
              quickSaveStateById={quickSaveStateById}
              getIngredientQuantity={getIngredientQuantity}
              getIngredientUnit={getIngredientUnit}
              onViewFoodDetails={onViewFoodDetails}
              onStartEditIngredient={onStartEditIngredient}
              onCancelEditIngredient={onCancelEditIngredient}
              onUpdateIngredient={onUpdateIngredient}
              onDeleteIngredient={onDeleteIngredient}
              onQuickAmountSave={onQuickAmountSave}
              onClearQuickAmountError={onClearQuickAmountError}
              onAddIngredientClick={focusAddIngredientSection}
            />

            <div className="add-ingredient-section" ref={addIngredientSectionRef}>
              <h4>Add Ingredient</h4>

              {!newIngredientFormData.food_id ? (
                <IngredientSearchSection
                  ingredientSearchQuery={ingredientSearchQuery}
                  setIngredientSearchQuery={setIngredientSearchQuery}
                  onIngredientSearch={onIngredientSearch}
                  isSearchingIngredient={isSearchingIngredient}
                  ingredientSearchError={ingredientSearchError}
                  ingredientSearchResults={ingredientSearchResults}
                  onSelectFoodForIngredient={onSelectFoodForIngredient}
                  onViewFoodDetails={onViewFoodDetails}
                  foodCategories={foodCategories}
                  isLoadingCategories={isLoadingCategories}
                  categoriesError={categoriesError}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                />
              ) : (
                <NewIngredientForm
                  newIngredient={newIngredientFormData}
                  setNewIngredient={setNewIngredient}
                  onAddIngredient={onAddIngredient}
                  isCreatingIngredient={isCreatingIngredient}
                  ingredientCreateError={ingredientCreateError}
                  setIngredientCreateError={setIngredientCreateError}
                  availablePortions={availablePortions}
                  isLoadingPortions={isLoadingPortions}
                  portionsError={portionsError}
                  selectedMeasurementType={selectedMeasurementType}
                  setSelectedMeasurementType={setSelectedMeasurementType}
                  selectedPortionId={selectedPortionId}
                  setSelectedPortionId={setSelectedPortionId}
                  resetNewIngredientForm={resetNewIngredientForm}
                />
              )}
            </div>
          </div>

          <div className="recipe-instructions-section">
            <label htmlFor="recipe-instructions" className="recipe-instructions-label">
              Instructions
            </label>
            <textarea
              id="recipe-instructions"
              value={instructionsDraft}
              onChange={(event) => setInstructionsDraft(event.target.value)}
              onBlur={() => void onInstructionsBlur().catch(() => undefined)}
              className="form-input recipe-instructions-textarea"
              placeholder="Add recipe instructions"
              rows={6}
            />
            {recipeUpdateError && <p className="error-message">{recipeUpdateError}</p>}
          </div>

          {selectedRecipe.nutrients && selectedRecipe.nutrients.length > 0 && (
            <RecipeNutrientsTable nutrients={selectedRecipe.nutrients} />
          )}
        </>
      )}
    </div>
  );
}
