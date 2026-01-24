import {
  FoodCategory,
  FoodDetail,
  FoodPortion,
  Ingredient,
  IngredientWithFood,
  MealPlan,
  MealPlansResponse,
  MealPlanRecipe,
  MealPlanWithRecipes,
  Recipe,
  RecipesResponse,
  User,
} from '../types';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const defaultHeaders = {
  'Content-Type': 'application/json',
};

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string') {
      return data.error;
    }
  } catch {
    // ignore
  }
  return 'Request failed';
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export async function checkAuthStatus(): Promise<User | null> {
  const response = await fetch('/api/auth/me', {
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  return handleResponse<User>(response);
}

export async function fetchCategories(): Promise<FoodCategory[]> {
  const response = await fetch('/api/foods/categories', {
    credentials: 'include',
  });

  const data = await handleResponse<{ categories: FoodCategory[] }>(response);
  return data.categories;
}

export async function fetchRecipes(limit = 100, offset = 0): Promise<Recipe[]> {
  const response = await fetch(`/api/recipes?limit=${limit}&offset=${offset}`, {
    credentials: 'include',
  });

  const data = await handleResponse<RecipesResponse>(response);
  return data.results;
}

export async function fetchRecipeDetails(recipeId: number): Promise<Recipe> {
  const response = await fetch(`/api/recipes/${recipeId}`, {
    credentials: 'include',
  });

  return handleResponse<Recipe>(response);
}

export async function updateRecipeDetails(
  recipeId: number,
  data: {
    name?: string;
    description?: string | null;
    instructions?: string | null;
    servings?: number | null;
    total_time_minutes?: number | null;
  }
): Promise<Recipe> {
  const response = await fetch(`/api/recipes/${recipeId}`, {
    method: 'PUT',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Recipe>(response);
}

export async function fetchIngredients(recipeId: number): Promise<IngredientWithFood[]> {
  const response = await fetch(`/api/recipes/${recipeId}/ingredients`, {
    credentials: 'include',
  });

  const data = await handleResponse<{ ingredients: IngredientWithFood[] }>(response);
  return data.ingredients;
}

export async function fetchFoodDetails(foodId: number): Promise<FoodDetail> {
  const response = await fetch(`/api/foods/${foodId}`, {
    credentials: 'include',
  });

  return handleResponse<FoodDetail>(response);
}

export async function fetchFoodPortions(foodId: number): Promise<FoodPortion[]> {
  const response = await fetch(`/api/foods/${foodId}/portions`, {
    credentials: 'include',
  });

  const data = await handleResponse<{ portions: FoodPortion[] }>(response);
  return data.portions;
}

export async function createIngredient(
  recipeId: number,
  ingredientData: {
    food_id: number;
    gram_weight: number;
    food_portion_id?: number | null;
    quantity?: number | null;
  }
): Promise<Ingredient> {
  const response = await fetch(`/api/recipes/${recipeId}/ingredients`, {
    method: 'POST',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify(ingredientData),
  });

  return handleResponse<Ingredient>(response);
}

export async function updateIngredient(
  recipeId: number,
  ingredientId: number,
  data: {
    food_id?: number;
    gram_weight?: number;
    food_portion_id?: number | null;
    quantity?: number | null;
  }
): Promise<Ingredient> {
  const response = await fetch(`/api/recipes/${recipeId}/ingredients/${ingredientId}`, {
    method: 'PUT',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Ingredient>(response);
}

export async function deleteIngredient(recipeId: number, ingredientId: number): Promise<void> {
  const response = await fetch(`/api/recipes/${recipeId}/ingredients/${ingredientId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new ApiError(message, response.status);
  }
}

// Meal Plan API functions
export async function fetchMealPlans(limit = 100, offset = 0): Promise<MealPlan[]> {
  const response = await fetch(`/api/meal-plans?limit=${limit}&offset=${offset}`, {
    credentials: 'include',
  });

  const data = await handleResponse<MealPlansResponse>(response);
  return data.results;
}

export async function fetchMealPlan(mealPlanId: number): Promise<MealPlanWithRecipes> {
  const response = await fetch(`/api/meal-plans/${mealPlanId}`, {
    credentials: 'include',
  });

  return handleResponse<MealPlanWithRecipes>(response);
}

export async function createMealPlan(data: {
  name: string;
  description?: string | null;
}): Promise<MealPlan> {
  const response = await fetch('/api/meal-plans', {
    method: 'POST',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<MealPlan>(response);
}

export async function updateMealPlan(
  mealPlanId: number,
  data: {
    name?: string;
    description?: string | null;
  }
): Promise<MealPlan> {
  const response = await fetch(`/api/meal-plans/${mealPlanId}`, {
    method: 'PUT',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<MealPlan>(response);
}

export async function deleteMealPlan(mealPlanId: number): Promise<void> {
  const response = await fetch(`/api/meal-plans/${mealPlanId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new ApiError(message, response.status);
  }
}

export async function addRecipeToMealPlan(
  mealPlanId: number,
  recipeId: number,
  quantity: number = 1.0
): Promise<MealPlanRecipe> {
  const response = await fetch(`/api/meal-plans/${mealPlanId}/recipes`, {
    method: 'POST',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify({ recipe_id: recipeId, quantity }),
  });

  return handleResponse<MealPlanRecipe>(response);
}

export async function updateMealPlanRecipe(
  mealPlanId: number,
  recipeId: number,
  quantity: number
): Promise<MealPlanRecipe> {
  const response = await fetch(`/api/meal-plans/${mealPlanId}/recipes/${recipeId}`, {
    method: 'PUT',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify({ quantity }),
  });

  return handleResponse<MealPlanRecipe>(response);
}

export async function removeRecipeFromMealPlan(mealPlanId: number, recipeId: number): Promise<void> {
  const response = await fetch(`/api/meal-plans/${mealPlanId}/recipes/${recipeId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new ApiError(message, response.status);
  }
}

