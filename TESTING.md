# Testing Guide for Markdown Media Tracker

## Overview

This guide explains how to run, write, and maintain tests for the Markdown Media Tracker project. We use Vitest for unit and integration tests, and Playwright for end-to-end tests.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
# Not currently implemented
#npm run test:e2e

# Run E2E tests with UI
# Not currently implemented
#npm test:e2e:ui
```

## Test Structure

```
src/
├── utils/__tests__/          # Unit tests for utility functions
├── services/__tests__/       # Tests for external API services
├── hooks/__tests__/          # Tests for custom React hooks
├── components/__tests__/     # Tests for React components
└── test/
    ├── setup.js              # Global test configuration
    ├── mocks/                # Reusable mock implementations
    │   ├── apis.js           # Mock API responses
    │   ├── localStorage.js   # Mock localStorage
    │   └── storage.js        # Mock storage adapters
    └── fixtures/             # Sample test data
        ├── sampleItems.js    # Sample books and movies
        └── sampleCSV.js      # Sample CSV data
```

## Writing Tests

### Unit Tests for Utilities

Utility functions should have comprehensive test coverage (90%+ goal).

**Example:**

```javascript
import { describe, it, expect } from 'vitest';
import { parseMarkdown, generateMarkdown } from '../../utils/markdownUtils.js';

describe('markdownUtils', () => {
  describe('parseMarkdown', () => {
    it('should parse valid YAML frontmatter', () => {
      const markdown = `---
title: "Test Book"
author: "Test Author"
---

Notes here.`;

      const result = parseMarkdown(markdown);
      
      expect(result.metadata.title).toBe('Test Book');
      expect(result.metadata.author).toBe('Test Author');
      expect(result.body).toBe('Notes here.');
    });

    it('should handle missing frontmatter', () => {
      const markdown = 'Just content';
      const result = parseMarkdown(markdown);
      
      expect(result.metadata).toEqual({});
      expect(result.body).toBe('Just content');
    });
  });
});
```

### Service Layer Tests

Service tests should mock external APIs and test error handling.

**Example:**

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { searchBooks } from '../../services/openLibraryService.js';
import { mockFetch } from '../../test/mocks/apis.js';

describe('openLibraryService', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = mockFetch();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should search for books successfully', async () => {
    const results = await searchBooks('gatsby');
    
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('The Great Gatsby');
  });
});
```

### Hook Tests

Custom hooks should be tested with React Testing Library's `renderHook`.

**Example:**

```javascript
import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useItems } from '../useItems';

describe('useItems', () => {
  it('should load items from storage', async () => {
    const { result } = renderHook(() => useItems());
    
    await waitFor(() => {
      expect(result.current.items).toHaveLength(4);
    });
  });

  it('should save a new item', async () => {
    const { result } = renderHook(() => useItems());
    
    const newItem = { id: '5', title: 'New Book', type: 'book' };

    await act(async () => {
      await result.current.saveItem(newItem);
    });

    expect(result.current.items).toContainEqual(newItem);
  });
});
```

### Component Tests

React components should be tested with React Testing Library.

**Example:**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemCard from '../ItemCard';

describe('ItemCard', () => {
  const mockItem = {
    id: '1',
    title: 'Test Book',
    author: 'Test Author',
    type: 'book',
    rating: 5,
  };

  it('should render book card correctly', () => {
    render(
      <ItemCard
        item={mockItem}
        cardSize="medium"
        onItemClick={vi.fn()}
      />
    );

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('should call onItemClick when clicked', () => {
    const mockOnClick = vi.fn();
    
    render(
      <ItemCard
        item={mockItem}
        cardSize="medium"
        onItemClick={mockOnClick}
      />
    );

    fireEvent.click(screen.getByText('Test Book'));
    expect(mockOnClick).toHaveBeenCalledWith(mockItem, expect.any(Object));
  });
});
```

## Test Coverage Goals

- **Utils**: 90%+ coverage
- **Hooks**: 85%+ coverage
- **Services**: 80%+ coverage
- **Components**: 75%+ coverage

View coverage report:

```bash
npm run test:coverage
# Open coverage/index.html in your browser
```

## Best Practices

### 1. Test Organization

- Place test files next to the code they test (in `__tests__` folders)
- Use descriptive test names that explain what is being tested
- Group related tests with `describe` blocks

### 2. Test Independence

- Each test should be independent and not rely on other tests
- Use `beforeEach` to set up test state
- Use `afterEach` to clean up after tests

### 3. Mocking

- Mock external dependencies (APIs, storage, etc.)
- Use the provided mocks in `src/test/mocks/`
- Keep mocks realistic and based on actual behavior

### 4. Assertions

- Use specific assertions (prefer `toBe` over `toBeTruthy` when checking exact values)
- Test both success and error cases
- Test edge cases (empty arrays, null values, etc.)

### 5. Async Testing

- Use `async/await` for asynchronous tests
- Use `waitFor` from React Testing Library when needed
- Don't forget to `await` promises in tests

## Common Patterns

### Testing localStorage

```javascript
import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
});

it('should save to localStorage', () => {
  saveToStorage('key', 'value');
  expect(localStorage.getItem('key')).toBe('value');
});
```

### Testing API Calls

```javascript
import { vi } from 'vitest';

it('should handle API errors', async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      status: 500,
    })
  );

  const result = await apiCall();
  expect(result).toEqual([]);
});
```

### Testing React Hooks

```javascript
import { renderHook, act } from '@testing-library/react';

it('should update state', () => {
  const { result } = renderHook(() => useMyHook());
  
  act(() => {
    result.current.updateValue('new value');
  });
  
  expect(result.current.value).toBe('new value');
});
```

### Testing User Interactions

```javascript
import { render, screen, fireEvent } from '@testing-library/react';

it('should handle click', () => {
  const mockFn = vi.fn();
  render(<Button onClick={mockFn}>Click me</Button>);
  
  fireEvent.click(screen.getByText('Click me'));
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

## Debugging Tests

### Run Single Test File

```bash
npm test -- path/to/test.js
```

### Run Tests Matching Pattern

```bash
npm test -- --grep "should filter by"
```

### Debug with UI

```bash
npm test:ui
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal"
}
```

## Continuous Integration

Tests run automatically on:

- Pull requests to `dev` and `main` branches
- Pushes to `dev` and `main` branches

### GitHub Actions Workflow

See `.github/workflows/test.yml` for the CI configuration.

## Current Status

**Test Suite Progress:**

- ✅ Infrastructure setup complete
- ✅ Utility tests: 85 passing tests (markdownUtils, filterUtils, colorUtils)
- 🟡 Service tests: 30 tests created (needs adjustments)
- ❌ Hook tests: Not started
- ❌ Component tests: Not started
- ❌ Integration tests: Not started
- ❌ E2E tests: Not started

See [TEST_SUITE_STATUS.md](./TEST_SUITE_STATUS.md) for detailed progress.

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass before committing
3. Aim for coverage goals (90%+ for utils, 85%+ for hooks, etc.)
4. Update this documentation if adding new testing patterns

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Getting Help

- Check existing tests for examples
- Review [AGENTS.md](./AGENTS.md) for project architecture
- Review [CONTRIBUTING.md](./CONTRIBUTING.md) for code guidelines
- Open an issue for questions or problems
