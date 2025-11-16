import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Test database utilities
export class TestDatabase {
  private pool: Pool;
  private schemaPath: string;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.schemaPath = path.join(__dirname, '../../../schema.sql');
  }

  // Initialize database schema
  async initSchema(): Promise<void> {
    try {
      const schemaSQL = fs.readFileSync(this.schemaPath, 'utf8');

      // Split schema into individual statements and execute them
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          await this.pool.query(statement);
        }
      }

      console.log('Test database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize test database schema:', error);
      throw error;
    }
  }

  // Clean all data from tables (but keep schema)
  async cleanData(): Promise<void> {
    try {
      const tables = [
        'session',
        'ingredients',
        'recipes',
        'food_nutrients',
        'food_portions',
        'food_categories',
        'foods',
        'nutrients',
        'measure_units',
        'users'
      ];

      // Disable foreign key constraints temporarily
      await this.pool.query('SET CONSTRAINTS ALL DEFERRED');

      // Truncate all tables in reverse dependency order
      for (const table of tables) {
        await this.pool.query(`TRUNCATE TABLE ${table} CASCADE`);
      }

      // Re-enable constraints
      await this.pool.query('SET CONSTRAINTS ALL IMMEDIATE');

      console.log('Test database cleaned successfully');
    } catch (error) {
      console.error('Failed to clean test database:', error);
      throw error;
    }
  }

  // Reset database (drop and recreate schema)
  async reset(): Promise<void> {
    try {
      // Drop all tables if they exist
      const dropTablesSQL = `
        DROP TABLE IF EXISTS session CASCADE;
        DROP TABLE IF EXISTS ingredients CASCADE;
        DROP TABLE IF EXISTS recipes CASCADE;
        DROP TABLE IF EXISTS food_nutrients CASCADE;
        DROP TABLE IF EXISTS food_portions CASCADE;
        DROP TABLE IF EXISTS foods CASCADE;
        DROP TABLE IF EXISTS food_categories CASCADE;
        DROP TABLE IF EXISTS nutrients CASCADE;
        DROP TABLE IF EXISTS measure_units CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `;

      await this.pool.query(dropTablesSQL);
      await this.initSchema();
      console.log('Test database reset successfully');
    } catch (error) {
      console.error('Failed to reset test database:', error);
      throw error;
    }
  }

  // Close database connection
  async close(): Promise<void> {
    await this.pool.end();
  }

  // Get pool for direct queries if needed
  getPool(): Pool {
    return this.pool;
  }
}

// Global test database instance
let testDb: TestDatabase | null = null;

export function getTestDatabase(): TestDatabase {
  if (!testDb) {
    testDb = new TestDatabase();
  }
  return testDb;
}

// Jest setup and teardown helpers
export async function setupTestDatabase(): Promise<void> {
  const db = getTestDatabase();
  await db.reset();
}

export async function teardownTestDatabase(): Promise<void> {
  if (testDb) {
    await testDb.close();
    testDb = null;
  }
}
