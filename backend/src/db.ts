import { Pool } from 'pg';

// nutrient.number for calories (there's more than one possibility)
const CALORIE_NUTRIENT_NUMBERS = ['208'];

// Database connection configuration
function dbPool(): Pool {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'recipe_diet_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });
}

export { dbPool, CALORIE_NUTRIENT_NUMBERS };
