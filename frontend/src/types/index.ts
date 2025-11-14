export interface FoodResult {
  id: number;
  description: string;
  calorie_density: number;
  rank: number;
}

export interface SearchResponse {
  results: FoodResult[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface UserRegistrationData {
  email: string;
  username: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Recipe {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  servings: number | null;
  total_time_minutes: number | null;
  calorie_density: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecipesResponse {
  results: Recipe[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface Ingredient {
  id: number;
  recipe_id: number;
  food_id: number;
  food_portion_id: number | null;
  quantity: number | null;
  gram_weight: number;
  created_at: string;
  updated_at: string;
}

export interface IngredientWithFood extends Ingredient {
  food_description: string;
  calorie_density: number | null;
  portion_amount: number | null;
  portion_modifier: string | null;
}

export interface FoodPortion {
  id: number;
  amount: number;
  modifier: string | null;
  gram_weight: number;
}

export interface FoodCategory {
  id: number;
  description: string;
}

export interface RecipeFormData {
  name: string;
  description: string;
  instructions: string;
  servings: string;
  total_time_minutes: string;
}

export interface IngredientFormState {
  food_id: number | null;
  food_description: string;
  gram_weight: string;
  quantity: string;
}

export type MeasurementType = 'grams' | 'portion' | null;

