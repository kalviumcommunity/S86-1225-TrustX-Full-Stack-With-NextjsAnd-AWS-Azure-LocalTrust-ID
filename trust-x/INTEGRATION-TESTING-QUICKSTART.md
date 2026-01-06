# Integration Testing Quick Start

## Setup (5 minutes)

### 1. Install Dependencies ✅
```bash
npm install --save-dev supertest @types/supertest msw node-mocks-http
```

### 2. Create Test Database
```bash
# Create PostgreSQL test database
createdb trustx_test

# Run migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trustx_test" npx prisma migrate deploy
```

### 3. Verify Redis
```bash
redis-cli -n 1 ping
# Should return: PONG
```

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Watch mode
npm run test:integration:watch

# With coverage
npm run test:integration:coverage

# Run all tests (unit + integration)
npm run test:all
```

## Test Files Created

- `__tests__/integration/auth.test.ts` - Authentication tests (15 tests)
- `__tests__/integration/users.test.ts` - User CRUD tests (20 tests)
- `__tests__/integration/middleware.test.ts` - Middleware tests (25 tests)

## Quick Test Example

```typescript
import { POST as handler } from '@/app/api/endpoint/route';

it('should handle request', async () => {
  const request = new Request('http://localhost:3000/api/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ data: 'value' }),
  });

  const response = await handler(request);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
});
```

## Coverage Target

- **Threshold**: 70% (statements, branches, functions, lines)
- **Focus**: API routes (`src/app/api/**`) and libraries (`src/lib/**`)
- **Timeout**: 30 seconds per test

## NPM Scripts

| Script | Description |
|--------|-------------|
| `test:integration` | Run integration tests |
| `test:integration:watch` | Watch mode for development |
| `test:integration:coverage` | Run with coverage report |
| `test:all` | Run unit + integration tests |

## Troubleshooting

### Database Error
```bash
# Recreate test database
dropdb trustx_test
createdb trustx_test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trustx_test" npx prisma migrate deploy
```

### Redis Error  
```bash
# Start Redis
redis-server

# Test connection
redis-cli -n 1 ping
```

### Test Timeout
Increase timeout in `jest.integration.config.js`:
```javascript
testTimeout: 60000, // 60 seconds
```

## What's Tested

### Authentication (`auth.test.ts`)
- ✅ User registration
- ✅ Login with credentials
- ✅ Token refresh
- ✅ Logout
- ✅ Password hashing
- ✅ Cookie handling

### Users API (`users.test.ts`)
- ✅ User listing (pagination)
- ✅ User creation (admin)
- ✅ User retrieval
- ✅ User updates
- ✅ User deletion
- ✅ RBAC enforcement
- ✅ Caching behavior

### Middleware (`middleware.test.ts`)
- ✅ JWT authentication
- ✅ RBAC authorization
- ✅ Rate limiting
- ✅ Request logging
- ✅ Input sanitization
- ✅ CORS headers
- ✅ Security headers
- ✅ Error handling

## Next Steps

1. ✅ Dependencies installed
2. ✅ Configuration files created
3. ✅ Test files written
4. ⏳ Set up test database (see Step 2 above)
5. ⏳ Run tests: `npm run test:integration`
6. ⏳ Review coverage report
7. ⏳ Integrate with CI/CD

## Full Documentation

See [INTEGRATION-TESTING-GUIDE.md](./INTEGRATION-TESTING-GUIDE.md) for comprehensive documentation.

---

**Status**: Ready to run after test database setup  
**Test Count**: 60+ integration tests  
**Coverage Target**: 70%
