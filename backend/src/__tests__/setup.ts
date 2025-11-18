import { Pool } from 'pg';

// Generate a unique test database name
const TEST_DB_NAME = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Store the test database name globally so teardown can access it
(global as any).__TEST_DB_NAME__ = TEST_DB_NAME;

/**
 * Global setup for Jest tests.
 * Creates a temporary test database from the template_test_db template.
 */
export default async function globalSetup() {
  // Get the base DATABASE_URL from environment
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Parse the DATABASE_URL to get connection details
  const url = new URL(baseUrl);
  const originalDbName = url.pathname.slice(1) || 'postgres'; // Remove leading '/', default to 'postgres'
  
  // Create a connection URL to the postgres database
  // We need to connect to a database that exists to create a new one
  // Try 'postgres' first, fallback to the original database name
  url.pathname = '/postgres';
  
  // Create an admin pool to connect to postgres database
  let adminPool: Pool | null = null;
  
  try {
    adminPool = new Pool({
      connectionString: url.toString(),
    });

    // Test the connection
    await adminPool.query('SELECT 1');
  } catch (error) {
    // If connecting to 'postgres' fails, try the original database
    if (adminPool) {
      await adminPool.end();
    }
    url.pathname = `/${originalDbName}`;
    adminPool = new Pool({
      connectionString: url.toString(),
    });
    await adminPool.query('SELECT 1');
  }

  try {
    // Verify the template database exists
    const templateCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'template_test_db'"
    );
    
    if (templateCheck.rowCount === 0) {
      throw new Error(
        'template_test_db does not exist. Please ensure the Docker container has been built ' +
        'and the template database has been created.'
      );
    }

    // Create the test database from the template
    await adminPool.query(`CREATE DATABASE ${TEST_DB_NAME} WITH TEMPLATE template_test_db`);
    console.log(`✓ Created test database: ${TEST_DB_NAME}`);

    // Update the DATABASE_URL to point to the test database
    url.pathname = `/${TEST_DB_NAME}`;
    process.env.DATABASE_URL = url.toString();
    
    console.log(`✓ Test suite will use database: ${TEST_DB_NAME}`);
  } catch (error) {
    console.error('Failed to create test database:', error);
    throw error;
  } finally {
    if (adminPool) {
      await adminPool.end();
    }
  }
}
