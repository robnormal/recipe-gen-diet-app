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

interface RecipeDetailState {
  selectedRecipe: Recipe | null;
  isLoadingRecipe: boolean;
  recipeUpdateError: string | null;
  recipeUpdateSuccess: string | null;
  isUpdatingRecipe: boolean;
  ingredients: IngredientWithFood[];
  isLoadingIngredients: boolean;
  ingredientError: string | null;
  ingredientSearchQuery: string;
  ingredientSearchResults: FoodResult[];
  isSearchingIngredient: boolean;
  ingredientSearchError: string | null;
  newIngredient: IngredientFormState;
  isCreatingIngredient: boolean;
  ingredientCreateError: string | null;
  recipeFormData: RecipeFormData;
  availablePortions: FoodPortion[];
  isLoadingPortions: boolean;
  portionsError: string | null;
  selectedMeasurementType: MeasurementType;
  selectedPortionId: number | null;
  editAvailablePortions: FoodPortion[];
  isLoadingEditPortions: boolean;
  editPortionsError: string | null;
  editSelectedMeasurementType: MeasurementType;
  editSelectedPortionId: number | null;
  editingIngredientId: number | null;
  editIngredientData: IngredientFormState;
  isUpdatingIngredient: boolean;
  ingredientUpdateError: string | null;
  foodCategories: FoodCategory[];
  isLoadingCategories: boolean;
  categoriesError: string | null;
  selectedCategories: number[];
}

interface RecipeDetailActions {
  onBack: () => void;
  onUpdateRecipe: (e: React.FormEvent<HTMLFormElement>) => void;
  onIngredientSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  onSelectFoodForIngredient: (food: FoodResult) => void;
  onViewFoodDetails?: (foodId: number) => void;
  onAddIngredient: (e: React.FormEvent<HTMLFormElement>) => void;
  onStartEditIngredient: (ingredient: IngredientWithFood) => void;
  onCancelEditIngredient: () => void;
  onUpdateIngredient: () => void;
  onDeleteIngredient: (ingredientId: number) => Promise<void>;
  setIngredientSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedCategories: Dispatch<SetStateAction<number[]>>;
  setNewIngredient: Dispatch<SetStateAction<IngredientFormState>>;
  setSelectedMeasurementType: Dispatch<SetStateAction<MeasurementType>>;
  setSelectedPortionId: Dispatch<SetStateAction<number | null>>;
  resetNewIngredientForm: () => void;
  setEditIngredientData: Dispatch<SetStateAction<IngredientFormState>>;
  setEditSelectedMeasurementType: Dispatch<SetStateAction<MeasurementType>>;
  setEditSelectedPortionId: Dispatch<SetStateAction<number | null>>;
  setIngredientCreateError: Dispatch<SetStateAction<string | null>>;
  setRecipeFormData: Dispatch<SetStateAction<RecipeFormData>>;
}

interface RecipeDetailHelpers {
  getIngredientQuantity: (ingredient: IngredientWithFood) => string;
  getIngredientUnit: (ingredient: IngredientWithFood) => string;
}

interface RecipeDetailViewProps {
  state: RecipeDetailState;
  actions: RecipeDetailActions;
  helpers: RecipeDetailHelpers;
}

export function RecipeDetailView({ state, actions, helpers }: RecipeDetailViewProps) {
  const {
    selectedRecipe,
    isLoadingRecipe,
    recipeUpdateError,
    recipeUpdateSuccess,
    isUpdatingRecipe,
    ingredients,
    isLoadingIngredients,
    ingredientError,
    ingredientSearchQuery,
    ingredientSearchResults,
    isSearchingIngredient,
    ingredientSearchError,
    newIngredient,
    isCreatingIngredient,
    ingredientCreateError,
    recipeFormData,
    availablePortions,
    isLoadingPortions,
    portionsError,
    selectedMeasurementType,
    selectedPortionId,
    editAvailablePortions,
    isLoadingEditPortions,
    editPortionsError,
    editSelectedMeasurementType,
    editSelectedPortionId,
    editingIngredientId,
    editIngredientData,
    isUpdatingIngredient: isSavingIngredient,
    ingredientUpdateError,
    foodCategories,
    isLoadingCategories,
    categoriesError,
    selectedCategories,
  } = state;

  const {
    onBack,
    onUpdateRecipe,
    onIngredientSearch,
    onSelectFoodForIngredient,
    onViewFoodDetails,
    onAddIngredient,
    onStartEditIngredient,
    onCancelEditIngredient,
    onUpdateIngredient,
    onDeleteIngredient,
    setIngredientSearchQuery,
    setSelectedCategories,
    setNewIngredient,
    setSelectedMeasurementType,
    setSelectedPortionId,
    resetNewIngredientForm,
    setEditIngredientData,
    setEditSelectedMeasurementType,
    setEditSelectedPortionId,
    setIngredientCreateError,
    setRecipeFormData,
  } = actions;

  const { getIngredientQuantity, getIngredientUnit } = helpers;

  if (!selectedRecipe) {
    return null;
  }

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
              ingredients={ingredients}
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

              {!newIngredient.food_id ? (
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
                  newIngredient={newIngredient}
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

