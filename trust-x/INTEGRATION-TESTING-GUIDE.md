# Integration Testing Guide

## Overview

This guide explains how to set up and run integration tests for the TrustX API routes. Integration tests verify that different parts of the application work together correctly, including:

- Authentication flows
- API route handlers  
- Database interactions
- Middleware chains
- Caching behavior
- RBAC enforcement

## Prerequisites

### 1. Test Database Setup

Integration tests require a separate PostgreSQL database for testing. Set this up by:

```bash
# Create test database
createdb trustx_test

# Run migrations on test database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trustx_test" npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Redis Test Instance

Tests use Redis database index 1 (separate from development):

```bash
# Ensure Redis is running
redis-cli ping

# Test database connection
redis-cli -n 1 ping
```

### 3. Environment Variables

Create a `.env.test` file for test-specific configuration:

```env
# Test Database
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trustx_test

# Test Secrets
JWT_SECRET=test-jwt-secret-key-for-integration-tests
REFRESH_TOKEN_SECRET=test-refresh-token-secret-key

# Test Redis
REDIS_URL=redis://localhost:6379/1

# Disable external services in tests  
SENDGRID_API_KEY=test-key
AWS_ACCESS_KEY_ID=test-key
AWS_SECRET_ACCESS_KEY=test-secret
AZURE_STORAGE_CONNECTION_STRING=test-connection
```

## Running Integration Tests

### Run all integration tests
```bash
npm run test:integration
```

### Run with file watcher (development)
```bash
npm run test:integration:watch
```

### Run with coverage report
```bash
npm run test:integration:coverage
```

### Run specific test file
```bash
npm run test:integration -- auth.test.ts
```

### Run all tests (unit + integration)
```bash
npm run test:all
```

## Writing Integration Tests

### Test Structure

Integration tests follow this pattern:

```typescript
import { POST as handler } from '@/app/api/endpoint/route';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

describe('API Endpoint Integration Tests', () => {
  // Setup test data before all tests
  beforeAll(async () => {
    await prisma.user.create({
      data: { /* test user */ }
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('HTTP Method /endpoint', () => {
    it('should handle valid request', async () => {
      const request = new Request('http://localhost:3000/api/endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ /* payload */ }),
      });

      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
```

### Testing Authentication

```typescript
// Generate JWT token for testing
const token = jwt.sign(
  { userId: '123', email: 'test@test.com', role: 'USER' },
  process.env.JWT_SECRET!,
  { expiresIn: '1h' }
);

// Add to request headers
headers: {
  Authorization: `Bearer ${token}`,
}

// Or as cookie
headers: {
  Cookie: `accessToken=${token}`,
}
```

### Testing Database Interactions

```typescript
// Create test data
const user = await prisma.user.create({
  data: {
    name: 'Test User',
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
  },
});

// Query in test
const found = await prisma.user.findUnique({
  where: { id: user.id },
});

expect(found).toBeDefined();
expect(found!.email).toBe('test@example.com');

// Clean up
await prisma.user.delete({
  where: { id: user.id },
});
```

### Testing RBAC

```typescript
// Test as regular user
const userToken = jwt.sign(
  { userId: 'user-123', role: 'USER' },
  process.env.JWT_SECRET!
);

const request1 = new Request('http://localhost:3000/api/admin/users', {
  headers: { Authorization: `Bearer ${userToken}` },
});

const response1 = await handler(request1);
expect(response1.status).toBe(403); // Forbidden

// Test as admin
const adminToken = jwt.sign(
  { userId: 'admin-123', role: 'ADMIN' },
  process.env.JWT_SECRET!
);

const request2 = new Request('http://localhost:3000/api/admin/users', {
  headers: { Authorization: `Bearer ${adminToken}` },
});

const response2 = await handler(request2);
expect(response2.status).toBe(200); // Success
```

### Testing Error Handling

```typescript
it('should validate required fields', async () => {
  const request = new Request('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* missing required fields */ }),
  });

  const response = await handler(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.success).toBe(false);
  expect(data.message).toContain('validation');
});
```

## Test Organization

### Directory Structure

```
__tests__/
├── integration/
│   ├── auth.test.ts         # Authentication flows
│   ├── users.test.ts        # User CRUD operations  
│   ├── middleware.test.ts   # Middleware testing
│   └── ...
└── unit/
    ├── lib/                 # Utility function tests
    └── components/          # Component tests
```

### Test File Naming

- **auth.test.ts** - Authentication endpoints (/api/auth/*)
- **users.test.ts** - User management (/api/users/*)
- **middleware.test.ts** - Middleware functionality
- **[feature].test.ts** - Feature-specific tests

## Configuration Files

### jest.integration.config.js

Integration test configuration:

- **Test environment**: `node` (not jsdom)
- **Test pattern**: `**/__tests__/integration/**/*.test.[jt]s?(x)`
- **Coverage threshold**: 70% (all metrics)
- **Test timeout**: 30000ms (30 seconds)
- **Collect coverage from**: `src/app/api/**` and `src/lib/**`

### jest.integration.setup.js

Test environment setup:

- Sets test environment variables
- Mocks external services (SendGrid, AWS S3, Azure Blob)
- Suppresses console output
- Provides helper functions (`mockRequest`, `mockResponse`)
- Configures test database

## Mocked External Services

Integration tests mock external services to avoid real API calls:

### SendGrid Email
```typescript
jest.mock('@sendgrid/mail');
// Mocks: setApiKey(), send()
```

### AWS S3
```typescript
jest.mock('@aws-sdk/client-s3');
// Mocks: S3Client, PutObjectCommand, GetObjectCommand
```

### Azure Blob Storage
```typescript
jest.mock('@azure/storage-blob');
// Mocks: BlobServiceClient, upload, download
```

## Coverage Requirements

Integration tests have a **70% coverage threshold** for:

- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

Lower than unit tests (80%) due to integration complexity and infrastructure dependencies.

## Troubleshooting

### Database Connection Errors

```bash
# Verify test database exists
psql -l | grep trustx_test

# If not, create it
createdb trustx_test

# Run migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trustx_test" npx prisma migrate deploy
```

### Redis Connection Errors

```bash
# Check Redis is running
redis-cli ping

# Check test database
redis-cli -n 1 ping

# Start Redis if needed
redis-server
```

### Prisma Client Errors

```bash
# Regenerate Prisma client
npx prisma generate

# Reset test database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trustx_test" npx prisma migrate reset --force
```

### Test Timeout Errors

If tests timeout (default 30s), increase in jest.integration.config.js:

```javascript
module.exports = {
  testTimeout: 60000, // 60 seconds
  // ...
};
```

Or for individual tests:

```typescript
it('slow operation', async () => {
  // ...
}, 60000); // 60 second timeout
```

### Port Already in Use

Integration tests don't start a server, but if you encounter port conflicts:

```bash
# Kill process on port 3000
npx kill-port 3000

# Or find and kill manually
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Best Practices

### 1. Isolate Test Data

Each test should:
- Create its own test data
- Clean up after itself
- Not depend on other tests

```typescript
describe('Feature Tests', () => {
  let testData;

  beforeEach(async () => {
    testData = await createTestData();
  });

  afterEach(async () => {
    await cleanupTestData(testData.id);
  });

  it('test case', async () => {
    // Use testData
  });
});
```

### 2. Use Descriptive Test Names

```typescript
✅ it('should return 401 when authentication token is missing')
❌ it('auth test')

✅ it('should allow admin to delete any user')  
❌ it('delete user')
```

### 3. Test Happy and Unhappy Paths

```typescript
describe('POST /api/users', () => {
  it('should create user with valid data');
  it('should reject invalid email format');
  it('should reject weak password');
  it('should prevent duplicate email');
  it('should require authentication');
  it('should require admin role');
});
```

### 4. Verify Database State

```typescript
it('should create user in database', async () => {
  const response = await handler(request);
  expect(response.status).toBe(201);

  // Verify in database
  const user = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });

  expect(user).toBeDefined();
  expect(user!.name).toBe('Test User');
});
```

### 5. Test Complete Flows

```typescript
it('should complete full registration flow', async () => {
  // 1. Register
  const signupRes = await signupHandler(signupReq);
  expect(signupRes.status).toBe(201);

  // 2. Login
  const loginRes = await loginHandler(loginReq);
  expect(loginRes.status).toBe(200);

  // 3. Access protected resource
  const userRes = await getUsersHandler(userReq);
  expect(userRes.status).toBe(200);
});
```

## CI/CD Integration

Integration tests run in CI/CD pipeline after unit tests:

```yaml
# .github/workflows/test.yml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Unit Tests
        run: npm test

  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: trustx_test
          POSTGRES_PASSWORD: postgres
      redis:
        image: redis:7
    steps:
      - name: Run Integration Tests
        run: npm run test:integration:coverage
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@postgres:5432/trustx_test
          REDIS_URL: redis://redis:6379/1
```

## Performance Considerations

### Database Connection Pooling

```typescript
// In jest.integration.setup.js
beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Parallel Test Execution

Jest runs tests in parallel by default. For database-heavy tests, limit workers:

```bash
npm run test:integration -- --maxWorkers=4
```

### Test Data Factories

Create reusable test data factories:

```typescript
// __tests__/factories/user.factory.ts
export const createTestUser = async (overrides = {}) => {
  return await prisma.user.create({
    data: {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: await bcrypt.hash('Password123!', 10),
      role: 'USER',
      ...overrides,
    },
  });
};
```

## Debugging Tests

### Run Specific Test

```bash
npm run test:integration -- --testNamePattern="should login with valid credentials"
```

### Enable Verbose Output

```bash
npm run test:integration -- --verbose
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Integration Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--config",
    "jest.integration.config.js",
    "--runInBand"
  ],
  "console": "integratedTerminal"
}
```

## Next Steps

1. ✅ Install integration testing dependencies
2. ✅ Create test configuration files
3. ✅ Write integration test suites
4. ⏳ Set up test database
5. ⏳ Run and verify tests
6. ⏳ Integrate with CI/CD
7. ⏳ Document edge cases

## Related Documentation

- [Testing Guide](./TESTING-GUIDE.md) - Overall testing strategy
- [API Documentation](./API-DOCUMENTATION.md) - API endpoint reference
- [Testing Best Practices](./TESTING-BEST-PRACTICES.md) - Testing patterns

---

**Last Updated**: 2025
**Maintained By**: TrustX Development Team
