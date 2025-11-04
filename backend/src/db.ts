import {query, withClient} from './db_connection';

// nutrient.number for calories (there's more than one possibility)
export const CALORIE_NUTRIENT_NUMBERS = ['208'];

// Food search functions
export async function searchFoods(words: string[], limit: number, offset: number) {
  return withClient(async client => {
    // Create search query using ts_query (handles multiple words)
    const searchQuery = words.join(' & ');

    const result = await client.query(
      `SELECT
         f.description, f.calorie_density,
         ts_rank(to_tsvector('english', f.description),
                 plainto_tsquery('english', $1)) as rank
     FROM foods f
     WHERE to_tsvector('english', f.description) @@ plainto_tsquery('english', $1)
     ORDER BY rank DESC, f.description
     LIMIT $2 OFFSET $3`,
      [searchQuery, limit, offset]
    );

    const countResult = await client.query(
      `SELECT COUNT(*)
     FROM foods
     WHERE to_tsvector('english', description) @@ plainto_tsquery('english', $1)`,
      [searchQuery]
    );

    return {
      results: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  });
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
  measure_unit_id: number | null = null,
  quantity: number | null = null
) {
  const result = await query(
    `INSERT INTO ingredients (recipe_id, food_id, measure_unit_id, quantity, gram_weight)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, recipe_id, food_id, measure_unit_id, quantity, gram_weight,
         created_at, updated_at`,
    [recipe_id, food_id, measure_unit_id, quantity, gram_weight]
  );
  return result.rows[0];
}

export async function getIngredientById(id: number) {
  const result = await query(
    `SELECT id, recipe_id, food_id, measure_unit_id, quantity, gram_weight,
            created_at, updated_at
     FROM ingredients WHERE id = $1`,
    [id]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function getIngredientsByRecipeId(recipe_id: number) {
  const result = await query(
    `SELECT id, recipe_id, food_id, measure_unit_id, quantity, gram_weight,
              created_at, updated_at
       FROM ingredients
       WHERE recipe_id = $1
       ORDER BY id`,
    [recipe_id]
  );
  return result.rows;
}

export async function updateIngredient(
  id: number,
  food_id: number | null = null,
  gram_weight: number | null = null,
  measure_unit_id: number | null = null,
  quantity: number | null = null
) {
  const result = await query(
    `UPDATE ingredients
     SET
         food_id = COALESCE($2, food_id),
         gram_weight = COALESCE($3, gram_weight),
         measure_unit_id = COALESCE($4, measure_unit_id),
         quantity = COALESCE($5, quantity),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, recipe_id, food_id, measure_unit_id, quantity, gram_weight,
         created_at, updated_at`,
    [id, food_id, gram_weight, measure_unit_id, quantity]
  );
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function deleteIngredient(id: number) {
  const result = await query(`DELETE FROM ingredients WHERE id = $1 RETURNING id`, [id]);
  return result.rowCount !== 0;
}
