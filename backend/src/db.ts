import { Pool } from 'pg';

// nutrient.number for calories (there's more than one possibility)
const CALORIE_NUTRIENT_NUMBERS = ['208'];

// Database connection configuration
const dbPool = (function() {
  let pool: Pool;

  return function dbPool(): Pool {
    if (!pool) {
      pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'recipe_diet_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
      });
    }

    return pool;
  }
})();

// Food search functions
export async function searchFoods(words: string[], limit: number, offset: number) {
  const pool = dbPool();
  try {
    // Create search query using ts_query (handles multiple words)
    const searchQuery = words.join(' & ');

    const result = await pool.query(
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

    const countResult = await pool.query(
      `SELECT COUNT(*) 
       FROM foods 
       WHERE to_tsvector('english', description) @@ plainto_tsquery('english', $1)`,
      [q]
    );

    return {
      results: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  } finally {
    await pool.end();
  }
}

// Recipe CRUD functions
export async function listRecipes(userId: number, limit: number, offset: number) {
  const pool = dbPool();
  try {
    const listResult = await pool.query(
      `SELECT id, user_id, name, description, instructions, servings, total_time_minutes,
              created_at, updated_at
       FROM recipes
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM recipes WHERE user_id = $1`,
      [userId]
    );

    return {
      results: listResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  } finally {
    await pool.end();
  }
}

export async function getRecipeById(id: number) {
  const pool = dbPool();
  try {
    const result = await pool.query(
      `SELECT id, user_id, name, description, instructions, servings, total_time_minutes,
              created_at, updated_at
       FROM recipes WHERE id = $1`,
      [id]
    );
    return result.rowCount === 0 ? null : result.rows[0];
  } finally {
    await pool.end();
  }
}

export async function createRecipe(
  user_id: number,
  name: string,
  description: string | null,
  instructions: string | null,
  servings: number | null,
  total_time_minutes: number | null
) {
  const pool = dbPool();
  try {
    const result = await pool.query(
      `INSERT INTO recipes (user_id, name, description, instructions, servings, total_time_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, name, description, instructions, servings, total_time_minutes,
                 created_at, updated_at`,
      [user_id, name, description, instructions, servings, total_time_minutes]
    );
    return result.rows[0];
  } finally {
    await pool.end();
  }
}

export async function updateRecipe(
  id: number,
  name: string | null,
  description: string | null,
  instructions: string | null,
  servings: number | null,
  total_time_minutes: number | null
) {
  const pool = dbPool();
  try {
    const result = await pool.query(
      `UPDATE recipes SET
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
  } finally {
    await pool.end();
  }
}

export async function deleteRecipe(id: number) {
  const pool = dbPool();
  try {
    const result = await pool.query(`DELETE FROM recipes WHERE id = $1 RETURNING id`, [id]);
    return result.rowCount !== 0;
  } finally {
    await pool.end();
  }
}

export { dbPool, CALORIE_NUTRIENT_NUMBERS };
