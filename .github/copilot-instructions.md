# GitHub Copilot Instructions for Markdown Media Tracker

## Project Overview

Markdown Media Tracker is a local-first React application for tracking books and movies as Markdown files with YAML frontmatter. The app supports multiple storage backends (File System Access API for local directories and Google Drive) and is compatible with Obsidian via its Bases feature.

## Technology Stack

- **Frontend Framework**: React 19 with hooks
- **Build Tool**: Vite (using rolldown-vite)
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **State Management**: Custom React hooks (no Redux/MobX)
- **File Format**: Markdown with YAML frontmatter
- **Storage**: File System Access API (local) or Google Drive API
- **External APIs**: OMDb API (movies), Open Library API (books)

## Architecture Principles

### Modular Structure

The codebase follows a clean, modular architecture with clear separation of concerns:

- **Components** (`src/components/`): Reusable UI components organized by feature (modals, forms, cards, layout)
- **Hooks** (`src/hooks/`): Custom React hooks for state management and logic encapsulation
- **Services** (`src/services/`): External API integrations and persistence layers
- **Utils** (`src/utils/`): Pure utility functions for data transformation and validation
- **Constants** (`src/constants/`): Centralized configuration values and constants

### Key Design Patterns

1. **Hooks-based architecture**: All stateful logic is extracted into custom hooks
2. **Adapter pattern**: Storage backends (FileSystem, GoogleDrive) implement a common interface
3. **Pure functions**: Utility functions are side-effect free and testable
4. **Component composition**: Small, focused components with single responsibility
5. **Local-first**: All data stored locally; no server-side processing

## Code Organization

### Components

- Keep components focused and reusable
- Use functional components with hooks
- Props should be clearly documented
- Handle loading and error states appropriately
- Follow React best practices for performance (memoization when needed)

### Hooks

Located in `src/hooks/`:
- `useItems.js`: Item management and file operations
- `useFilters.js`: Search, filtering, and sorting logic
- `useSelection.js`: Bulk selection and batch operations
- `useTheme.js`: Theme colors and card size management
- `useKeyboardNavigation.js`: Keyboard shortcuts and navigation
- `useOmdbApi.js`: OMDb API key management

### Services

- `openLibraryService.js`: Book search integration
- `omdbService.js`: Movie search integration
- `configService.js`: localStorage persistence
- `FileSystemStorageAdapter.js`: File System Access API wrapper
- `GoogleDriveStorageAdapter.js`: Google Drive API wrapper
- `obsidianBase.js`: Obsidian Base file generation

### Utils

All utility functions should be pure (no side effects):
- `colorUtils.js`: Theme color manipulation
- `markdownUtils.js`: YAML frontmatter parsing/generation
- `csvUtils.js`: CSV import/export functionality
- `fileUtils.js`: File System Access API operations
- `filterUtils.js`: Item filtering and sorting logic
- `importUtils.js`: CSV import processing
- `commonUtils.js`: Shared utility functions

## Development Guidelines

### Code Style

- Use 2-space indentation
- Use semicolons
- Use async/await for asynchronous operations (avoid raw Promises)
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Keep functions focused (ideally < 50 lines)
- Extract complex logic to utility functions

### Best Practices

1. **React Hooks**: Follow the Rules of Hooks
2. **Error Handling**: Use try/catch blocks with user-friendly error messages
3. **Logging**: Use console.log for debugging (easily removable)
4. **No Breaking Changes**: All existing features must continue to work
5. **Browser Compatibility**: Target modern browsers (Chrome, Edge, Firefox, Safari)
6. **Accessibility**: Support keyboard navigation and screen readers
7. **Responsive Design**: Support mobile and desktop viewports

### Documentation

- Add comments explaining "why", not "what"
- Document assumptions and edge cases
- Include examples for complex functions
- Keep README.md and CONTRIBUTING.md up to date

## Building and Testing

### Development

```bash
npm install          # Install dependencies
npm run dev          # Start development server (default: http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Testing

- Test components in isolation when possible
- Verify utility functions work correctly with edge cases
- Test API service integration points
- Ensure custom hooks manage state correctly
- Test with real File System Access API and Google Drive API
- Test offline behavior and error cases

### Common Edge Cases to Consider

- 0 items, 1 item, 1000+ items
- Missing or malformed YAML frontmatter
- Network failures during API calls
- Permission denied errors
- Concurrent modifications
- Browser compatibility issues
- Offline mode

## File Format

Items are stored as individual Markdown files with YAML frontmatter:

```markdown
---
title: "Example Book"
author: "Author Name"
type: "book"
status: "read"
rating: 5
genre: "Fiction"
year: "2024"
---

Optional notes about the item go here.
```

## Important Constraints

### Must Preserve

- ✅ All existing functionality
- ✅ Markdown + YAML frontmatter format
- ✅ File System Access API support (local storage)
- ✅ Google Drive API support
- ✅ Current UI/UX design and theming
- ✅ Keyboard shortcuts and navigation
- ✅ Obsidian compatibility
- ✅ No breaking changes to file format

### Data Integrity

- Never lose user data during operations
- Handle concurrent modifications gracefully
- Validate all imported data
- Provide clear feedback on errors
- Allow user to undo destructive operations

### Privacy & Security

- All data stored locally (localStorage, IndexedDB for caching)
- No data sent to third parties (except chosen APIs: OMDb, Open Library, Google Drive)
- Use existing Google OAuth flow
- Respect user's Drive permissions
- Never commit API keys or secrets to version control

## Key Features

1. **Storage Backends**: Local directories (File System Access API) or Google Drive
2. **Search**: Online search for books (Open Library) and movies (OMDb)
3. **Manual Entry**: Create and edit items manually
4. **Import/Export**: CSV import/export with validation
5. **Batch Operations**: Bulk edit, delete, and status changes
6. **Filtering & Sorting**: Multiple filter and sort options
7. **Keyboard Navigation**: Comprehensive keyboard shortcuts
8. **Theming**: Customizable colors and card sizes
9. **Obsidian Integration**: Compatible with Obsidian Bases feature

## External Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md): Detailed contribution guidelines and project structure
- [README.md](../README.md): User documentation and feature descriptions
- [GOOGLE_DRIVE_SETUP.md](../GOOGLE_DRIVE_SETUP.md): Google Drive API setup instructions
- [GOOGLE_DRIVE_OPTIM.md](../GOOGLE_DRIVE_OPTIM.md): Google Drive performance optimization guide

## Common Tasks

### Adding a New Component

1. Create in appropriate `src/components/` subdirectory
2. Use functional component with hooks
3. Extract complex logic to custom hooks or utils
4. Add proper prop types documentation
5. Ensure accessibility (keyboard navigation, ARIA labels)

### Adding a New Utility Function

1. Create in appropriate `src/utils/` file
2. Keep function pure (no side effects)
3. Add JSDoc documentation
4. Add error handling
5. Consider edge cases

### Adding a New Hook

1. Create in `src/hooks/` directory
2. Follow naming convention: `useFeatureName.js`
3. Return clear, documented API
4. Handle loading and error states
5. Ensure proper cleanup in useEffect

### Modifying Storage Adapters

1. Both adapters must implement the same interface
2. Handle errors gracefully with user-friendly messages
3. Add retry logic for network failures
4. Validate all data before writing
5. Test with real APIs (not just mocks)

## Questions?

For questions about the codebase or contribution process, please:
1. Check CONTRIBUTING.md for detailed guidelines
2. Review existing code for patterns and examples
3. Open an issue for clarification on architectural decisions
