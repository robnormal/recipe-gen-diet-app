module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  moduleFileExtensions: ['ts', 'js'],
  globalSetup: '<rootDir>/src/__tests__/setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupFilesAfterEnv.ts'],
};
