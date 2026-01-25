import {query, withClient} from './db_connection';
import bcrypt from 'bcryptjs';

// nutrient.number for calories (there's more than one possibility)
export const CALORIE_NUTRIENT_NUMBERS = ['208'];

// Ordered list of nutrient numbers to display in food details
export const DISPLAY_NUTRIENT_NUMBERS = ['208','203','205','291','204','601','320','401','328','323','430','417','406','415','418','301','303','304','306','307','309','305','317','312','315','851','629','621','631','852'];

// Food search functions
export async function searchFoods(words: string[], limit: number, offset: number, categoryIds: number[] | null = null) {
  return withClient(async client => {
    // Create search query using ts_query (handles multiple words)
    const searchQuery = words.join(' & ');

    // Build query with optional category filter
    let categoryFilter = '';
    const queryParams: (string | number | number[])[] = [searchQuery, limit, offset];
    let countFilter = '';
    const countParams: (string | number[])[] = [searchQuery];

    if (categoryIds && categoryIds.length > 0) {
      categoryFilter = 'AND f.food_category_id = ANY($4)';
      queryParams.push(categoryIds);

      // For count, $2 should be used for the categories instead of $4
      countFilter = 'AND f.food_category_id = ANY($2)';
      countParams.push(categoryIds);
    }

    const result = await client.query(
      `SELECT
         f.id, f.description, f.calorie_density,
         ts_rank(to_tsvector('english', f.description),
                 plainto_tsquery('english', $1)) as rank
     FROM foods f
     WHERE to_tsvector('english', f.description) @@ plainto_tsquery('english', $1)
       ${categoryFilter}
     ORDER BY rank DESC, f.description
     LIMIT $2 OFFSET $3`,
      queryParams
    );

    const countResult = await client.query(
      `SELECT COUNT(*)
     FROM foods f
     WHERE to_tsvector('english', f.description) @@ plainto_tsquery('english', $1)
       ${countFilter}`,
      countParams
    );

    return {
      results: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  });
}

// Food category functions
export async function listFoodCategories() {
  const result = await query(
    `SELECT id, description, emoji
     FROM food_categories
     ORDER BY description`,
    []
  );
  return result.rows;
}

// Food portion functions
export async function checkFoodExists(id: number): Promise<boolean> {
  const result = await query(`SELECT 1 FROM foods WHERE id = $1`, [id]);
  return !!result.rowCount;
}

export async function getFoodPortions(food_id: number) {
  const result = await query(
    `SELECT fp.id, fp.amount, fp.modifier, fp.gram_weight
     FROM food_portions fp
     WHERE fp.food_id = $1
     ORDER BY COALESCE(fp.sequence_number, 999999), fp.amount`,
    [food_id]
  );
  return result.rows;
}

export async function getFoodById(id: number) {
  const result = await query(
    `SELECT id, description, calorie_density
     FROM foods
     WHERE id = $1`,
    [id]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function getFoodDetailsWithNutrients(id: number) {
  // Get food basic info
  const foodResult = await query(
    `SELECT id, description, calorie_density
     FROM foods
     WHERE id = $1`,
    [id]
  );
  
  if (foodResult.rowCount === 0) {
    return null;
  }

  const food = foodResult.rows[0];

  // Get all nutrients for this food, filtered and ordered by the display list
  // Join with nutrient_rdas to calculate RDA percentages
  const nutrientsResult = await query(
    `SELECT 
       n.id,
       n.name,
       n.unit_name,
       n.rank,
       n.number,
       fn.amount,
       rda.adult_rda_value,
       CASE
         WHEN rda.adult_rda_value IS NOT NULL AND rda.adult_rda_value > 0 THEN
           (fn.amount / rda.adult_rda_value * 100)
         ELSE NULL
       END as rda_percent
     FROM food_nutrients fn
     JOIN nutrients n ON fn.nutrient_id = n.id
     LEFT JOIN nutrient_rdas rda ON n.number = rda.nutrient_number
     WHERE fn.food_id = $1
       AND n.number = ANY($2::varchar[])
     ORDER BY array_position($2::varchar[], n.number)`,
    [id, DISPLAY_NUTRIENT_NUMBERS]
  );

  return {
    id: food.id,
    description: food.description,
    calorie_density: food.calorie_density,
    nutrients: nutrientsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      unit: row.unit_name,
      amount: row.amount,
      rank: row.rank,
      rda_percent: row.rda_percent !== null ? parseFloat(row.rda_percent) : null,
    })),
  };
}

// User functions
export async function createUser(
  email: string,
  username: string,
  password: string
) {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (email, username, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, username, created_at, updated_at`,
    [email, username, passwordHash]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await query(
    `SELECT id, email, username, password_hash, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function getUserById(id: number) {
  const result = await query(
    `SELECT id, email, username, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  // Return user without password_hash
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

// Recipe CRUD functions
export async function listRecipes(userId: number, limit: number, offset: number) {
  const listResult = await query(
    `SELECT id, user_id, name, description, instructions, servings, total_time_minutes,
            created_at, updated_at
     FROM recipes
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM recipes WHERE user_id = $1`,
    [userId]
  );

  return {
    results: listResult.rows,
    total: parseInt(countResult.rows[0].count)
  };
}

export async function getRecipeById(id: number) {
  const result = await query(
    `SELECT id, user_id, name, description, instructions, servings, total_time_minutes,
            created_at, updated_at
     FROM recipes WHERE id = $1`,
    [id]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function createRecipe(
  user_id: number,
  name: string,
  description: string | null,
  instructions: string | null,
  servings: number | null,
  total_time_minutes: number | null
) {
  const result = await query(
    `INSERT INTO recipes (user_id, name, description, instructions, servings, total_time_minutes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, name, description, instructions, servings, total_time_minutes,
         created_at, updated_at`,
    [user_id, name, description, instructions, servings, total_time_minutes]
  );
  return result.rows[0];
}

export async function updateRecipe(
  id: number,
  name: string | null,
  description: string | null,
  instructions: string | null,
  servings: number | null,
  total_time_minutes: number | null
) {
  const result = await query(
    `UPDATE recipes
     SET
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         instructions = COALESCE($4, instructions),
         servings = COALESCE($5, servings),
         total_time_minutes = COALESCE($6, total_time_minutes),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, name, description, instructions, servings, total_time_minutes,
         created_at, updated_at`,
    [id, name, description, instructions, servings, total_time_minutes]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function deleteRecipe(id: number) {
  const result = await query(`DELETE FROM recipes WHERE id = $1 RETURNING id`, [id]);
  return result.rowCount !== 0;
}

// Ingredient functions
export async function createIngredient(
  recipe_id: number,
  food_id: number,
  gram_weight: number,
  food_portion_id: number | null = null,
  quantity: number | null = null
) {
  const result = await query(
    `INSERT INTO ingredients (recipe_id, food_id, food_portion_id, quantity, gram_weight)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, recipe_id, food_id, food_portion_id, quantity, gram_weight,
         created_at, updated_at`,
    [recipe_id, food_id, food_portion_id, quantity, gram_weight]
  );
  return result.rows[0];
}

export async function getIngredientById(id: number) {
  const result = await query(
    `SELECT id, recipe_id, food_id, food_portion_id, quantity, gram_weight,
            created_at, updated_at
     FROM ingredients WHERE id = $1`,
    [id]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function getIngredientsByRecipeId(recipe_id: number) {
  const result = await query(
    `SELECT id, recipe_id, food_id, food_portion_id, quantity, gram_weight,
              created_at, updated_at
       FROM ingredients
       WHERE recipe_id = $1
       ORDER BY id`,
    [recipe_id]
  );
  return result.rows;
}

export async function getIngredientsWithFoods(recipe_id: number) {
  const result = await query(
    `SELECT i.id, i.recipe_id, i.food_id, i.food_portion_id, i.quantity, i.gram_weight,
              i.created_at, i.updated_at, f.description as food_description, f.calorie_density,
              fp.amount as portion_amount, fp.modifier as portion_modifier, fp.gram_weight as portion_gram_weight
       FROM ingredients i
       JOIN foods f ON i.food_id = f.id
       LEFT JOIN food_portions fp ON i.food_portion_id = fp.id
       WHERE i.recipe_id = $1
       ORDER BY i.id`,
    [recipe_id]
  );
  return result.rows;
}

export async function updateIngredient(
  id: number,
  food_id: number | null = null,
  gram_weight: number | null = null,
  food_portion_id: number | null = null,
  quantity: number | null = null
) {
  const result = await query(
    `UPDATE ingredients
     SET
         food_id = COALESCE($2, food_id),
         gram_weight = COALESCE($3, gram_weight),
         food_portion_id = COALESCE($4, food_portion_id),
         quantity = COALESCE($5, quantity),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, recipe_id, food_id, food_portion_id, quantity, gram_weight,
         created_at, updated_at`,
    [id, food_id, gram_weight, food_portion_id, quantity]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function deleteIngredient(id: number) {
  const result = await query(`DELETE FROM ingredients WHERE id = $1 RETURNING id`, [id]);
  return result.rowCount !== 0;
}

// Calculate recipe calorie density
export async function calculateRecipeCalorieDensity(recipe_id: number): Promise<number | null> {
  const result = await query(
    `SELECT
       CASE
         WHEN SUM(i.gram_weight) > 0 THEN
           SUM(f.calorie_density * i.gram_weight) / SUM(i.gram_weight)
         ELSE 0
       END as calorie_density
     FROM ingredients i
     JOIN foods f ON i.food_id = f.id
     WHERE i.recipe_id = $1
       AND f.calorie_density IS NOT NULL`,
    [recipe_id]
  );
  return result.rows[0]?.calorie_density ?? null;
}

// Meal Plan CRUD functions
export async function listMealPlans(userId: number, limit: number, offset: number) {
  const listResult = await query(
    `SELECT id, user_id, name, description, created_at, updated_at
     FROM meal_plans
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM meal_plans WHERE user_id = $1`,
    [userId]
  );

  return {
    results: listResult.rows,
    total: parseInt(countResult.rows[0].count)
  };
}

export async function getMealPlanById(id: number) {
  const result = await query(
    `SELECT id, user_id, name, description, created_at, updated_at
     FROM meal_plans WHERE id = $1`,
    [id]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function createMealPlan(
  user_id: number,
  name: string,
  description: string | null
) {
  const result = await query(
    `INSERT INTO meal_plans (user_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, name, description, created_at, updated_at`,
    [user_id, name, description]
  );
  return result.rows[0];
}

export async function updateMealPlan(
  id: number,
  name: string | null,
  description: string | null
) {
  const result = await query(
    `UPDATE meal_plans
     SET
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, name, description, created_at, updated_at`,
    [id, name, description]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function deleteMealPlan(id: number) {
  const result = await query(`DELETE FROM meal_plans WHERE id = $1 RETURNING id`, [id]);
  return result.rowCount !== 0;
}

// Meal Plan Recipe functions
export async function addRecipeToMealPlan(
  meal_plan_id: number,
  recipe_id: number,
  quantity: number = 1.0
) {
  const result = await query(
    `INSERT INTO meal_plan_recipes (meal_plan_id, recipe_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (meal_plan_id, recipe_id) DO UPDATE SET
         quantity = $3,
         updated_at = NOW()
     RETURNING id, meal_plan_id, recipe_id, quantity, created_at, updated_at`,
    [meal_plan_id, recipe_id, quantity]
  );
  return result.rows[0];
}

export async function updateMealPlanRecipeQuantity(
  meal_plan_id: number,
  recipe_id: number,
  quantity: number
) {
  const result = await query(
    `UPDATE meal_plan_recipes
     SET quantity = $3, updated_at = NOW()
     WHERE meal_plan_id = $1 AND recipe_id = $2
     RETURNING id, meal_plan_id, recipe_id, quantity, created_at, updated_at`,
    [meal_plan_id, recipe_id, quantity]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function removeRecipeFromMealPlan(meal_plan_id: number, recipe_id: number) {
  const result = await query(
    `DELETE FROM meal_plan_recipes WHERE meal_plan_id = $1 AND recipe_id = $2 RETURNING id`,
    [meal_plan_id, recipe_id]
  );
  return result.rowCount !== 0;
}

export async function getMealPlanRecipes(meal_plan_id: number) {
  const result = await query(
    `SELECT mpr.id, mpr.meal_plan_id, mpr.recipe_id, mpr.quantity, mpr.created_at, mpr.updated_at,
            r.name as recipe_name, r.description as recipe_description,
            COALESCE(recipe_stats.recipe_total_weight, 0) as recipe_total_weight,
            recipe_stats.recipe_calorie_density
     FROM meal_plan_recipes mpr
     JOIN recipes r ON mpr.recipe_id = r.id
     LEFT JOIN (
       SELECT 
         r.id as recipe_id,
         COALESCE(SUM(i.gram_weight), 0) as recipe_total_weight,
         CASE
           WHEN SUM(i.gram_weight) > 0 THEN
             SUM(f.calorie_density * i.gram_weight) / SUM(i.gram_weight)
           ELSE NULL
         END as recipe_calorie_density
       FROM recipes r
       LEFT JOIN ingredients i ON r.id = i.recipe_id
       LEFT JOIN foods f ON i.food_id = f.id AND f.calorie_density IS NOT NULL
       GROUP BY r.id
     ) recipe_stats ON mpr.recipe_id = recipe_stats.recipe_id
     WHERE mpr.meal_plan_id = $1
     ORDER BY mpr.id`,
    [meal_plan_id]
  );
  return result.rows.map(row => ({
    ...row,
    recipe_total_weight: parseFloat(row.recipe_total_weight),
    recipe_calorie_density: row.recipe_calorie_density !== null ? parseFloat(row.recipe_calorie_density) : null,
  }));
}

// Calculate recipe nutrient totals
export async function calculateRecipeNutrients(recipe_id: number) {
  // Get all ingredients for the recipe with their gram weights
  // For each ingredient, get nutrients from the food
  // Scale nutrients: (nutrient.amount / 100) * ingredient.gram_weight
  // Sum all nutrients by nutrient_id
  const result = await query(
    `SELECT 
       n.id,
       n.name,
       n.unit_name,
       n.rank,
       n.number,
       SUM((fn.amount / 100.0) * i.gram_weight) as total_amount,
       rda.adult_rda_value,
       CASE
         WHEN rda.adult_rda_value IS NOT NULL AND rda.adult_rda_value > 0 THEN
           (SUM((fn.amount / 100.0) * i.gram_weight) / rda.adult_rda_value * 100)
         ELSE NULL
       END as rda_percent
     FROM ingredients i
     JOIN foods f ON i.food_id = f.id
     JOIN food_nutrients fn ON f.id = fn.food_id
     JOIN nutrients n ON fn.nutrient_id = n.id
     LEFT JOIN nutrient_rdas rda ON n.number = rda.nutrient_number
     WHERE i.recipe_id = $1
       AND n.number = ANY($2::varchar[])
     GROUP BY n.id, n.name, n.unit_name, n.rank, n.number, rda.adult_rda_value
     ORDER BY array_position($2::varchar[], n.number)`,
    [recipe_id, DISPLAY_NUTRIENT_NUMBERS]
  );

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    unit: row.unit_name,
    amount: parseFloat(row.total_amount),
    rank: row.rank,
    rda_percent: row.rda_percent !== null ? parseFloat(row.rda_percent) : null,
  }));
}

// Calculate meal plan nutrient totals
export async function calculateMealPlanNutrients(meal_plan_id: number) {
  // Get all recipes in the meal plan with their quantities
  // For each recipe, get all ingredients with their gram weights
  // For each ingredient, get nutrients from the food
  // Scale nutrients: (nutrient.amount / 100) * ingredient.gram_weight * recipe.quantity
  // Sum all nutrients by nutrient_id
  const result = await query(
    `SELECT 
       n.id,
       n.name,
       n.unit_name,
       n.rank,
       n.number,
       SUM((fn.amount / 100.0) * i.gram_weight * mpr.quantity) as total_amount,
       rda.adult_rda_value,
       CASE
         WHEN rda.adult_rda_value IS NOT NULL AND rda.adult_rda_value > 0 THEN
           (SUM((fn.amount / 100.0) * i.gram_weight * mpr.quantity) / rda.adult_rda_value * 100)
         ELSE NULL
       END as rda_percent
     FROM meal_plan_recipes mpr
     JOIN ingredients i ON mpr.recipe_id = i.recipe_id
     JOIN foods f ON i.food_id = f.id
     JOIN food_nutrients fn ON f.id = fn.food_id
     JOIN nutrients n ON fn.nutrient_id = n.id
     LEFT JOIN nutrient_rdas rda ON n.number = rda.nutrient_number
     WHERE mpr.meal_plan_id = $1
       AND n.number = ANY($2::varchar[])
     GROUP BY n.id, n.name, n.unit_name, n.rank, n.number, rda.adult_rda_value
     ORDER BY array_position($2::varchar[], n.number)`,
    [meal_plan_id, DISPLAY_NUTRIENT_NUMBERS]
  );

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    unit: row.unit_name,
    amount: parseFloat(row.total_amount),
    rank: row.rank,
    rda_percent: row.rda_percent !== null ? parseFloat(row.rda_percent) : null,
  }));
}

// Calculate meal plan calorie density
export async function calculateMealPlanCalorieDensity(meal_plan_id: number): Promise<number | null> {
  // Calculate weighted average of recipe calorie densities based on recipe quantities
  // First, get calorie density for each recipe
  // Then calculate weighted average: sum(calorie_density * total_gram_weight * quantity) / sum(total_gram_weight * quantity)
  const result = await query(
    `SELECT
       CASE
         WHEN SUM(recipe_total_weight * mpr.quantity) > 0 THEN
           SUM(recipe_calorie_density * recipe_total_weight * mpr.quantity) / SUM(recipe_total_weight * mpr.quantity)
         ELSE 0
       END as calorie_density
     FROM meal_plan_recipes mpr
     JOIN (
       SELECT 
         r.id as recipe_id,
         COALESCE(SUM(i.gram_weight), 0) as recipe_total_weight,
         CASE
           WHEN SUM(i.gram_weight) > 0 THEN
             SUM(f.calorie_density * i.gram_weight) / SUM(i.gram_weight)
           ELSE NULL
         END as recipe_calorie_density
       FROM recipes r
       LEFT JOIN ingredients i ON r.id = i.recipe_id
       LEFT JOIN foods f ON i.food_id = f.id AND f.calorie_density IS NOT NULL
       GROUP BY r.id
     ) recipe_stats ON mpr.recipe_id = recipe_stats.recipe_id
     WHERE mpr.meal_plan_id = $1
       AND recipe_stats.recipe_calorie_density IS NOT NULL`,
    [meal_plan_id]
  );
  return result.rows[0]?.calorie_density ?? null;
}
