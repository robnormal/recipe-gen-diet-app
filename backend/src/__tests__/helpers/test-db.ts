import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let pool: Pool;

export async function setupTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('NODE_ENV must be a test environment');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable must be set for tests');
  }

  // Parse the DB name from DATABASE_URL
  // Works for postgres://user:pass@host:port/dbname and similar URIs
  const dbNameMatch = process.env.DATABASE_URL.match(/\/([^/?]+)(\?|$)/);
  const dbName = dbNameMatch ? dbNameMatch[1] : '';
  if (!dbName.includes('_test')) {
    throw new Error(`Test database name (${dbName}) must include '_test'`);
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Drop and recreate the public schema
  await pool.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);

  const schema = fs.readFileSync(
    path.join(__dirname, '../../../../schema.sql'),
    'utf-8'
  );

  await pool.query(schema);
}

export async function teardownTestDatabase() {
  await pool.end();
}
