# Unit Testing - Best Practices

## 🎯 Core Principles

### 1. Write Testable Code

#### ✅ Good: Pure Functions
```typescript
// Easy to test - no side effects
export const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Test
it('should calculate total price', () => {
  const items = [{ price: 10 }, { price: 20 }];
  expect(calculateTotal(items)).toBe(30);
});
```

#### ❌ Bad: Impure Functions
```typescript
// Hard to test - depends on external state
let total = 0;
export const addToTotal = (price: number) => {
  total += price;  // Modifies external state
};
```

### 2. Single Responsibility

Each test should verify one specific behavior:

```typescript
// ✅ Good: One concept per test
it('should validate email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
});

it('should reject emails without @', () => {
  expect(isValidEmail('invalid.email')).toBe(false);
});

// ❌ Bad: Multiple concepts
it('should validate email and password', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
  expect(isValidPassword('Pass123')).toBe(true);
});
```

### 3. Fast Tests

Keep tests fast for quick feedback:

```typescript
// ✅ Good: Fast, synchronous
it('should format currency', () => {
  expect(formatCurrency(100)).toBe('$100.00');
});

// ⚠️ Slower: Async when necessary
it('should fetch user data', async () => {
  const data = await fetchUser('123');
  expect(data.name).toBe('John');
});
```

### 4. Isolated Tests

Tests should not depend on each other:

```typescript
// ✅ Good: Independent tests
describe('Counter', () => {
  let counter: Counter;

  beforeEach(() => {
    counter = new Counter(0);  // Fresh start
  });

  it('increments', () => {
    counter.increment();
    expect(counter.value).toBe(1);
  });

  it('decrements', () => {
    counter.decrement();
    expect(counter.value).toBe(-1);
  });
});
```

---

## 📝 Naming Conventions

### Test File Names

```
Component.test.tsx
utils.test.ts
validation.test.ts
useAuth.test.ts
```

### Test Descriptions

Be specific and descriptive:

```typescript
// ✅ Good: Clear what's being tested
it('should display error when email is invalid', () => {});
it('should disable submit button when form is incomplete', () => {});
it('should calculate tax correctly for multiple items', () => {});

// ❌ Bad: Vague descriptions
it('works', () => {});
it('test 1', () => {});
it('validates', () => {});
```

### Describe Blocks

Group related tests:

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should throw error with invalid email', () => {});
  });

  describe('updateUser', () => {
    it('should update user name', () => {});
    it('should require authentication', () => {});
  });
});
```

---

## 🏗️ Test Structure

### AAA Pattern (Arrange-Act-Assert)

```typescript
it('should add item to cart', () => {
  // Arrange: Set up test data
  const cart = new ShoppingCart();
  const item = { id: 1, name: 'Product', price: 10 };
  
  // Act: Perform the action
  cart.addItem(item);
  
  // Assert: Verify the result
  expect(cart.items).toHaveLength(1);
  expect(cart.items[0]).toEqual(item);
});
```

### Given-When-Then

Alternative pattern for BDD-style tests:

```typescript
describe('User login', () => {
  it('should succeed with valid credentials', () => {
    // Given: A user with valid credentials
    const credentials = {
      email: 'user@example.com',
      password: 'ValidPass123'
    };
    
    // When: User attempts to login
    const result = login(credentials);
    
    // Then: Login should succeed
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });
});
```

---

## 🎭 Mocking Strategies

### Mock External Dependencies Only

```typescript
// ✅ Good: Mock API calls
jest.mock('../../src/lib/api', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ id: 1, name: 'John' }))
}));

// ❌ Bad: Mock the code you're testing
jest.mock('../../src/lib/userService');
// Then test userService (nothing is actually tested!)
```

### Spy on Methods

```typescript
import { emailService } from '../../src/lib/emailService';

it('should send welcome email on registration', () => {
  const sendSpy = jest.spyOn(emailService, 'send');
  
  registerUser({ email: 'user@example.com' });
  
  expect(sendSpy).toHaveBeenCalledWith({
    to: 'user@example.com',
    subject: 'Welcome'
  });
  
  sendSpy.mockRestore();
});
```

### Mock Implementations

```typescript
// Mock with custom implementation
global.fetch = jest.fn((url) => {
  if (url === '/api/users') {
    return Promise.resolve({
      json: () => Promise.resolve([{ id: 1 }])
    });
  }
  return Promise.reject(new Error('Not found'));
});
```

---

## 🧪 Testing Components

### Query Selection Priority

Use queries in this order (most to least preferred):

1. **getByRole** - Accessibility-focused
2. **getByLabelText** - Form controls
3. **getByPlaceholderText** - Form inputs
4. **getByText** - Text content
5. **getByTestId** - Last resort

```typescript
// ✅ Best: Accessible query
const button = screen.getByRole('button', { name: 'Submit' });

// ✅ Good: Semantic query
const input = screen.getByLabelText('Email Address');

// ⚠️ Okay: Text content
const heading = screen.getByText('Welcome');

// ❌ Last resort: Test ID
const element = screen.getByTestId('custom-element');
```

### User Interactions

Prefer userEvent over fireEvent:

```typescript
import userEvent from '@testing-library/user-event';

// ✅ Good: Simulates real user interaction
it('should submit form on button click', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);
  
  await user.type(screen.getByLabelText('Email'), 'user@example.com');
  await user.click(screen.getByRole('button', { name: 'Login' }));
  
  expect(screen.getByText('Welcome')).toBeInTheDocument();
});

// ⚠️ Okay: Basic event
fireEvent.click(button);
```

### Async Testing

Wait for elements to appear:

```typescript
// ✅ Good: Wait for element
it('should display user data', async () => {
  render(<UserProfile userId="123" />);
  
  const name = await screen.findByText('John Doe');
  expect(name).toBeInTheDocument();
});

// ✅ Good: Wait for disappearance
it('should hide loading spinner', async () => {
  render(<LoadingComponent />);
  
  await waitForElementToBeRemoved(() => screen.getByText('Loading...'));
  expect(screen.getByText('Content')).toBeInTheDocument();
});
```

---

## 📊 Coverage Best Practices

### What to Cover

#### ✅ Priority High
- Business logic functions
- Validation and sanitization
- Authentication and authorization
- Error handling
- Critical user flows

#### ⚠️ Priority Medium
- UI components
- Utility functions
- State management
- API interactions

#### 💡 Priority Low
- Configuration files
- Type definitions
- Simple getters/setters
- Third-party integrations

### Achieving 80%+ Coverage

```typescript
// Test all code paths
export const divide = (a: number, b: number): number => {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
};

// Tests covering both paths
describe('divide', () => {
  it('should divide numbers', () => {
    expect(divide(10, 2)).toBe(5);  // Happy path
  });

  it('should throw on division by zero', () => {
    expect(() => divide(10, 0)).toThrow();  // Error path
  });
});
```

### Exclude Irrelevant Code

```javascript
// jest.config.js
collectCoverageFrom: [
  'src/**/*.{js,jsx,ts,tsx}',
  '!src/**/*.test.{js,jsx,ts,tsx}',      // Test files
  '!src/**/__tests__/**',                 // Test directories
  '!src/**/*.d.ts',                       // Type definitions
  '!src/stories/**',                      // Storybook stories
  '!src/app/**/layout.tsx',               // Next.js layouts
  '!src/app/**/loading.tsx',              // Loading states
],
```

---

## 🚀 Performance Optimization

### Parallel Execution

```bash
# Run tests in parallel (default)
npm test

# Control parallelism
npm test -- --maxWorkers=4
```

### Selective Testing

```bash
# Run only changed files
npm test -- --onlyChanged

# Run related tests
npm test -- --findRelatedTests src/lib/utils.ts

# Run specific tests
npm test -- --testPathPattern=components
```

### Cache Management

```bash
# Clear cache if tests behave strangely
npx jest --clearCache
```

---

## 🎯 Test Coverage Goals

### Coverage Targets

| Metric | Target | Description |
|--------|--------|-------------|
| **Statements** | 80%+ | Individual lines executed |
| **Branches** | 80%+ | All if/else paths |
| **Functions** | 80%+ | All functions called |
| **Lines** | 80%+ | All code lines executed |

### Interpreting Coverage

```
File: userService.ts
Uncovered Line #s: 45-48, 92
```

#### What to do:

1. **Add tests** for uncovered lines
2. **Remove dead code** if lines are unreachable
3. **Refactor** complex functions
4. **Document** why some lines can't be tested

---

## 🔄 Continuous Improvement

### Test Maintenance

#### Regular Review
- Update tests when requirements change
- Remove obsolete tests
- Refactor duplicated test code
- Keep tests simple and readable

#### Test Quality Metrics
- **Test execution time** - Keep under 1 minute
- **Flaky tests** - Fix or remove unstable tests
- **Code duplication** - Extract common setup
- **Test coverage trends** - Monitor over time

### Code Review Checklist

When reviewing test code:

- [ ] Tests are clear and descriptive
- [ ] Tests cover happy path and edge cases
- [ ] Tests are independent and isolated
- [ ] No unnecessary mocks or complexity
- [ ] Assertions are specific and meaningful
- [ ] Tests execute quickly
- [ ] Coverage thresholds are met

---

## 📚 Testing Patterns

### Test Fixtures

```typescript
// fixtures/users.ts
export const mockUsers = {
  admin: {
    id: '1',
    name: 'Admin User',
    role: 'ADMIN',
    email: 'admin@example.com'
  },
  regular: {
    id: '2',
    name: 'Regular User',
    role: 'USER',
    email: 'user@example.com'
  }
};

// In tests
import { mockUsers } from '../fixtures/users';

it('should grant admin access', () => {
  const canAccess = checkAccess(mockUsers.admin, 'admin-panel');
  expect(canAccess).toBe(true);
});
```

### Test Helpers

```typescript
// helpers/testUtils.tsx
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: any
) => {
  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );

  return render(ui, { wrapper: AllProviders, ...options });
};

// Usage
it('should render protected content', () => {
  renderWithProviders(<ProtectedPage />);
  expect(screen.getByText('Protected')).toBeInTheDocument();
});
```

### Factory Pattern

```typescript
// factories/userFactory.ts
export const createUser = (overrides = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'USER',
  ...overrides
});

// Usage
it('should handle admin users', () => {
  const admin = createUser({ role: 'ADMIN' });
  expect(hasAdminAccess(admin)).toBe(true);
});
```

---

## 🎓 Learning Resources

### Documentation
- [Jest Official Docs](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Books
- "Test-Driven Development" by Kent Beck
- "The Art of Unit Testing" by Roy Osherove

### Courses
- Testing JavaScript (testingjavascript.com)
- Epic React Testing Workshop

---

## ✅ Quick Reference Checklist

### Before Writing Tests

- [ ] Understand the requirement
- [ ] Identify test cases (happy path, edge cases, errors)
- [ ] Consider what to mock

### Writing Tests

- [ ] Use descriptive test names
- [ ] Follow AAA pattern
- [ ] One assertion concept per test
- [ ] Test behavior, not implementation
- [ ] Handle async operations properly

### After Writing Tests

- [ ] Tests pass consistently
- [ ] Coverage meets thresholds
- [ ] Tests are readable
- [ ] No unnecessary complexity
- [ ] Tests run quickly

---

## 🏆 Summary

### Key Takeaways

1. **Write testable code** - Pure functions, single responsibility
2. **Test behavior** - Not implementation details
3. **Keep tests simple** - Easy to understand and maintain
4. **Mock sparingly** - Only external dependencies
5. **Maintain coverage** - Aim for 80%+ on critical code
6. **Run tests frequently** - Fast feedback loop
7. **Improve continuously** - Refactor and update tests

### Anti-Patterns to Avoid

❌ Testing implementation details
❌ Overmocking (mocking everything)
❌ Flaky tests (inconsistent results)
❌ Slow tests (taking too long)
❌ Vague test names
❌ Multiple unrelated assertions
❌ Dependent tests (one depends on another)
❌ Ignoring edge cases
❌ Testing third-party libraries

### Pro Tips

💡 **Use watch mode** during development
💡 **Write tests first** (TDD) when possible
💡 **Commit tests with code** - Never commit untested code
💡 **Review test output** - Actually read test results
💡 **Delete obsolete tests** - Don't hoard unused tests
💡 **Leverage IDE extensions** - Jest Runner, Test Explorer

---

**Remember: Good tests are an investment in code quality and developer confidence!** 🚀
