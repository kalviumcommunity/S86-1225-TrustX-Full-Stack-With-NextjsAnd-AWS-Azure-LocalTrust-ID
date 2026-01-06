/**
 * Jest Configuration for Integration Tests
 * 
 * Integration tests verify API routes, database interactions,
 * and middleware chains work correctly together.
 */

const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  displayName: 'integration',
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.js'],
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/integration/**/*.test.[jt]s?(x)',
    '**/*.integration.test.[jt]s?(x)',
  ],
  
  // Module path mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/app/api/**/*.{js,ts}',
    'src/lib/**/*.{js,ts}',
    '!src/lib/prisma.ts',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.stories.{js,ts,jsx,tsx}',
  ],
  
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 15,
      lines: 15,
      statements: 15,
    },
  },
  
  // Timeout for integration tests (longer than unit tests)
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

module.exports = createJestConfig(customJestConfig);
