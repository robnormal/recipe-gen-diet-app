// Test setup file
// This file runs before all tests

// Environment variables are loaded via Node.js --env-file flag in package.json test script
// No manual .env parsing needed - Node.js handles it automatically

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-for-testing-only';

// Verify DATABASE_URL is set
if (!process.env.TEST_DATABASE_URL) {
  console.warn('Warning: TEST_DATABASE_URL not found in environment variables. Tests may fail.');
  console.warn('Please ensure TEST_DATABASE_URL is set in .env file or environment variables.');
}

// Override DATABASE_URL for tests to use test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// Increase timeout for database operations
jest.setTimeout(30000); // Increased timeout for database setup

// Import test database utilities
import { setupTestDatabase, teardownTestDatabase } from './helpers/test-db';

// Setup test database before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Clean up after all tests
afterAll(async () => {
  await teardownTestDatabase();
});

