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
  nutrients?: FoodNutrient[];
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
  portion_gram_weight: number | null;
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
  emoji: string | null;
}

export type RecipeEditableField =
  | 'name'
  | 'description'
  | 'instructions'
  | 'servings'
  | 'total_time_minutes';

export type RecipeEditableValue = string | number | null;

export interface RecipeUpdateData {
  name?: string;
  description?: string | null;
  instructions?: string | null;
  servings?: number | null;
  total_time_minutes?: number | null;
}

export interface IngredientFormState {
  food_id: number | null;
  food_description: string;
  gram_weight: string;
  quantity: string;
}

export type MeasurementType = 'grams' | 'portion' | null;

export interface FoodNutrient {
  id: number;
  name: string;
  unit: string | null;
  amount: number;
  rank: number | null;
  rda_percent: number | null;
  number?: string;
}

export interface FoodDetail {
  id: number;
  description: string;
  calorie_density: number | null;
  nutrients: FoodNutrient[];
}

export interface MealPlan {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealPlansResponse {
  results: MealPlan[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface MealPlanRecipe {
  id: number;
  meal_plan_id: number;
  recipe_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  recipe_name: string;
  recipe_description: string | null;
  recipe_total_weight: number;
  recipe_calorie_density: number | null;
}

export interface MealPlanWithRecipes extends MealPlan {
  recipes: MealPlanRecipe[];
  nutrients: FoodNutrient[];
  calorie_density: number | null;
}
