# Comprehensive Test Suite Implementation for Markdown Media Tracker

## Context

You are working on Markdown Media Tracker (MMT), a React-based local-first application for tracking books and movies as Markdown files with YAML frontmatter. The project has reached v1.0 and now requires a comprehensive test suite to prevent breaking changes in the dev branch.

## Project Architecture Overview

**Technology Stack:**
- React 19 with hooks
- Vite build tool
- Tailwind CSS
- Custom hooks for state management (no Redux/MobX)
- File System Access API and Google Drive API for storage
- OMDb API (movies) and Open Library API (books)

**Key Modules:**
- `src/hooks/` - Custom React hooks for state and logic
- `src/components/` - UI components (modals, forms, cards, layout)
- `src/services/` - External API integrations and persistence
- `src/utils/` - Pure utility functions
- `src/constants/` - Configuration values

## Testing Requirements

### Primary Goals
1. **Prevent breaking changes** in core functionality during development
2. **Validate data integrity** across storage operations
3. **Ensure browser compatibility** for File System Access API and Google Drive features
4. **Test offline behavior** and error handling
5. **Maintain accessibility** standards

### Testing Strategy

Create a multi-layered test suite covering:

1. **Unit Tests** (Vitest)
   - All utility functions in `src/utils/`
   - Storage adapter interfaces
   - Data transformation functions
   - YAML frontmatter parsing/generation
   - CSV import/export logic
   - Color manipulation utilities

2. **Integration Tests** (Vitest + React Testing Library)
   - Custom hooks behavior
   - Component interactions
   - API service calls (mocked)
   - Storage operations (mocked)
   - Keyboard navigation
   - Theme persistence

3. **End-to-End Tests** (Playwright)
   - Complete user workflows
   - Storage selection and switching
   - Item creation/editing/deletion
   - Batch operations
   - Import/export functionality
   - Modal interactions

## Implementation Plan

### Phase 1: Test Infrastructure Setup

1. **Install testing dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test @vitest/ui
```

2. **Create test configuration files:**
   - `vitest.config.js` - Vitest configuration
   - `playwright.config.js` - E2E test configuration
   - `src/test/setup.js` - Global test setup
   - `src/test/mocks/` - Mock implementations for APIs and storage

3. **Add test scripts to package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Phase 2: Unit Tests for Utilities

Create test files for each utility module following the pattern `<module>.test.js`:

1. **`src/utils/markdownUtils.test.js`**
   - Parse YAML frontmatter correctly
   - Generate valid YAML frontmatter
   - Handle missing/malformed frontmatter
   - Preserve notes content
   - Edge cases: empty files, no frontmatter, special characters

2. **`src/utils/csvUtils.test.js`**
   - Export items to CSV format
   - Handle special characters in CSV
   - Generate correct headers
   - Test with 0, 1, and 1000+ items

3. **`src/utils/importUtils.test.js`**
   - Detect Goodreads format
   - Detect Letterboxd format (single CSV and ZIP)
   - Process Letterboxd ZIP with multiple files in correct order
   - Map columns correctly
   - Handle deduplication logic
   - Process progress callbacks
   - Handle API errors during enrichment
   - Respect abort signals

4. **`src/utils/filterUtils.test.js`**
   - Filter by type, rating, tags, status, recent dates
   - Sort by all supported criteria
   - Combine multiple filters
   - Handle empty item lists

5. **`src/utils/colorUtils.test.js`**
   - Convert hex to RGBA
   - Handle various color formats
   - Validate color presets

6. **`src/utils/fileUtils.test.js`**
   - Mock File System Access API operations
   - Test file reading/writing
   - Handle permission errors

### Phase 3: Hook Tests

Create tests for custom hooks using React Testing Library's `renderHook`:

1. **`src/hooks/useItems.test.js`**
   - Initialize storage adapters
   - Load items from storage
   - Save item (create and update)
   - Delete single item
   - Batch delete items
   - Undo delete functionality
   - Switch storage backends
   - Handle storage connection errors
   - Progress tracking during loads

2. **`src/hooks/useFilters.test.js`**
   - Search filtering
   - Type filtering (all/book/movie)
   - Rating filtering
   - Tag filtering (toggle multiple)
   - Status filtering
   - Recent date filtering
   - Sorting by all criteria
   - Clear filters
   - Active filter detection

3. **`src/hooks/useSelection.test.js`**
   - Toggle selection mode
   - Select/deselect items
   - Select all items
   - Clear selection
   - Get selected items
   - Track selection count

4. **`src/hooks/useTheme.test.js`**
   - Update primary color
   - Update highlight color
   - Update card size
   - Persist theme to localStorage
   - Load theme from localStorage

5. **`src/hooks/useKeyboardNavigation.test.js`**
   - Navigate with arrow keys
   - Navigate with vim keys (H/J/K/L)
   - Focus items in grid layout
   - Handle modal shortcuts
   - Respect card size for grid calculations

### Phase 4: Service Tests

Mock external APIs and test service layers:

1. **`src/services/omdbService.test.js`**
   - Search movies with valid API key
   - Handle invalid API key
   - Handle rate limiting
   - Handle network errors
   - Parse OMDb response correctly

2. **`src/services/openLibraryService.test.js`**
   - Search books by title
   - Search books by ISBN
   - Handle API timeouts
   - Handle malformed responses

3. **`src/services/configService.test.js`**
   - Save configuration to localStorage
   - Load configuration from localStorage
   - Handle missing configuration

4. **Storage Adapter Tests:**
   - Create mock implementations for both FileSystemStorageAdapter and GoogleDriveStorageAdapter
   - Test common interface methods: `isConnected()`, `connect()`, `disconnect()`, `getItems()`, `saveItem()`, `deleteItem()`
   - Test Google Drive specific: caching, pagination, batch operations
   - Test error handling and retry logic

### Phase 5: Component Tests

Test key components with React Testing Library:

1. **`src/components/cards/ItemCard.test.jsx`**
   - Render book card
   - Render movie card
   - Handle card click (normal and selection mode)
   - Show selection indicator
   - Show focus indicator
   - Display rating correctly

2. **`src/components/modals/SearchModal.test.jsx`**
   - Switch between book/movie search
   - Execute search
   - Display results
   - Handle loading states
   - Handle errors
   - Close modal

3. **`src/components/modals/ItemDetailModal.test.jsx`**
   - Display item details
   - Toggle edit mode
   - Save changes
   - Delete item
   - Navigate between items
   - Keyboard shortcuts (E, D, U, I, O, 0-5)

4. **`src/components/modals/BatchEditModal.test.jsx`**
   - Apply batch edits
   - Add tags to multiple items
   - Remove tags from multiple items
   - Show progress indicator

5. **`src/components/LandingPage.test.jsx`**
   - Display storage options
   - Handle storage selection
   - Show loading states
   - Display errors

### Phase 6: Integration Tests

Test complete workflows:

1. **Item Management Flow:**
   - Add item manually
   - Search and add item online
   - Edit item details
   - Delete item
   - Undo delete

2. **Batch Operations Flow:**
   - Enter selection mode
   - Select multiple items
   - Batch edit selected items
   - Batch delete selected items

3. **Import/Export Flow:**
   - Export CSV (all, books, movies)
   - Import Goodreads CSV
   - Import Letterboxd ZIP
   - Handle import errors

4. **Storage Flow:**
   - Select filesystem storage
   - Switch to Google Drive
   - Handle connection errors
   - Clear cache (Google Drive)

### Phase 7: End-to-End Tests (Playwright)

Create comprehensive E2E tests:

1. **`tests/e2e/storage.spec.js`**
   - Complete storage selection flow
   - Switch between storage types
   - Handle permissions

2. **`tests/e2e/item-management.spec.js`**
   - Full CRUD operations on items
   - Search and filter items
   - Sort items by different criteria

3. **`tests/e2e/batch-operations.spec.js`**
   - Select multiple items
   - Perform batch edits
   - Perform batch deletes

4. **`tests/e2e/import-export.spec.js`**
   - Import CSV file
   - Export CSV file
   - Verify data integrity

5. **`tests/e2e/keyboard-navigation.spec.js`**
   - Test all keyboard shortcuts
   - Navigate item grid with arrows
   - Modal interactions

6. **`tests/e2e/accessibility.spec.js`**
   - Test with screen reader
   - Verify ARIA labels
   - Check keyboard navigation
   - Test color contrast

### Phase 8: Coverage and Edge Cases

Ensure comprehensive test coverage:

1. **Edge Case Testing:**
   - 0 items, 1 item, 1000+ items
   - Missing/malformed YAML frontmatter
   - Network failures during API calls
   - Permission denied errors
   - Concurrent modifications
   - Offline mode
   - Browser compatibility

2. **Coverage Goals:**
   - Utils: 90%+ coverage
   - Hooks: 85%+ coverage
   - Services: 80%+ coverage
   - Components: 75%+ coverage

3. **Performance Testing:**
   - Large library loads (100+ items)
   - Batch operations on 50+ items
   - Import of large CSV files
   - Google Drive cache performance

## Test Organization

```
src/
├── components/
│   └── __tests__/
│       ├── ItemCard.test.jsx
│       ├── SearchModal.test.jsx
│       └── ...
├── hooks/
│   └── __tests__/
│       ├── useItems.test.js
│       ├── useFilters.test.js
│       └── ...
├── services/
│   └── __tests__/
│       ├── omdbService.test.js
│       ├── openLibraryService.test.js
│       └── ...
├── utils/
│   └── __tests__/
│       ├── markdownUtils.test.js
│       ├── csvUtils.test.js
│       └── ...
└── test/
    ├── setup.js
    ├── mocks/
    │   ├── storage.js
    │   ├── apis.js
    │   └── ...
    └── fixtures/
        ├── sampleItems.js
        ├── sampleCSV.js
        └── ...

tests/
└── e2e/
    ├── storage.spec.js
    ├── item-management.spec.js
    ├── batch-operations.spec.js
    └── ...
```

## CI/CD Integration

1. **GitHub Actions Workflow:**
```yaml
name: Test Suite

on:
  pull_request:
    branches: [dev, main]
  push:
    branches: [dev, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

2. **Branch Protection Rules:**
   - Require status checks to pass before merging
   - Require minimum test coverage (80%)
   - Require code review approval

## Critical Constraints to Test

From the documentation, ensure tests validate:

1. **Data Integrity:**
   - Never lose user data during operations
   - Handle concurrent modifications gracefully
   - Validate all imported data
   - Provide clear feedback on errors

2. **File Format Preservation:**
   - Maintain Markdown + YAML frontmatter format
   - Preserve Obsidian compatibility
   - No breaking changes to file structure

3. **Privacy & Security:**
   - No data sent to third parties (except chosen APIs)
   - API keys stored securely
   - Respect Google Drive permissions

4. **Browser Compatibility:**
   - File System Access API (Chrome, Edge, Opera)
   - Google Drive (all modern browsers)
   - Offline functionality

## Success Criteria

The test suite is considered complete when:

1. ✅ All critical user paths are covered by E2E tests
2. ✅ All utility functions have >90% coverage
3. ✅ All custom hooks are thoroughly tested
4. ✅ Storage adapters are tested with mocked APIs
5. ✅ Import/export functionality is validated with real sample files
6. ✅ Keyboard navigation is fully tested
7. ✅ Accessibility standards are verified
8. ✅ CI/CD pipeline runs successfully on all PRs to dev branch
9. ✅ Documentation is updated with testing guidelines
10. ✅ Breaking changes are caught before merging to main

## Execution Instructions

Start by:
1. Setting up the test infrastructure (Phase 1)
2. Creating a few example tests for utilities to establish patterns
3. Gradually expanding coverage module by module
4. Integrating with CI/CD early to catch issues
5. Documenting testing patterns for future contributors

Focus on **critical path testing first** (storage operations, item CRUD, import/export) before expanding to comprehensive coverage of all features.

## Sample Test Examples

### Example 1: Utility Function Test (markdownUtils.test.js)

```javascript
import { describe, it, expect } from 'vitest';
import { parseMarkdownWithFrontmatter, generateMarkdownWithFrontmatter } from '../markdownUtils';

describe('markdownUtils', () => {
  describe('parseMarkdownWithFrontmatter', () => {
    it('should parse valid YAML frontmatter and content', () => {
      const markdown = `---
title: "Test Book"
author: "Test Author"
type: "book"
---

This is the note content.`;

      const result = parseMarkdownWithFrontmatter(markdown);
      
      expect(result.frontmatter).toEqual({
        title: 'Test Book',
        author: 'Test Author',
        type: 'book'
      });
      expect(result.content).toBe('This is the note content.');
    });

    it('should handle missing frontmatter', () => {
      const markdown = 'Just some content without frontmatter';
      const result = parseMarkdownWithFrontmatter(markdown);
      
      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe('Just some content without frontmatter');
    });

    it('should handle special characters in frontmatter', () => {
      const markdown = `---
title: "Book: A Story"
tags: ["sci-fi", "adventure"]
---

Content here.`;

      const result = parseMarkdownWithFrontmatter(markdown);
      
      expect(result.frontmatter.title).toBe('Book: A Story');
      expect(result.frontmatter.tags).toEqual(['sci-fi', 'adventure']);
    });
  });
});
```

### Example 2: Hook Test (useItems.test.js)

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useItems } from '../useItems';

// Mock storage adapter
const mockStorageAdapter = {
  isConnected: vi.fn(() => true),
  getItems: vi.fn(() => Promise.resolve([
    { id: '1', title: 'Test Book', type: 'book' }
  ])),
  saveItem: vi.fn((item) => Promise.resolve(item)),
  deleteItem: vi.fn(() => Promise.resolve())
};

describe('useItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load items from storage', async () => {
    const { result } = renderHook(() => useItems());
    
    act(() => {
      result.current.initializeStorage('filesystem');
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].title).toBe('Test Book');
    });
  });

  it('should save a new item', async () => {
    const { result } = renderHook(() => useItems());
    
    const newItem = {
      id: '2',
      title: 'New Book',
      type: 'book',
      author: 'Test Author'
    };

    await act(async () => {
      await result.current.saveItem(newItem);
    });

    expect(mockStorageAdapter.saveItem).toHaveBeenCalledWith(newItem);
  });
});
```

### Example 3: Component Test (ItemCard.test.jsx)

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
    rating: 4,
    tags: ['fiction', 'adventure']
  };

  it('should render book card with correct information', () => {
    render(
      <ItemCard
        item={mockItem}
        cardSize="medium"
        highlightColor="#3b82f6"
        selectionMode={false}
        selectedIds={new Set()}
        focusedId={null}
        onItemClick={vi.fn()}
        registerCardRef={vi.fn()}
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
        highlightColor="#3b82f6"
        selectionMode={false}
        selectedIds={new Set()}
        focusedId={null}
        onItemClick={mockOnClick}
        registerCardRef={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Test Book'));
    expect(mockOnClick).toHaveBeenCalledWith(mockItem, expect.any(Object));
  });

  it('should show selection indicator in selection mode', () => {
    const selectedIds = new Set(['1']);
    
    render(
      <ItemCard
        item={mockItem}
        cardSize="medium"
        highlightColor="#3b82f6"
        selectionMode={true}
        selectedIds={selectedIds}
        focusedId={null}
        onItemClick={vi.fn()}
        registerCardRef={vi.fn()}
      />
    );

    // Check for checkmark or selection indicator
    const card = screen.getByText('Test Book').closest('div');
    expect(card).toHaveClass('selected'); // Adjust based on actual implementation
  });
});
```

### Example 4: E2E Test (item-management.spec.js)

```javascript
import { test, expect } from '@playwright/test';

test.describe('Item Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and select storage (mock or test storage)
    await page.goto('http://localhost:5173');
    // Setup test storage...
  });

  test('should add a new item manually', async ({ page }) => {
    // Click add button
    await page.click('button:has-text("Add Manually")');
    
    // Fill in form
    await page.fill('input[name="title"]', 'Test Book');
    await page.fill('input[name="author"]', 'Test Author');
    await page.selectOption('select[name="type"]', 'book');
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify item appears in library
    await expect(page.locator('text=Test Book')).toBeVisible();
  });

  test('should edit an existing item', async ({ page }) => {
    // Click on an item
    await page.click('text=Test Book');
    
    // Enter edit mode
    await page.click('button:has-text("Edit")');
    
    // Modify title
    await page.fill('input[name="title"]', 'Updated Book Title');
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify update
    await expect(page.locator('text=Updated Book Title')).toBeVisible();
  });

  test('should delete an item', async ({ page }) => {
    // Click on an item
    await page.click('text=Test Book');
    
    // Click delete
    await page.click('button[title="Delete"]');
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Verify item is gone
    await expect(page.locator('text=Test Book')).not.toBeVisible();
  });
});
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Notes for Implementation

1. **Start Small**: Begin with the most critical utilities and hooks
2. **Mock Wisely**: Create reusable mocks for storage adapters and APIs
3. **Test User Flows**: E2E tests should mirror actual user behavior
4. **Performance Matters**: Use throttled updates in tests just like the app does
5. **Documentation**: Comment complex test setups and edge cases
6. **Maintenance**: Keep tests updated as features evolve

This comprehensive test suite will ensure the stability and reliability of Markdown Media Tracker as it continues to evolve.