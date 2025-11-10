import { useEffect, useState, useCallback } from 'react';
import './App.css';

interface FoodResult {
  id: number;
  description: string;
  calorie_density: number;
  rank: number;
}

interface SearchResponse {
  results: FoodResult[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface UserRegistrationData {
  email: string;
  username: string;
  password: string;
}

interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface Recipe {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  servings: number | null;
  total_time_minutes: number | null;
  created_at: string;
  updated_at: string;
}

interface RecipesResponse {
  results: Recipe[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface Ingredient {
  id: number;
  recipe_id: number;
  food_id: number;
  measure_unit_id: number | null;
  quantity: number | null;
  gram_weight: number;
  created_at: string;
  updated_at: string;
}

interface IngredientWithFood extends Ingredient {
  food_description: string;
}

interface FoodCategory {
  id: number;
  description: string;
}

function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Main app state
  const [healthStatus, setHealthStatus] = useState<string>('');

  // Food category state
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Registration state
  const [showRegistrationForm, setShowRegistrationForm] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<UserRegistrationData>({
    email: '',
    username: '',
    password: ''
  });
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  // Login state
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Recipe creation state
  const [showRecipeForm, setShowRecipeForm] = useState<boolean>(false);
  const [recipeName, setRecipeName] = useState<string>('');
  const [isCreatingRecipe, setIsCreatingRecipe] = useState<boolean>(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [recipeSuccess, setRecipeSuccess] = useState<string | null>(null);

  // Recipes list state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState<boolean>(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);

  // Recipe detail state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState<boolean>(false);
  const [recipeUpdateError, setRecipeUpdateError] = useState<string | null>(null);
  const [recipeUpdateSuccess, setRecipeUpdateSuccess] = useState<string | null>(null);
  const [isUpdatingRecipe, setIsUpdatingRecipe] = useState<boolean>(false);
  const [ingredients, setIngredients] = useState<IngredientWithFood[]>([]);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState<boolean>(false);
  const [ingredientError, setIngredientError] = useState<string | null>(null);

  // Recipe form data state
  const [recipeFormData, setRecipeFormData] = useState<{
    name: string;
    description: string;
    instructions: string;
    servings: string;
    total_time_minutes: string;
  }>({
    name: '',
    description: '',
    instructions: '',
    servings: '',
    total_time_minutes: ''
  });

  // Ingredient search state
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState<string>('');
  const [ingredientSearchResults, setIngredientSearchResults] = useState<FoodResult[]>([]);
  const [isSearchingIngredient, setIsSearchingIngredient] = useState<boolean>(false);
  const [ingredientSearchError, setIngredientSearchError] = useState<string | null>(null);

  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState<{
    food_id: number | null;
    food_description: string;
    gram_weight: string;
    quantity: string;
    measure_unit_id: number | null;
  }>({
    food_id: null,
    food_description: '',
    gram_weight: '',
    quantity: '',
    measure_unit_id: null
  });
  const [isCreatingIngredient, setIsCreatingIngredient] = useState<boolean>(false);
  const [ingredientCreateError, setIngredientCreateError] = useState<string | null>(null);

  // Edit ingredient state
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(null);
  const [editIngredientData, setEditIngredientData] = useState<{
    food_id: number | null;
    food_description: string;
    gram_weight: string;
    quantity: string;
    measure_unit_id: number | null;
  }>({
    food_id: null,
    food_description: '',
    gram_weight: '',
    quantity: '',
    measure_unit_id: null
  });
  const [isUpdatingIngredient, setIsUpdatingIngredient] = useState<boolean>(false);
  const [ingredientUpdateError, setIngredientUpdateError] = useState<string | null>(null);

  // Check authentication status on mount
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        setUser(null);
      } else {
        console.error('Failed to check auth status');
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    setIsLoadingCategories(true);
    setCategoriesError(null);

    try {
      const response = await fetch('/api/foods/categories', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to fetch categories');
      }

      const data: { categories: FoodCategory[] } = await response.json();
      setFoodCategories(data.categories);
    } catch (err) {
      setCategoriesError(err instanceof Error ? err.message : 'Failed to load categories');
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [user]);

  const fetchRecipes = useCallback(async () => {
    if (!user) return;

    setIsLoadingRecipes(true);
    setRecipesError(null);

    try {
      const response = await fetch('/api/recipes?limit=100&offset=0', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to fetch recipes');
      }

      const data: RecipesResponse = await response.json();
      setRecipes(data.results);
    } catch (err) {
      setRecipesError(err instanceof Error ? err.message : 'Failed to load recipes');
      console.error('Error fetching recipes:', err);
    } finally {
      setIsLoadingRecipes(false);
    }
  }, [user]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Only fetch health status, categories, and recipes if authenticated
    if (user) {
      fetch('/api/health', {
        credentials: 'include'
      })
        .then((res) => res.json())
        .then((data) => setHealthStatus(data.message))
        .catch((err) => console.error('Failed to fetch health status:', err));

      fetchCategories();
      fetchRecipes();
    } else {
      setRecipes([]);
      setFoodCategories([]);
      setSelectedCategories([]);
    }
  }, [user, fetchCategories, fetchRecipes]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to login');
      }

      const userData: User = await response.json();
      setUser(userData);
      setLoginData({ email: '', password: '' });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Failed to login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setUser(null);
      } else {
        console.error('Failed to logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegistrationError(null);
    setRegistrationSuccess(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const userData = await response.json();
      setRegistrationSuccess(`Account created successfully! Welcome, ${userData.username}!`);
      setRegistrationData({ email: '', username: '', password: '' });
      setShowRegistrationForm(false);
    } catch (err) {
      setRegistrationError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsRegistering(false);
    }
  };

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
          setUser(null);
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create recipe');
      }

      const recipeData = await response.json();
      setRecipeSuccess(`Recipe "${recipeData.name}" created successfully!`);
      setRecipeName('');
      setShowRecipeForm(false);
      // Refresh the recipes list
      await fetchRecipes();
    } catch (err) {
      setRecipeError(err instanceof Error ? err.message : 'Failed to create recipe. Please try again.');
      console.error('Recipe creation error:', err);
    } finally {
      setIsCreatingRecipe(false);
    }
  };

  // API functions for recipe details and ingredients
  const fetchRecipeDetails = async (recipeId: number): Promise<Recipe> => {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        setUser(null);
        throw new Error('Session expired. Please login again.');
      }
      if (response.status === 404) {
        throw new Error('Recipe not found');
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch recipe details');
    }

    return await response.json();
  };

  const updateRecipeDetails = async (
    recipeId: number,
    data: {
      name?: string;
      description?: string | null;
      instructions?: string | null;
      servings?: number | null;
      total_time_minutes?: number | null;
    }
  ): Promise<Recipe> => {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        setUser(null);
        throw new Error('Session expired. Please login again.');
      }
      if (response.status === 404) {
        throw new Error('Recipe not found');
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update recipe');
    }

    return await response.json();
  };

  const fetchIngredients = async (recipeId: number): Promise<IngredientWithFood[]> => {
    const response = await fetch(`/api/recipes/${recipeId}/ingredients`, {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        setUser(null);
        throw new Error('Session expired. Please login again.');
      }
      if (response.status === 404) {
        throw new Error('Recipe not found');
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch ingredients');
    }

    const data: { ingredients: IngredientWithFood[] } = await response.json();
    return data.ingredients;
  };

  const createIngredient = async (
    recipeId: number,
    ingredientData: {
      food_id: number;
      gram_weight: number;
      measure_unit_id?: number | null;
      quantity?: number | null;
    }
  ): Promise<Ingredient> => {
    const response = await fetch(`/api/recipes/${recipeId}/ingredients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(ingredientData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        setUser(null);
        throw new Error('Session expired. Please login again.');
      }
      if (response.status === 404) {
        throw new Error('Recipe not found');
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create ingredient');
    }

    return await response.json();
  };

  const updateIngredient = async (
    recipeId: number,
    ingredientId: number,
    data: {
      food_id?: number;
      gram_weight?: number;
      measure_unit_id?: number | null;
      quantity?: number | null;
    }
  ): Promise<Ingredient> => {
    const response = await fetch(`/api/recipes/${recipeId}/ingredients/${ingredientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        setUser(null);
        throw new Error('Session expired. Please login again.');
      }
      if (response.status === 404) {
        throw new Error('Ingredient not found');
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update ingredient');
    }

    return await response.json();
  };

  const deleteIngredient = async (recipeId: number, ingredientId: number): Promise<void> => {
    const response = await fetch(`/api/recipes/${recipeId}/ingredients/${ingredientId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        setUser(null);
        throw new Error('Session expired. Please login again.');
      }
      if (response.status === 404) {
        throw new Error('Ingredient not found');
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete ingredient');
    }
  };

  const handleRecipeClick = async (recipe: Recipe) => {
    setIsLoadingRecipe(true);
    setRecipeUpdateError(null);
    setRecipeUpdateSuccess(null);
    setIsLoadingIngredients(true);
    setIngredientError(null);
    setSelectedRecipe(recipe);

    try {
      // Fetch full recipe details
      const recipeDetails = await fetchRecipeDetails(recipe.id);
      setSelectedRecipe(recipeDetails);

      // Initialize form data with recipe details
      setRecipeFormData({
        name: recipeDetails.name,
        description: recipeDetails.description || '',
        instructions: recipeDetails.instructions || '',
        servings: recipeDetails.servings?.toString() || '',
        total_time_minutes: recipeDetails.total_time_minutes?.toString() || ''
      });

      // Fetch ingredients
      const ingredientsList = await fetchIngredients(recipe.id);
      setIngredients(ingredientsList);
    } catch (err) {
      setRecipeUpdateError(err instanceof Error ? err.message : 'Failed to load recipe details');
      setIngredientError(err instanceof Error ? err.message : 'Failed to load ingredients');
      console.error('Error loading recipe details:', err);
    } finally {
      setIsLoadingRecipe(false);
      setIsLoadingIngredients(false);
    }
  };

  const handleUpdateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRecipe) {
      return;
    }

    setIsUpdatingRecipe(true);
    setRecipeUpdateError(null);
    setRecipeUpdateSuccess(null);

    try {
      const updateData: {
        name?: string;
        description?: string | null;
        instructions?: string | null;
        servings?: number | null;
        total_time_minutes?: number | null;
      } = {
        name: recipeFormData.name.trim(),
      };

      if (recipeFormData.description.trim()) {
        updateData.description = recipeFormData.description.trim();
      } else {
        updateData.description = null;
      }

      if (recipeFormData.instructions.trim()) {
        updateData.instructions = recipeFormData.instructions.trim();
      } else {
        updateData.instructions = null;
      }

      if (recipeFormData.servings) {
        const servings = parseInt(recipeFormData.servings);
        if (!isNaN(servings) && servings > 0) {
          updateData.servings = servings;
        } else {
          updateData.servings = null;
        }
      } else {
        updateData.servings = null;
      }

      if (recipeFormData.total_time_minutes) {
        const time = parseInt(recipeFormData.total_time_minutes);
        if (!isNaN(time) && time > 0) {
          updateData.total_time_minutes = time;
        } else {
          updateData.total_time_minutes = null;
        }
      } else {
        updateData.total_time_minutes = null;
      }

      const updatedRecipe = await updateRecipeDetails(selectedRecipe.id, updateData);
      setSelectedRecipe(updatedRecipe);

      // Update form data with the updated recipe
      setRecipeFormData({
        name: updatedRecipe.name,
        description: updatedRecipe.description || '',
        instructions: updatedRecipe.instructions || '',
        servings: updatedRecipe.servings?.toString() || '',
        total_time_minutes: updatedRecipe.total_time_minutes?.toString() || ''
      });

      setRecipeUpdateSuccess('Recipe updated successfully!');

      // Refresh recipes list
      await fetchRecipes();
    } catch (err) {
      setRecipeUpdateError(err instanceof Error ? err.message : 'Failed to update recipe. Please try again.');
      console.error('Recipe update error:', err);
    } finally {
      setIsUpdatingRecipe(false);
    }
  };

  const handleIngredientSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ingredientSearchQuery.trim()) {
      setIngredientSearchResults([]);
      return;
    }

    setIsSearchingIngredient(true);
    setIngredientSearchError(null);

    try {
      let url = `/api/foods/search?q=${encodeURIComponent(ingredientSearchQuery.trim())}&limit=20&offset=0`;
      if (selectedCategories.length > 0) {
        url += `&categories=${selectedCategories.join(',')}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to search foods');
      }

      const data: SearchResponse = await response.json();
      setIngredientSearchResults(data.results);
    } catch (err) {
      setIngredientSearchError('Failed to search foods. Please try again.');
      console.error('Ingredient search error:', err);
      setIngredientSearchResults([]);
    } finally {
      setIsSearchingIngredient(false);
    }
  };

  const handleSelectFoodForIngredient = (food: FoodResult) => {
    setNewIngredient({
      food_id: food.id,
      food_description: food.description,
      gram_weight: '',
      quantity: '',
      measure_unit_id: null
    });
    setIngredientSearchQuery('');
    setIngredientSearchResults([]);
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRecipe || !newIngredient.food_id || !newIngredient.gram_weight) {
      setIngredientCreateError('Food and gram weight are required');
      return;
    }

    setIsCreatingIngredient(true);
    setIngredientCreateError(null);

    try {
      const gramWeight = parseFloat(newIngredient.gram_weight);
      if (isNaN(gramWeight) || gramWeight <= 0) {
        throw new Error('Gram weight must be a positive number');
      }

      const ingredientData: {
        food_id: number;
        gram_weight: number;
        measure_unit_id?: number | null;
        quantity?: number | null;
      } = {
        food_id: newIngredient.food_id,
        gram_weight: gramWeight,
      };

      if (newIngredient.quantity) {
        const quantity = parseFloat(newIngredient.quantity);
        if (!isNaN(quantity) && quantity > 0) {
          ingredientData.quantity = quantity;
        }
      }

      if (newIngredient.measure_unit_id) {
        ingredientData.measure_unit_id = newIngredient.measure_unit_id;
      }

      await createIngredient(selectedRecipe.id, ingredientData);

      // Refresh ingredients list
      const ingredientsList = await fetchIngredients(selectedRecipe.id);
      setIngredients(ingredientsList);

      // Clear form
      setNewIngredient({
        food_id: null,
        food_description: '',
        gram_weight: '',
        quantity: '',
        measure_unit_id: null
      });
    } catch (err) {
      setIngredientCreateError(err instanceof Error ? err.message : 'Failed to create ingredient. Please try again.');
      console.error('Ingredient creation error:', err);
    } finally {
      setIsCreatingIngredient(false);
    }
  };

  const handleStartEditIngredient = (ingredient: IngredientWithFood) => {
    setEditingIngredientId(ingredient.id);
    setEditIngredientData({
      food_id: ingredient.food_id,
      food_description: ingredient.food_description,
      gram_weight: ingredient.gram_weight.toString(),
      quantity: ingredient.quantity?.toString() || '',
      measure_unit_id: ingredient.measure_unit_id
    });
    setIngredientUpdateError(null);
  };

  const handleCancelEditIngredient = () => {
    setEditingIngredientId(null);
    setEditIngredientData({
      food_id: null,
      food_description: '',
      gram_weight: '',
      quantity: '',
      measure_unit_id: null
    });
    setIngredientUpdateError(null);
  };

  const handleUpdateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRecipe || !editingIngredientId || !editIngredientData.food_id || !editIngredientData.gram_weight) {
      setIngredientUpdateError('Food and gram weight are required');
      return;
    }

    setIsUpdatingIngredient(true);
    setIngredientUpdateError(null);

    try {
      const gramWeight = parseFloat(editIngredientData.gram_weight);
      if (isNaN(gramWeight) || gramWeight <= 0) {
        throw new Error('Gram weight must be a positive number');
      }

      const updateData: {
        food_id?: number;
        gram_weight?: number;
        measure_unit_id?: number | null;
        quantity?: number | null;
      } = {
        gram_weight: gramWeight,
      };

      if (editIngredientData.quantity) {
        const quantity = parseFloat(editIngredientData.quantity);
        if (!isNaN(quantity) && quantity > 0) {
          updateData.quantity = quantity;
        } else {
          updateData.quantity = null;
        }
      } else {
        updateData.quantity = null;
      }

      if (editIngredientData.measure_unit_id) {
        updateData.measure_unit_id = editIngredientData.measure_unit_id;
      } else {
        updateData.measure_unit_id = null;
      }

      await updateIngredient(selectedRecipe.id, editingIngredientId, updateData);

      // Refresh ingredients list
      const ingredientsList = await fetchIngredients(selectedRecipe.id);
      setIngredients(ingredientsList);

      // Clear edit state
      handleCancelEditIngredient();
    } catch (err) {
      setIngredientUpdateError(err instanceof Error ? err.message : 'Failed to update ingredient. Please try again.');
      console.error('Ingredient update error:', err);
    } finally {
      setIsUpdatingIngredient(false);
    }
  };

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
      <div className="App">
        <h1>Recipe Diet App</h1>

        {!showRegistrationForm ? (
          <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="login-email">Email:</label>
                <input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  required
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password:</label>
                <input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  required
                  className="form-input"
                  placeholder="Enter your password"
                />
              </div>
              {loginError && (
                <p className="error-message">{loginError}</p>
              )}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="submit-button"
                >
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
            <div className="auth-switch">
              <p>Don't have an account?</p>
              <button
                onClick={() => setShowRegistrationForm(true)}
                className="link-button"
              >
                Create Account
              </button>
            </div>
          </div>
        ) : (
          <div className="registration-container">
            <h2>Create New Account</h2>
            <form onSubmit={handleRegistration} className="registration-form">
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  id="email"
                  type="email"
                  value={registrationData.email}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, email: e.target.value })
                  }
                  required
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input
                  id="username"
                  type="text"
                  value={registrationData.username}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, username: e.target.value })
                  }
                  required
                  minLength={3}
                  className="form-input"
                  placeholder="Enter your username (min 3 characters)"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  id="password"
                  type="password"
                  value={registrationData.password}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="Enter your password (min 6 characters)"
                />
              </div>
              {registrationError && (
                <p className="error-message">{registrationError}</p>
              )}
              {registrationSuccess && (
                <p className="success-message">{registrationSuccess}</p>
              )}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="submit-button"
                >
                  {isRegistering ? 'Creating Account...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegistrationForm(false);
                    setRegistrationData({ email: '', username: '', password: '' });
                    setRegistrationError(null);
                    setRegistrationSuccess(null);
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
            <div className="auth-switch">
              <p>Already have an account?</p>
              <button
                onClick={() => setShowRegistrationForm(false)}
                className="link-button"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show main app content if authenticated
  return (
    <div className="App">
      <div className="app-header">
        <h1>Recipe Diet App</h1>
        <div className="user-info">
          <span>Welcome, {user.username}!</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
      <p className="health-status">{healthStatus || 'Connecting to backend...'}</p>

      {/* Recipe Detail Form */}
      {selectedRecipe && (
        <div className="recipe-detail-container">
          <div className="recipe-detail-header">
            <h2>Recipe Details</h2>
            <button
              onClick={() => {
                setSelectedRecipe(null);
                setIngredients([]);
                setRecipeUpdateError(null);
                setRecipeUpdateSuccess(null);
                setIngredientError(null);
                setIngredientSearchQuery('');
                setIngredientSearchResults([]);
                setIngredientSearchError(null);
                setNewIngredient({
                  food_id: null,
                  food_description: '',
                  gram_weight: '',
                  quantity: '',
                  measure_unit_id: null
                });
                setIngredientCreateError(null);
                setEditingIngredientId(null);
                setEditIngredientData({
                  food_id: null,
                  food_description: '',
                  gram_weight: '',
                  quantity: '',
                  measure_unit_id: null
                });
                setIngredientUpdateError(null);
                setRecipeFormData({
                  name: '',
                  description: '',
                  instructions: '',
                  servings: '',
                  total_time_minutes: ''
                });
              }}
              className="back-button"
            >
              Back to Recipes
            </button>
          </div>

          {isLoadingRecipe ? (
            <p className="loading-message">Loading recipe details...</p>
          ) : (
            <div className="recipe-detail-form">
              <form onSubmit={handleUpdateRecipe} className="recipe-form">
                <div className="form-group">
                  <label htmlFor="detail-recipe-name">Recipe Name:</label>
                  <input
                    id="detail-recipe-name"
                    type="text"
                    value={recipeFormData.name}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, name: e.target.value })}
                    className="form-input"
                    placeholder="Enter recipe name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="detail-recipe-description">Description:</label>
                  <textarea
                    id="detail-recipe-description"
                    value={recipeFormData.description}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, description: e.target.value })}
                    className="form-input"
                    placeholder="Enter recipe description (optional)"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="detail-recipe-instructions">Instructions:</label>
                  <textarea
                    id="detail-recipe-instructions"
                    value={recipeFormData.instructions}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, instructions: e.target.value })}
                    className="form-input"
                    placeholder="Enter recipe instructions (optional)"
                    rows={6}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="detail-recipe-servings">Servings:</label>
                    <input
                      id="detail-recipe-servings"
                      type="number"
                      min="1"
                      value={recipeFormData.servings}
                      onChange={(e) => setRecipeFormData({ ...recipeFormData, servings: e.target.value })}
                      className="form-input"
                      placeholder="Number of servings"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="detail-recipe-time">Total Time (minutes):</label>
                    <input
                      id="detail-recipe-time"
                      type="number"
                      min="1"
                      value={recipeFormData.total_time_minutes}
                      onChange={(e) => setRecipeFormData({ ...recipeFormData, total_time_minutes: e.target.value })}
                      className="form-input"
                      placeholder="Total time in minutes"
                    />
                  </div>
                </div>

                {recipeUpdateError && (
                  <p className="error-message">{recipeUpdateError}</p>
                )}
                {recipeUpdateSuccess && (
                  <p className="success-message">{recipeUpdateSuccess}</p>
                )}

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={isUpdatingRecipe}
                    className="submit-button"
                  >
                    {isUpdatingRecipe ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>

              <div className="ingredients-section">
                <h3>Ingredients</h3>
                {isLoadingIngredients ? (
                  <p className="loading-message">Loading ingredients...</p>
                ) : ingredientError ? (
                  <p className="error-message">{ingredientError}</p>
                ) : ingredients.length === 0 ? (
                  <p className="no-results">No ingredients yet. Add ingredients below.</p>
                ) : (
                  <ul className="ingredients-list">
                    {ingredients.map((ingredient) => (
                      <li key={ingredient.id} className="ingredient-item">
                        {editingIngredientId === ingredient.id ? (
                          <div className="edit-ingredient-form">
                            <form onSubmit={handleUpdateIngredient} className="ingredient-form">
                              <div className="selected-food">
                                <strong>Food:</strong> {editIngredientData.food_description}
                              </div>

                              <div className="form-group">
                                <label htmlFor={`edit-ingredient-gram-weight-${ingredient.id}`}>Gram Weight (required):</label>
                                <input
                                  id={`edit-ingredient-gram-weight-${ingredient.id}`}
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={editIngredientData.gram_weight}
                                  onChange={(e) =>
                                    setEditIngredientData({ ...editIngredientData, gram_weight: e.target.value })
                                  }
                                  className="form-input"
                                  placeholder="Enter weight in grams"
                                  required
                                />
                              </div>

                              <div className="form-group">
                                <label htmlFor={`edit-ingredient-quantity-${ingredient.id}`}>Quantity (optional):</label>
                                <input
                                  id={`edit-ingredient-quantity-${ingredient.id}`}
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={editIngredientData.quantity}
                                  onChange={(e) =>
                                    setEditIngredientData({ ...editIngredientData, quantity: e.target.value })
                                  }
                                  className="form-input"
                                  placeholder="Enter quantity (optional)"
                                />
                              </div>

                              {ingredientUpdateError && (
                                <p className="error-message">{ingredientUpdateError}</p>
                              )}

                              <div className="form-actions">
                                <button
                                  type="submit"
                                  disabled={isUpdatingIngredient || !editIngredientData.gram_weight}
                                  className="submit-button"
                                >
                                  {isUpdatingIngredient ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditIngredient}
                                  className="cancel-button"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <>
                            <div className="ingredient-info">
                              <div className="ingredient-main">
                                <span className="ingredient-food">{ingredient.food_description}</span>
                                <span className="ingredient-weight">{ingredient.gram_weight}g</span>
                              </div>
                              <div className="ingredient-details">
                                {ingredient.quantity && (
                                  <span className="ingredient-quantity">Quantity: {ingredient.quantity}</span>
                                )}
                                {ingredient.measure_unit_id && (
                                  <span className="ingredient-unit">Unit ID: {ingredient.measure_unit_id}</span>
                                )}
                              </div>
                            </div>
                            <div className="ingredient-actions">
                              <button
                                onClick={() => handleStartEditIngredient(ingredient)}
                                className="edit-button"
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  if (!selectedRecipe) return;
                                  if (!window.confirm('Are you sure you want to delete this ingredient?')) {
                                    return;
                                  }
                                  try {
                                    await deleteIngredient(selectedRecipe.id, ingredient.id);
                                    // Refresh ingredients list
                                    const ingredientsList = await fetchIngredients(selectedRecipe.id);
                                    setIngredients(ingredientsList);
                                  } catch (err) {
                                    setIngredientError(err instanceof Error ? err.message : 'Failed to delete ingredient');
                                    console.error('Delete ingredient error:', err);
                                  }
                                }}
                                className="delete-button"
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="add-ingredient-section">
                  <h4>Add Ingredient</h4>

                  {!newIngredient.food_id ? (
                    <div className="ingredient-search-container">
                      <div className="category-filter-container">
                        <label htmlFor="ingredient-category-filter" className="category-filter-label">Filter by Category:</label>
                        {isLoadingCategories ? (
                          <p className="loading-message">Loading categories...</p>
                        ) : categoriesError ? (
                          <p className="error-message">{categoriesError}</p>
                        ) : foodCategories.length > 0 ? (
                          <div className="category-selector">
                            <select
                              id="ingredient-category-filter"
                              multiple
                              value={selectedCategories.map(String)}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                                setSelectedCategories(selected);
                              }}
                              className="category-multiselect"
                              size={Math.min(foodCategories.length, 8)}
                            >
                              {foodCategories.map((category) => (
                                <option key={category.id} value={category.id.toString()}>
                                  {category.description}
                                </option>
                              ))}
                            </select>
                            {selectedCategories.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedCategories([])}
                                className="clear-categories-button"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <form onSubmit={handleIngredientSearch} className="search-form">
                        <input
                          type="text"
                          value={ingredientSearchQuery}
                          onChange={(e) => setIngredientSearchQuery(e.target.value)}
                          placeholder="Search for foods to add as ingredient..."
                          className="search-input"
                        />
                        <button type="submit" disabled={isSearchingIngredient} className="search-button">
                          {isSearchingIngredient ? 'Searching...' : 'Search'}
                        </button>
                      </form>

                      {ingredientSearchError && (
                        <p className="error-message">{ingredientSearchError}</p>
                      )}

                      {ingredientSearchResults.length > 0 && (
                        <div className="ingredient-search-results">
                          <ul className="food-results">
                            {ingredientSearchResults.map((food, index) => (
                              <li key={index} className="food-item">
                                <div className="food-description">{food.description}</div>
                                <div className="food-details">
                                  <span className="calorie-density">
                                    {food.calorie_density?.toFixed(1) || 'N/A'} kcal/g
                                  </span>
                                  <button
                                    onClick={() => handleSelectFoodForIngredient(food)}
                                    className="add-food-button"
                                    type="button"
                                  >
                                    Add
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="new-ingredient-form">
                      <div className="selected-food">
                        <strong>Selected Food:</strong> {newIngredient.food_description}
                        <button
                          onClick={() => {
                            setNewIngredient({
                              food_id: null,
                              food_description: '',
                              gram_weight: '',
                              quantity: '',
                              measure_unit_id: null
                            });
                          }}
                          className="change-food-button"
                          type="button"
                        >
                          Change
                        </button>
                      </div>

                      <form onSubmit={handleAddIngredient} className="ingredient-form">
                        <div className="form-group">
                          <label htmlFor="ingredient-gram-weight">Gram Weight (required):</label>
                          <input
                            id="ingredient-gram-weight"
                            type="number"
                            step="0.1"
                            min="0"
                            value={newIngredient.gram_weight}
                            onChange={(e) =>
                              setNewIngredient({ ...newIngredient, gram_weight: e.target.value })
                            }
                            className="form-input"
                            placeholder="Enter weight in grams"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="ingredient-quantity">Quantity (optional):</label>
                          <input
                            id="ingredient-quantity"
                            type="number"
                            step="0.1"
                            min="0"
                            value={newIngredient.quantity}
                            onChange={(e) =>
                              setNewIngredient({ ...newIngredient, quantity: e.target.value })
                            }
                            className="form-input"
                            placeholder="Enter quantity (optional)"
                          />
                        </div>

                        {ingredientCreateError && (
                          <p className="error-message">{ingredientCreateError}</p>
                        )}

                        <div className="form-actions">
                          <button
                            type="submit"
                            disabled={isCreatingIngredient || !newIngredient.gram_weight}
                            className="submit-button"
                          >
                            {isCreatingIngredient ? 'Adding...' : 'Add Ingredient'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewIngredient({
                                food_id: null,
                                food_description: '',
                                gram_weight: '',
                                quantity: '',
                                measure_unit_id: null
                              });
                              setIngredientCreateError(null);
                            }}
                            className="cancel-button"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main content - only show if no recipe is selected */}
      {!selectedRecipe && (
        <>
      <div className="recipe-section">
        {!showRecipeForm ? (
          <button
            onClick={() => setShowRecipeForm(true)}
            className="create-recipe-button"
          >
            Create New Recipe
          </button>
        ) : (
          <div className="recipe-form-container">
            <h2>Create New Recipe</h2>
            <form onSubmit={handleCreateRecipe} className="recipe-form">
              <div className="form-group">
                <label htmlFor="recipe-name">Recipe Name:</label>
                <input
                  id="recipe-name"
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter recipe name"
                />
              </div>
              {recipeError && (
                <p className="error-message">{recipeError}</p>
              )}
              {recipeSuccess && (
                <p className="success-message">{recipeSuccess}</p>
              )}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isCreatingRecipe}
                  className="submit-button"
                >
                  {isCreatingRecipe ? 'Creating...' : 'Create Recipe'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecipeForm(false);
                    setRecipeName('');
                    setRecipeError(null);
                    setRecipeSuccess(null);
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="recipes-section">
        <h2>My Recipes</h2>
        {isLoadingRecipes ? (
          <p className="loading-message">Loading recipes...</p>
        ) : recipesError ? (
          <p className="error-message">{recipesError}</p>
        ) : recipes.length === 0 ? (
          <p className="no-results">No recipes yet. Create your first recipe above!</p>
        ) : (
          <ul className="recipes-list">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="recipe-item">
                <button
                  onClick={() => handleRecipeClick(recipe)}
                  className="recipe-name-link"
                  type="button"
                >
                  {recipe.name}
                </button>
                {recipe.description && (
                  <div className="recipe-description">{recipe.description}</div>
                )}
                <div className="recipe-meta">
                  {recipe.servings && (
                    <span className="recipe-servings">{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                  )}
                  {recipe.total_time_minutes && (
                    <span className="recipe-time">{recipe.total_time_minutes} min</span>
                  )}
                  <span className="recipe-date">
                    Created: {new Date(recipe.created_at).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
        </>
      )}
    </div>
  );
}

export default App;
