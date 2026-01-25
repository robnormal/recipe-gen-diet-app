import { Dispatch, SetStateAction } from 'react';
import {
  FoodCategory,
  FoodPortion,
  FoodResult,
  IngredientFormState,
  IngredientWithFood,
  MeasurementType,
  Recipe,
  RecipeFormData,
} from '../types';
import { RecipeDetailHeader } from './recipe-detail-header';
import { RecipeNutrientsTable } from './recipe-nutrients-table';
import { IngredientsTable } from './ingredients-table';
import { IngredientSearchSection } from './ingredient-search-section';
import { NewIngredientForm } from './new-ingredient-form';
import { RecipeEditor } from './recipe-editor';

interface RecipeDetailViewProps {
  recipe: {
    data: Recipe | null;
    isLoading: boolean;
    formData: RecipeFormData;
    updateState: {
      isUpdating: boolean;
      error: string | null;
      success: string | null;
    };
    actions: {
      onUpdate: (e: React.FormEvent<HTMLFormElement>) => void;
      setFormData: Dispatch<SetStateAction<RecipeFormData>>;
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
    };
    actions: {
      setFormData: Dispatch<SetStateAction<IngredientFormState>>;
      setMeasurementType: Dispatch<SetStateAction<MeasurementType>>;
      setPortionId: Dispatch<SetStateAction<number | null>>;
      onStart: (ingredient: IngredientWithFood) => void;
      onCancel: () => void;
      onUpdate: () => void;
      onDelete: (ingredientId: number) => Promise<void>;
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
  // Early return if no recipe data
  if (!recipe.data) {
    return null;
  }

  // Destructure for easier access
  const {
    data: selectedRecipe,
    isLoading: isLoadingRecipe,
    formData: recipeFormData,
    updateState: {
      isUpdating: isUpdatingRecipe,
      error: recipeUpdateError,
      success: recipeUpdateSuccess,
    },
    actions: {
      onUpdate: onUpdateRecipe,
      setFormData: setRecipeFormData,
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
    },
    actions: {
      setFormData: setEditIngredientData,
      setMeasurementType: setEditSelectedMeasurementType,
      setPortionId: setEditSelectedPortionId,
      onStart: onStartEditIngredient,
      onCancel: onCancelEditIngredient,
      onUpdate: onUpdateIngredient,
      onDelete: onDeleteIngredient,
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

  return (
    <div className="recipe-detail-container">
      <RecipeDetailHeader recipe={selectedRecipe} onBack={onBack} />

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
              getIngredientQuantity={getIngredientQuantity}
              getIngredientUnit={getIngredientUnit}
              onViewFoodDetails={onViewFoodDetails}
              onStartEditIngredient={onStartEditIngredient}
              onCancelEditIngredient={onCancelEditIngredient}
              onUpdateIngredient={onUpdateIngredient}
              onDeleteIngredient={onDeleteIngredient}
            />

            <div className="add-ingredient-section">
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

          <RecipeEditor
            formData={recipeFormData}
            setFormData={setRecipeFormData}
            onSubmit={onUpdateRecipe}
            isUpdating={isUpdatingRecipe}
            error={recipeUpdateError}
            success={recipeUpdateSuccess}
          />

          {selectedRecipe.nutrients && selectedRecipe.nutrients.length > 0 && (
            <RecipeNutrientsTable nutrients={selectedRecipe.nutrients} />
          )}
        </>
      )}
    </div>
  );
}

