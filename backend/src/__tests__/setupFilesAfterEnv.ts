/**
 * Setup file that runs after the test environment is set up.
 * This ensures the database connection pool is reset to use the test database.
 * 
 * This runs after globalSetup has set DATABASE_URL, so we clear any cached
 * pool to force a new connection with the test database.
 */

// Clear the global pool cache to ensure we use the test database
// This must be done before any test files import db_connection
if ((global as any).__PG_POOL__) {
  // End the existing pool if it exists
  (global as any).__PG_POOL__.end().catch(() => {
    // Ignore errors when ending the pool
  });
  delete (global as any).__PG_POOL__;
}
