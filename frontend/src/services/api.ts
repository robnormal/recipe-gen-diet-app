import {
  FoodCategory,
  FoodPortion,
  Ingredient,
  IngredientWithFood,
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

