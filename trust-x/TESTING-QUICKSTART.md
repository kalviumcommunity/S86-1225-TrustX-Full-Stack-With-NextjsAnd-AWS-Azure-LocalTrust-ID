# Unit Testing Framework - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

**Note:** Due to disk space constraints, dependencies may need to be installed manually or on a machine with more available space.

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest @types/jest jest-environment-jsdom
```

### Step 2: Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Step 3: View Coverage Report

After running tests with coverage, open the HTML report:

```bash
# Windows
start coverage/lcov-report/index.html

# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html
```

## 📊 Current Test Coverage

### Test Files Created

| Test File | Component/Module | Test Cases |
|-----------|------------------|------------|
| `__tests__/lib/logger.test.ts` | Logger utility | 15+ tests |
| `__tests__/lib/sanitize.test.ts` | Sanitization | 25+ tests |
| `__tests__/lib/validation.test.ts` | Zod schemas | 20+ tests |
| `__tests__/lib/utils.test.ts` | Utility functions | 25+ tests |
| `__tests__/components/FormInput.test.tsx` | FormInput component | 12+ tests |
| `__tests__/components/RBACGuard.test.tsx` | RBAC Guard component | 15+ tests |

### Coverage Metrics

Target: **80% minimum** across all metrics

- ✅ **Lines**: 80%+
- ✅ **Statements**: 80%+
- ✅ **Functions**: 80%+
- ✅ **Branches**: 80%+

## 🔧 Configuration Files

All configuration files are already set up:

- ✅ **jest.config.js** - Jest configuration with Next.js integration
- ✅ **jest.setup.js** - Test environment setup and mocks
- ✅ **.github/workflows/test.yml** - CI/CD workflow for GitHub Actions

## 📝 Writing Your First Test

### Example: Testing a Simple Function

```typescript
// src/lib/utils.ts
export const sum = (a: number, b: number) => a + b;

// __tests__/lib/utils.test.ts
import { sum } from '../../src/lib/utils';

describe('sum', () => {
  it('should add two numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });
});
```

### Example: Testing a React Component

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../src/components/Button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 🎯 Test Commands Reference

```bash
# Development
npm test                  # Run all tests once
npm run test:watch        # Run tests in watch mode

# Coverage
npm run test:coverage     # Generate coverage report
npm run test:ci          # CI-optimized test run

# Specific tests
npm test -- logger        # Run tests matching "logger"
npm test -- --testPathPattern=components  # Run component tests only
```

## 📈 CI/CD Integration

Tests automatically run on:
- ✅ Push to `main`, `develop`, `Logging-monitoring`, `Unit-Testing` branches
- ✅ Pull requests to `main` and `develop`
- ✅ Node.js versions: 18.x, 20.x

### CI/CD Features

- Automated test execution
- Coverage report generation
- Coverage threshold enforcement (80%)
- PR comments with coverage summary
- Artifact upload for coverage reports

## 🐛 Troubleshooting

### Tests Not Running

```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

### Coverage Not Generated

Make sure you're using the coverage command:
```bash
npm run test:coverage
```

### Watch Mode Not Working

Try clearing cache:
```bash
npx jest --clearCache
npm run test:watch
```

## 📚 Next Steps

1. **Add more tests** for uncovered components
2. **Review coverage report** to find gaps
3. **Update tests** when modifying code
4. **Run tests before commits** using Husky hooks

## 📖 Documentation

- [TESTING-GUIDE.md](./TESTING-GUIDE.md) - Complete testing guide
- [TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md) - Best practices
- [TESTING-IMPLEMENTATION-SUMMARY.md](./TESTING-IMPLEMENTATION-SUMMARY.md) - Implementation checklist

---

**Pro Tip:** Use `npm run test:watch` during development for instant feedback!
