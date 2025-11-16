import request from 'supertest';
import app from '../../index';
import { query } from '../../db_connection';

export interface TestUser {
  email: string;
  username: string;
  password: string;
}

export interface TestUserSession {
  userId: number;
  sessionCookie: string;
}

/**
 * Creates a test user and returns user ID
 */
export async function createTestUser(user: TestUser): Promise<number> {
  const response = await request(app)
    .post('/api/users')
    .send(user)
    .expect(201);
  
  return response.body.id;
}

/**
 * Creates a test user and logs them in, returning session info
 */
export async function createTestUserSession(user: TestUser): Promise<TestUserSession> {
  const userId = await createTestUser(user);
  
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: user.password
    })
    .expect(200);
  
  const sessionCookie = loginResponse.headers['set-cookie']?.[0]?.split(';')[0] || '';
  
  return { userId, sessionCookie };
}

/**
 * Cleans up a test user by ID (cascades to recipes and ingredients)
 */
export async function cleanupTestUser(userId: number): Promise<void> {
  await query('DELETE FROM users WHERE id = $1', [userId]);
}

/**
 * Cleans up a test user by email (cascades to recipes and ingredients)
 */
export async function cleanupTestUserByEmail(email: string): Promise<void> {
  await query('DELETE FROM users WHERE email = $1', [email]);
}

/**
 * Creates a test food item and returns its ID
 */
export async function createTestFood(description: string, calorieDensity: number = 150.0): Promise<number> {
  const result = await query(
    `INSERT INTO foods (description, calorie_density)
     VALUES ($1, $2) RETURNING id`,
    [description, calorieDensity]
  );
  return result.rows[0].id;
}

/**
 * Cleans up a test food by ID
 */
export async function cleanupTestFood(foodId: number): Promise<void> {
  await query('DELETE FROM foods WHERE id = $1', [foodId]);
}

/**
 * Cleans up test foods by description pattern
 */
export async function cleanupTestFoodsByDescription(description: string): Promise<void> {
  await query('DELETE FROM foods WHERE description = $1', [description]);
}

/**
 * Generates a unique test user email
 */
export function generateTestUserEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generates a unique test food description
 */
export function generateTestFoodDescription(prefix: string = 'Test Food'): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Creates a test recipe and returns its ID
 */
export async function createTestRecipe(userId: number, name: string, options: {
  description?: string;
  instructions?: string;
  servings?: number;
  totalTimeMinutes?: number;
} = {}): Promise<number> {
  const { query } = await import('../../db_connection');
  const result = await query(
    `INSERT INTO recipes (user_id, name, description, instructions, servings, total_time_minutes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [userId, name, options.description, options.instructions, options.servings, options.totalTimeMinutes]
  );
  return result.rows[0].id;
}

/**
 * Cleans up a test recipe by ID
 */
export async function cleanupTestRecipe(recipeId: number): Promise<void> {
  const { query } = await import('../../db_connection');
  await query('DELETE FROM recipes WHERE id = $1', [recipeId]);
}

/**
 * Comprehensive cleanup for all test data created in a test
 */
export async function cleanupTestData(data: {
  users?: number[];
  foods?: number[];
  recipes?: number[];
} = {}): Promise<void> {
  const { query } = await import('../../db_connection');

  // Clean up in reverse dependency order
  if (data.recipes?.length) {
    for (const recipeId of data.recipes) {
      await query('DELETE FROM recipes WHERE id = $1', [recipeId]);
    }
  }

  if (data.foods?.length) {
    for (const foodId of data.foods) {
      await query('DELETE FROM foods WHERE id = $1', [foodId]);
    }
  }

  if (data.users?.length) {
    for (const userId of data.users) {
      await query('DELETE FROM users WHERE id = $1', [userId]);
    }
  }
}

