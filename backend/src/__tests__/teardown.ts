import { Pool } from 'pg';

/**
 * Global teardown for Jest tests.
 * Drops the temporary test database created during setup.
 */
export default async function globalTeardown() {
  const testDbName = (global as any).__TEST_DB_NAME__;
  
  if (!testDbName) {
    console.warn('No test database name found, skipping teardown');
    return;
  }

  // Get the base DATABASE_URL from environment
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    console.warn('DATABASE_URL not set, cannot drop test database');
    return;
  }

  // Parse the DATABASE_URL to get connection details
  const url = new URL(baseUrl);
  const originalDbName = url.pathname.slice(1) || 'postgres';
  
  // Connect to the postgres database to drop the test database
  url.pathname = '/postgres';
  
  let adminPool: Pool | null = null;
  
  try {
    adminPool = new Pool({
      connectionString: url.toString(),
    });
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
    try {
      await adminPool.query('SELECT 1');
    } catch (err) {
      console.error('Failed to connect to database for teardown:', err);
      return;
    }
  }

  try {
    // Check if the test database exists
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [testDbName]
    );

    if (dbCheck.rowCount === 0) {
      console.log(`Test database ${testDbName} does not exist, skipping drop`);
      return;
    }

    // Terminate any active connections to the test database
    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `, [testDbName]);

    // Drop the test database
    await adminPool.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    console.log(`✓ Dropped test database: ${testDbName}`);
  } catch (error) {
    console.error(`Failed to drop test database ${testDbName}:`, error);
    // Don't throw - we don't want teardown failures to fail the test suite
  } finally {
    if (adminPool) {
      await adminPool.end();
    }
  }
}
