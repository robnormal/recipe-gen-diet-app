import { useEffect } from 'react';
import './App.css';
import { AppHeader } from './components/app-header';
import { AuthView } from './components/auth-view';
import { RecipeCreationForms } from './components/recipe-creation-forms';
import { RecipeList } from './components/recipe-list';
import { RecipeDetailView } from './components/recipe-detail-view';
import { FoodDetailView } from './components/food-detail-view';
import { useAuth } from './hooks/useAuth';
import { useRecipesList } from './hooks/useRecipesList';
import { useRecipeCreation } from './hooks/useRecipeCreation';
import { useFoodSearch } from './hooks/useFoodSearch';
import { useIngredientForm } from './hooks/useIngredientForm';
import { useRecipeDetail } from './hooks/useRecipeDetail';
import { useFoodDetail } from './hooks/useFoodDetail';
import { useNavigation } from './hooks/useNavigation';

function App() {
  // Navigation
  const navigation = useNavigation();
  const { view, recipeId, foodId, navigate } = navigation;

  // Authentication
  const auth = useAuth();
  const { user, isCheckingAuth, loginState, registrationState, login, logout, register } = auth;

  // Recipes list
  const recipesList = useRecipesList(user);
  const { recipes, isLoadingRecipes, recipesError, refreshRecipes } = recipesList;

  // Recipe creation
  const recipeCreation = useRecipeCreation({
    onRecipeCreated: () => {
      refreshRecipes();
      navigate('list');
    },
    onRecipeGenerated: (recipe) => {
      refreshRecipes();
      navigate('detail', recipe.id);
      recipeDetail.handlers.onRecipeClick(recipe);
    },
    navigate,
  });
  const { createState, generateState, handlers: creationHandlers } = recipeCreation;

  // Food search
  const foodSearch = useFoodSearch(user);
  const { categoryState, searchState, setQuery, search, clearSearchResults } = foodSearch;

  // Recipe detail
  const recipeDetail = useRecipeDetail({
    onRecipeChange: () => {
      refreshRecipes();
    },
    navigate,
  });
  const {
    recipeDetailState,
    recipeFormData,
    setRecipeFormData,
    ingredients,
    setIngredients,
    isLoadingIngredients,
    ingredientError,
    handlers: detailHandlers,
    helpers,
  } = recipeDetail;

  // Ingredient form
  const ingredientForm = useIngredientForm({
    recipeId: recipeDetailState.selectedRecipe?.id ?? null,
    onIngredientChange: (ingredientsList, updatedRecipe) => {
      setIngredients(ingredientsList);
      recipeDetail.handlers.onRecipeClick(updatedRecipe);
    },
    onSelectFood: () => {
      clearSearchResults();
    },
  });
  const { newIngredientState, editIngredientState, handlers: ingredientHandlers, resetFunctions } = ingredientForm;

  // Food detail
  const foodDetail = useFoodDetail({ navigate });
  const { foodDetailState, handlers: foodDetailHandlers } = foodDetail;

  // Fetch categories and recipes when user is authenticated
  useEffect(() => {
    if (user) {
      categoryState.fetchCategories();
      refreshRecipes();
    } else {
      recipesList.setRecipes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Sync navigation view with component state
  useEffect(() => {
    if (!user) return;

    // Handle navigation to detail view
    if (view === 'detail' && recipeId !== null) {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe && recipeDetailState.selectedRecipe?.id !== recipeId) {
        recipeDetail.handlers.onRecipeClick(recipe);
      }
    } else if (view === 'food' && foodId !== null) {
      // Handle navigation to food detail view
      if (foodDetailState.selectedFood?.id !== foodId) {
        foodDetailHandlers.onFoodClick(foodId);
      }
    } else if (view === 'list' && recipeDetailState.selectedRecipe !== null) {
      // Clear recipe detail state when navigating back to list
      recipeDetail.handlers.onBack();
      foodSearch.clearSearchResults();
      ingredientForm.resetFunctions.resetNewIngredientForm();
      ingredientForm.resetFunctions.resetEditIngredientState();
    }

    // Handle navigation to create/generate forms
    if (view === 'create' && !createState.showRecipeForm) {
      createState.setShowRecipeForm(true);
    } else if (view === 'generate' && !generateState.showGenerateForm) {
      generateState.setShowGenerateForm(true);
    } else if (view === 'list') {
      if (createState.showRecipeForm) {
        createState.setShowRecipeForm(false);
      }
      if (generateState.showGenerateForm) {
        generateState.setShowGenerateForm(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, recipeId, foodId, user]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="App">
        <h1>Recipe Diet App</h1>
        <p className="health-status">Checking authentication...</p>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return (
      <AuthView
        showRegistrationForm={registrationState.showRegistrationForm}
        setShowRegistrationForm={registrationState.setShowRegistrationForm}
        loginData={loginState.loginData}
        setLoginData={loginState.setLoginData}
        isLoggingIn={loginState.isLoggingIn}
        loginError={loginState.loginError}
        onLogin={login}
        registrationData={registrationState.registrationData}
        setRegistrationData={registrationState.setRegistrationData}
        isRegistering={registrationState.isRegistering}
        registrationError={registrationState.registrationError}
        registrationSuccess={registrationState.registrationSuccess}
        setRegistrationError={registrationState.setRegistrationError}
        setRegistrationSuccess={registrationState.setRegistrationSuccess}
        onRegister={register}
      />
    );
  }

  // Show main app content if authenticated
  return (
    <div className="App">
      <AppHeader user={user} onLogout={logout} />

      {view === 'food' ? (
        <FoodDetailView
          food={foodDetailState.selectedFood}
          isLoading={foodDetailState.isLoadingFood}
          error={foodDetailState.foodError}
          onBack={foodDetailHandlers.onBack}
        />
      ) : view === 'detail' && recipeDetailState.selectedRecipe ? (
        <RecipeDetailView
          state={{
            selectedRecipe: recipeDetailState.selectedRecipe,
            isLoadingRecipe: recipeDetailState.isLoadingRecipe,
            recipeUpdateError: recipeDetailState.recipeUpdateError,
            recipeUpdateSuccess: recipeDetailState.recipeUpdateSuccess,
            isUpdatingRecipe: recipeDetailState.isUpdatingRecipe,
            ingredients,
            isLoadingIngredients,
            ingredientError,
            ingredientSearchQuery: searchState.ingredientSearchQuery,
            ingredientSearchResults: searchState.ingredientSearchResults,
            isSearchingIngredient: searchState.isSearchingIngredient,
            ingredientSearchError: searchState.ingredientSearchError,
            newIngredient: newIngredientState.newIngredient,
            isCreatingIngredient: newIngredientState.isCreatingIngredient,
            ingredientCreateError: newIngredientState.ingredientCreateError,
            recipeFormData,
            availablePortions: newIngredientState.availablePortions,
            isLoadingPortions: newIngredientState.isLoadingPortions,
            portionsError: newIngredientState.portionsError,
            selectedMeasurementType: newIngredientState.selectedMeasurementType,
            selectedPortionId: newIngredientState.selectedPortionId,
            editAvailablePortions: editIngredientState.editAvailablePortions,
            isLoadingEditPortions: editIngredientState.isLoadingEditPortions,
            editPortionsError: editIngredientState.editPortionsError,
            editSelectedMeasurementType: editIngredientState.editSelectedMeasurementType,
            editSelectedPortionId: editIngredientState.editSelectedPortionId,
            editingIngredientId: editIngredientState.editingIngredientId,
            editIngredientData: editIngredientState.editIngredientData,
            isUpdatingIngredient: editIngredientState.isUpdatingIngredient,
            ingredientUpdateError: editIngredientState.ingredientUpdateError,
            foodCategories: categoryState.foodCategories,
            isLoadingCategories: categoryState.isLoadingCategories,
            categoriesError: categoryState.categoriesError,
            selectedCategories: categoryState.selectedCategories,
          }}
          actions={{
            onBack: () => navigate('list'),
            onUpdateRecipe: detailHandlers.onUpdateRecipe,
            onIngredientSearch: search,
            onSelectFoodForIngredient: ingredientHandlers.onSelectFoodForIngredient,
            onViewFoodDetails: (foodId: number) => navigate('food', foodId),
            onAddIngredient: ingredientHandlers.onAddIngredient,
            onStartEditIngredient: ingredientHandlers.onStartEditIngredient,
            onCancelEditIngredient: ingredientHandlers.onCancelEditIngredient,
            onUpdateIngredient: ingredientHandlers.onUpdateIngredient,
            onDeleteIngredient: detailHandlers.onDeleteIngredient,
            setIngredientSearchQuery: setQuery,
            setSelectedCategories: categoryState.setSelectedCategories,
            setNewIngredient: newIngredientState.setNewIngredient,
            setSelectedMeasurementType: newIngredientState.setSelectedMeasurementType,
            setSelectedPortionId: newIngredientState.setSelectedPortionId,
            resetNewIngredientForm: resetFunctions.resetNewIngredientForm,
            setEditIngredientData: editIngredientState.setEditIngredientData,
            setEditSelectedMeasurementType: editIngredientState.setEditSelectedMeasurementType,
            setEditSelectedPortionId: editIngredientState.setEditSelectedPortionId,
            setIngredientCreateError: newIngredientState.setIngredientCreateError,
            setRecipeFormData,
          }}
          helpers={helpers}
        />
      ) : (
        <>
          <RecipeCreationForms
            navigate={navigate}
            showRecipeForm={createState.showRecipeForm}
            setShowRecipeForm={createState.setShowRecipeForm}
            showGenerateForm={generateState.showGenerateForm}
            setShowGenerateForm={generateState.setShowGenerateForm}
            recipeName={createState.recipeName}
            setRecipeName={createState.setRecipeName}
            isCreatingRecipe={createState.isCreatingRecipe}
            recipeError={createState.recipeError}
            recipeSuccess={createState.recipeSuccess}
            setRecipeError={createState.setRecipeError}
            setRecipeSuccess={createState.setRecipeSuccess}
            onCreateRecipe={creationHandlers.onCreateRecipe}
            generateRecipeName={generateState.generateRecipeName}
            setGenerateRecipeName={generateState.setGenerateRecipeName}
            generatePrompt={generateState.generatePrompt}
            setGeneratePrompt={generateState.setGeneratePrompt}
            isGeneratingRecipe={generateState.isGeneratingRecipe}
            generateError={generateState.generateError}
            setGenerateError={generateState.setGenerateError}
            onGenerateRecipe={creationHandlers.onGenerateRecipe}
          />
          <RecipeList
            recipes={recipes}
            isLoadingRecipes={isLoadingRecipes}
            recipesError={recipesError}
            onRecipeClick={detailHandlers.onRecipeClick}
          />
        </>
      )}
    </div>
  );
}

export default App;
