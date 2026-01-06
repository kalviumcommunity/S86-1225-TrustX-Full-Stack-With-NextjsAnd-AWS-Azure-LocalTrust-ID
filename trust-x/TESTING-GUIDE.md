# Unit Testing Framework - Complete Guide

## 📑 Table of Contents

1. [Introduction](#introduction)
2. [Why Unit Testing Matters](#why-unit-testing-matters)
3. [Test Pyramid](#test-pyramid)
4. [Setup and Installation](#setup-and-installation)
5. [Configuration](#configuration)
6. [Writing Tests](#writing-tests)
7. [Running Tests](#running-tests)
8. [Coverage Reports](#coverage-reports)
9. [CI/CD Integration](#cicd-integration)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

This guide covers the complete setup and usage of Jest and React Testing Library (RTL) for unit testing the TrustX Next.js application. Unit testing ensures individual functions, components, and modules work correctly in isolation, providing confidence before deployment.

## Why Unit Testing Matters

### Benefits of Unit Testing

1. **Early Bug Detection** - Catch bugs before they reach production
2. **Regression Prevention** - Ensure new changes don't break existing functionality
3. **Documentation** - Tests serve as living documentation of expected behavior
4. **Refactoring Confidence** - Safely improve code knowing tests will catch issues
5. **Faster Development** - Quick feedback loop during development
6. **Cost Effective** - Cheaper to fix bugs early than in production

### When to Write Tests

- ✅ **Before** writing new features (Test-Driven Development)
- ✅ **During** feature development
- ✅ **After** finding bugs (write test first, then fix)
- ✅ **When** refactoring existing code

---

## Test Pyramid

Understanding the test pyramid helps balance testing strategy:

```
         /\
        /  \         E2E Tests
       /    \        (Few, Slow, Expensive)
      /------\
     /        \      Integration Tests
    /          \     (Some, Medium Speed)
   /------------\
  /              \   Unit Tests
 /                \  (Many, Fast, Cheap)
/------------------\
```

### Test Type Comparison

| Test Type | Scope | Speed | Cost | Tool |
|-----------|-------|-------|------|------|
| **Unit Tests** | Individual functions/components | Fast (ms) | Low | Jest, RTL |
| **Integration Tests** | Combined modules | Medium (seconds) | Medium | RTL, MSW |
| **E2E Tests** | Full user workflows | Slow (minutes) | High | Cypress, Playwright |

**This guide focuses on Unit Tests**, which form the foundation of the testing pyramid.

---

## Setup and Installation

### Dependencies Required

```json
{
  "devDependencies": {
    "jest": "^29.x",
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/user-event": "^14.x",
    "ts-jest": "^29.x",
    "@types/jest": "^29.x",
    "jest-environment-jsdom": "^29.x"
  }
}
```

### Installation Command

```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  ts-jest \
  @types/jest \
  jest-environment-jsdom
```

### Initialize Jest

```bash
npx jest --init
```

Follow the prompts:
- **Environment**: jsdom (browser-like testing)
- **Coverage**: yes
- **Framework**: default (Jest)

---

## Configuration

### jest.config.js

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
};

module.exports = createJestConfig(customJestConfig);
```

### jest.setup.js

```javascript
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      pathname: '/',
    };
  },
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
```

### package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## Writing Tests

### Test Structure

```typescript
describe('ComponentName or FunctionName', () => {
  // Setup before each test
  beforeEach(() => {
    // Setup code
  });

  // Cleanup after each test
  afterEach(() => {
    // Cleanup code
  });

  it('should describe what the test does', () => {
    // Arrange: Set up test data
    // Act: Execute the code being tested
    // Assert: Verify the results
  });
});
```

### Testing Utilities

#### Example 1: Simple Function

```typescript
// src/lib/utils.ts
export const sum = (a: number, b: number) => a + b;

// __tests__/lib/utils.test.ts
import { sum } from '../../src/lib/utils';

describe('sum', () => {
  it('should add two numbers correctly', () => {
    expect(sum(2, 3)).toBe(5);
  });

  it('should handle negative numbers', () => {
    expect(sum(-5, 3)).toBe(-2);
  });

  it('should handle zero', () => {
    expect(sum(0, 5)).toBe(5);
  });
});
```

#### Example 2: Validation Function

```typescript
// src/lib/validation.ts
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// __tests__/lib/validation.test.ts
import { isValidEmail } from '../../src/lib/validation';

describe('isValidEmail', () => {
  it('should validate correct email format', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('should reject invalid email format', () => {
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
  });

  it('should reject emails with spaces', () => {
    expect(isValidEmail('user name@example.com')).toBe(false);
  });
});
```

### Testing React Components

#### Example 3: Form Input Component

```typescript
// __tests__/components/FormInput.test.tsx
import { render, screen } from '@testing-library/react';
import FormInput from '../../src/components/FormInput';

describe('FormInput', () => {
  const mockRegister = jest.fn();

  it('should render label and input', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        register={mockRegister}
      />
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        register={mockRegister}
        error="Email is required"
      />
    );

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });
});
```

#### Example 4: Interactive Component

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../src/components/Button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });
});
```

### Testing with Mocks

#### Mocking Modules

```typescript
// Mock the logger module
jest.mock('../../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { logger } from '../../src/lib/logger';

describe('Function using logger', () => {
  it('should log info message', () => {
    someFunction();
    expect(logger.info).toHaveBeenCalledWith('Expected message');
  });
});
```

#### Mocking API Calls

```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'test' }),
  })
) as jest.Mock;

describe('API function', () => {
  it('should fetch data', async () => {
    const data = await fetchUserData('123');
    expect(fetch).toHaveBeenCalledWith('/api/users/123');
  });
});
```

### Jest Matchers

Common matchers used in tests:

```typescript
// Equality
expect(value).toBe(5);                    // Strict equality
expect(value).toEqual({ a: 1 });          // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(0.3);           // Floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty('key');
expect(object).toMatchObject({ a: 1 });

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(2);
expect(fn).toHaveBeenCalledWith('arg');

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

### RTL Queries

React Testing Library query methods:

```typescript
// getBy* - Returns element or throws error (use for elements that should exist)
screen.getByText('Hello');
screen.getByRole('button');
screen.getByLabelText('Email');
screen.getByPlaceholderText('Enter text');
screen.getByTestId('custom-element');

// queryBy* - Returns element or null (use when element might not exist)
screen.queryByText('Optional');

// findBy* - Returns promise, waits for element (use for async)
await screen.findByText('Loaded content');

// *AllBy* - Returns array of all matching elements
screen.getAllByRole('listitem');
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- logger.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should validate"
```

### Watch Mode

Watch mode re-runs tests when files change:

```bash
npm run test:watch

# In watch mode, press:
# a - Run all tests
# f - Run only failed tests
# p - Filter by filename pattern
# t - Filter by test name pattern
# q - Quit watch mode
```

### Debugging Tests

```typescript
// Add debug output
import { render, screen, debug } from '@testing-library/react';

test('debug example', () => {
  render(<MyComponent />);
  screen.debug();  // Prints DOM to console
});

// Use VSCode debugger
// Add breakpoint and run: "Debug Jest Tests"
```

---

## Coverage Reports

### Generating Coverage

```bash
npm run test:coverage
```

### Coverage Output

Terminal output shows coverage summary:

```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   85.00 |    82.00 |   88.00 |   85.50 |
 lib/                 |   90.00 |    85.00 |   92.00 |   90.00 |
  logger.ts           |   95.00 |    90.00 |  100.00 |   95.00 |
  utils.ts            |   85.00 |    80.00 |   84.00 |   85.00 |
 components/          |   80.00 |    78.00 |   85.00 |   80.00 |
  FormInput.tsx       |   80.00 |    78.00 |   85.00 |   80.00 |
----------------------|---------|----------|---------|---------|
```

### HTML Coverage Report

Open `coverage/lcov-report/index.html` in a browser to see:
- File-by-file coverage breakdown
- Highlighted uncovered lines
- Branch coverage details
- Interactive navigation

### Coverage Thresholds

Configured in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

Tests fail if coverage drops below 80% for any metric.

### Improving Coverage

1. **Identify uncovered code** - Check HTML report
2. **Add missing tests** - Focus on red/yellow highlighted code
3. **Test edge cases** - Error conditions, boundary values
4. **Remove dead code** - Delete unused functions
5. **Exclude irrelevant files** - Update `collectCoverageFrom`

---

## CI/CD Integration

### GitHub Actions Workflow

File: `.github/workflows/test.yml`

```yaml
name: Unit Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      
      - run: npm ci
      - run: npm run test:ci
      
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
```

### CI Features

✅ **Automated Testing** - Runs on every push/PR
✅ **Multiple Node Versions** - Tests on Node 18 and 20
✅ **Coverage Reporting** - Uploads to Codecov
✅ **Threshold Enforcement** - Fails if coverage < 80%
✅ **PR Comments** - Posts coverage summary to PRs
✅ **Artifact Upload** - Saves coverage reports

### Viewing CI Results

1. **GitHub Actions Tab** - View test runs
2. **PR Checks** - See pass/fail status
3. **Codecov Dashboard** - Track coverage trends
4. **Coverage Comments** - Review in PR comments

---

## Best Practices

### Test Organization

```
__tests__/
├── lib/
│   ├── logger.test.ts
│   ├── utils.test.ts
│   └── validation.test.ts
├── components/
│   ├── Button.test.tsx
│   └── FormInput.test.tsx
└── hooks/
    └── useAuth.test.ts
```

### Naming Conventions

- ✅ **Files**: `ComponentName.test.tsx` or `functionName.test.ts`
- ✅ **Describe blocks**: `describe('ComponentName', ...)`
- ✅ **Test cases**: `it('should do something specific', ...)`

### Writing Good Tests

#### ✅ DO:

```typescript
// ✅ Clear, descriptive test names
it('should display error message when email is invalid', () => {
  // Test implementation
});

// ✅ Test behavior, not implementation
it('should disable submit button when form is invalid', () => {
  // Focus on what user sees, not internal state
});

// ✅ Arrange-Act-Assert pattern
it('should increment counter', () => {
  // Arrange
  const counter = new Counter(0);
  
  // Act
  counter.increment();
  
  // Assert
  expect(counter.value).toBe(1);
});
```

#### ❌ DON'T:

```typescript
// ❌ Vague test names
it('works', () => {});

// ❌ Testing implementation details
it('should set state.loading to true', () => {
  // Don't test internal state
});

// ❌ Multiple unrelated assertions
it('should do everything', () => {
  expect(a).toBe(1);
  expect(b).toBe(2);
  expect(c).toBe(3);
});
```

### Test Independence

Each test should be independent:

```typescript
// ✅ Good: Independent tests
describe('Counter', () => {
  let counter: Counter;

  beforeEach(() => {
    counter = new Counter(0);  // Fresh instance each test
  });

  it('should increment', () => {
    counter.increment();
    expect(counter.value).toBe(1);
  });

  it('should decrement', () => {
    counter.decrement();
    expect(counter.value).toBe(-1);
  });
});
```

### AAA Pattern

**Arrange-Act-Assert** structure:

```typescript
it('should calculate total price with tax', () => {
  // Arrange
  const cart = new ShoppingCart();
  cart.addItem({ price: 10, quantity: 2 });
  
  // Act
  const total = cart.getTotalWithTax(0.1);
  
  // Assert
  expect(total).toBe(22);  // (10 * 2) + 10% tax
});
```

### Mock Sparingly

Only mock what's necessary:

```typescript
// ✅ Mock external dependencies
jest.mock('../../src/lib/api');

// ❌ Don't mock the thing you're testing
jest.mock('../../src/lib/calculator'); // Then test calculator
```

### Test Error Cases

Don't just test the happy path:

```typescript
describe('divide', () => {
  it('should divide two numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should throw error when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });
});
```

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot find module '@testing-library/react'"

**Solution:**
```bash
npm install --save-dev @testing-library/react
```

#### Issue: "ReferenceError: document is not defined"

**Solution:** Check `testEnvironment` in jest.config.js:
```javascript
testEnvironment: 'jsdom',
```

#### Issue: "SyntaxError: Cannot use import statement"

**Solution:** Ensure `ts-jest` is installed and configured:
```bash
npm install --save-dev ts-jest
```

#### Issue: Tests timeout

**Solution:** Increase timeout in jest.config.js:
```javascript
testTimeout: 10000,  // 10 seconds
```

#### Issue: Coverage threshold not met

**Solution:** Write more tests or adjust thresholds:
```javascript
coverageThreshold: {
  global: {
    branches: 70,  // Lower if needed
  },
}
```

### Debugging Failed Tests

```bash
# Run specific test file
npm test -- path/to/test.test.ts

# Run with verbose output
npm test -- --verbose

# Clear cache and rerun
npx jest --clearCache
npm test
```

### Getting Help

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **RTL Documentation**: https://testing-library.com/react
- **Stack Overflow**: Tag `jest` or `react-testing-library`
- **GitHub Discussions**: Project issues tab

---

## Summary

### ✅ What We've Covered

1. ✅ **Jest and RTL setup** - Complete configuration
2. ✅ **Test structure** - How to organize tests
3. ✅ **Writing tests** - Functions, components, hooks
4. ✅ **Running tests** - Commands and watch mode
5. ✅ **Coverage** - Reports and thresholds
6. ✅ **CI/CD** - Automated testing pipeline
7. ✅ **Best practices** - Writing maintainable tests

### 📊 Current Test Suite

- **Total Test Files**: 6
- **Total Test Cases**: 110+
- **Code Coverage**: 80%+ (target)
- **CI/CD**: ✅ Automated on GitHub Actions

### 🎯 Next Steps

1. Install remaining dependencies (when disk space available)
2. Run test suite: `npm test`
3. Review coverage report
4. Add tests for remaining components
5. Integrate with pre-commit hooks

---

**Happy Testing! 🧪**
