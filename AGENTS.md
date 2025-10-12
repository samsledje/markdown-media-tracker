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
- `fileSystemStorage.js`: File System Access API implementation
- `googleDriveStorageGIS.js`: Google Drive API implementation (using Google Identity Services)
- `storageAdapter.js`: Abstract base class defining storage interface
- `obsidianBase.js`: Obsidian Base file generation
- `driveCache.js`: IndexedDB caching layer for Google Drive performance
- `toastService.js`: User notification system

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

### Critical Patterns to Follow

1. **Progress Reporting**: When implementing long-running operations (imports, batch edits), use progress callbacks to update the UI. Example:
   ```javascript
   const items = await storage.loadItems((current, total) => {
     setProgress({ current, total, status: 'Loading...' });
   });
   ```

2. **Batch Operations**: Never reload items after each individual operation. Collect all changes, apply them, then reload once:
   ```javascript
   // WRONG: reloads after each save
   for (const item of items) {
     await saveItem(item);
     await reloadItems(); // ❌ Very slow!
   }
   
   // RIGHT: batch save, reload once
   for (const item of items) {
     await saveItem(item, { skipReload: true });
   }
   await reloadItems(); // ✅ Fast!
   ```

3. **Error Handling**: Always show user-friendly error messages via toast notifications:
   ```javascript
   try {
     await riskyOperation();
     toast.success('Operation completed successfully');
   } catch (error) {
     console.error('Detailed error:', error);
     toast.error('User-friendly error message');
   }
   ```

4. **Storage Operations**: Always check if storage is connected before operations:
   ```javascript
   if (!storage?.isConnected()) {
     toast.error('Please select a storage location first');
     return;
   }
   ```

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
- Never write one-off test scripts, but integrate new tests into the existing suite

### Common Edge Cases to Consider

- 0 items, 1 item, 500 items, 1000+ items
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

## Import/Export System

### Supported Import Formats

1. **Goodreads CSV**: Export from Goodreads (My Books → Import/Export)
   - Maps columns: Title, Author, My Rating, My Review, Date Read
   - Enriches metadata via Open Library ISBN lookups
   - Deduplicates by title + author

2. **Letterboxd ZIP**: Full export from Letterboxd (Settings → Data → Export)
   - Processes multiple files in order: watched.csv → watchlist.csv → ratings.csv → reviews.csv → films.csv
   - Matches movies across files by title, director, year
   - Merges ratings, reviews, tags, and liked status
   - Enriches metadata via OMDb lookups

3. **Generic CSV**: Basic CSV with standard columns
   - Supports custom column mappings
   - Validates required fields (title, type)

### CSV Export Format

Standard format includes:
- `title`, `type` (book/movie), `author`/`director`, `year`, `rating`
- `status`, `date_read`/`date_watched`, `date_added`
- `tags` (semicolon-separated), `cover`, `notes`

### Import Implementation Notes

- Use `processImportFile()` from `importUtils.js` for all imports
- Deduplication uses lowercase comparison of `title + author/director`
- Progress callbacks should update UI every 5-10 items
- Failed individual items should log errors but not stop import
- Always use batch-optimized saving (don't reload after each item)

## External Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md): Detailed contribution guidelines and project structure
- [README.md](../README.md): User documentation and feature descriptions
- [AGENTS.md](../AGENTS.md): Instructions for an LLM-based coding agent to understand the repository

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

## Environment Variables

The project uses two configuration systems:

### 1. Google Drive API Configuration (.env.local)

Create a `.env.local` file (not committed to git) based on `.env.template`:

```bash
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_google_api_key
```

- Required only for Google Drive storage functionality
- See GOOGLE_DRIVE_SETUP.md for detailed setup instructions
- Variables must be prefixed with `VITE_` to be accessible in frontend code
- Never commit actual credentials to version control

### 2. OMDb API Configuration (src/config.js)

Copy `src/config.js.template` to `src/config.js` and add your OMDb API key:

```javascript
export const config = {
  omdbApiKey: 'your-omdb-api-key-here'
};
```

- Required only for movie search functionality
- Get free key from: http://www.omdbapi.com/apikey.aspx
- File should not be committed (already in .gitignore)
- App allows runtime configuration via UI if file not present

## Storage Architecture

### Storage Adapter Pattern

Both storage backends implement the `StorageAdapter` abstract base class:

**Required Methods:**
- `initialize()`: Setup connection
- `isConnected()`: Check connection status
- `getStorageInfo()`: Return storage location identifier
- `selectStorage()`: Let user choose storage location
- `disconnect()`: Close connection
- `loadItems()`: Load all items with optional progress callback
- `saveItem(item)`: Save single item
- `deleteItem(item)`: Move item to trash, return undo info
- `restoreItem(undoInfo)`: Restore from trash
- `writeFile(filename, content)`: Write arbitrary files (e.g., Obsidian Base)
- `fileExists(filename)`: Check file existence
- `readFile(filename)`: Read file content

**Implementation Notes:**
- Both adapters convert between Markdown files and JavaScript objects
- Use `parseMarkdown()` and `generateMarkdown()` from `markdownUtils.js`
- Items have a unique `id` field (filename without extension)
- Deleted items go to `.trash` subdirectory (can be restored)
- Error handling must be graceful with user-friendly messages

### FileSystemStorage

- Uses File System Access API (`showDirectoryPicker`)
- Only supported in Chromium browsers on desktop
- Stores `FileSystemDirectoryHandle` in memory (not serializable)
- Direct file system access (fast, no network latency)
- Browser permission model handles security

### GoogleDriveStorageGIS

- Uses Google Identity Services (GIS) for authentication
- Uses Google Drive API v3 for file operations
- Creates/uses folder named "MarkdownMediaTracker" (or custom name)
- Uses `driveCache.js` (IndexedDB) for performance optimization
- Supports batched operations (100 files at a time)
- Handles API rate limits and network errors
- Paginated file listing (supports >1000 files)
- Progress reporting via callbacks for long operations

## Performance Considerations

### Large Libraries (100+ items)

**Google Drive Optimizations:**
- First load: Downloads all files, shows progress
- Subsequent loads: Only downloads new/modified files (using cache)
- Cache stored in IndexedDB (`driveCache.js`)
- Concurrent downloads: 100 files at a time (HTTP/2 multiplexing)
- User can manually clear cache via Storage Indicator menu

**Batch Operations:**
- Throttled progress updates (every 5-10 items, not every item)
- Deferred UI reloads (reload once after all operations complete)
- Avoid unnecessary re-renders during bulk operations

**Import Operations:**
- CSV imports use batch-optimized saving
- Prevent reloading after each individual item
- Show real-time progress indicator
- Continue on individual item failures

## Known Issues & Edge Cases

### Current Known Issues (from TODO.md)

1. **OMDb API Rate Limits**: Partially implemented warning when API key runs out
2. **Hotkey Reliability**: Keyboard shortcuts sometimes stop working (needs investigation)
3. **Missing Features**: 
   - Loading/progress bar for large batch edits
   - Auto-fetch covers for items with missing cover images

### Edge Cases to Test

- **Empty states**: 0 items, no storage selected
- **Large datasets**: 1000+ items (test performance)
- **Malformed data**: Invalid YAML frontmatter, missing required fields
- **Network failures**: Offline mode, API timeouts, rate limits
- **Concurrent modifications**: Multiple tabs/devices (Google Drive only)
- **Browser permissions**: Denied access, revoked permissions
- **Special characters**: Titles with `/`, `:`, or other filesystem-unfriendly chars
- **Duplicate prevention**: Import deduplication logic (title + author/director)

## Testing Strategy

### Manual Testing Checklist

1. **Storage Backends**:
   - Test local directory selection and persistence
   - Test Google Drive authentication flow
   - Test switching between storage types
   - Test offline behavior

2. **CRUD Operations**:
   - Create items manually and via search
   - Edit existing items
   - Delete single and multiple items
   - Verify trash/restore functionality

3. **Import/Export**:
   - Import Goodreads CSV (test with sample data)
   - Import Letterboxd ZIP (test with sample data)
   - Export CSV and verify format
   - Test deduplication during import

4. **Search & Filters**:
   - Search by title/author
   - Filter by type, status, rating, tags, year
   - Sort by various fields
   - Combine multiple filters

5. **Keyboard Navigation**:
   - Test all shortcuts from help modal
   - Test navigation in different layouts (grid sizes)
   - Test selection mode shortcuts
   - Test modal-specific shortcuts

6. **UI/UX**:
   - Test responsive design (mobile, tablet, desktop)
   - Test theme customization
   - Test card size changes
   - Test all modals and forms

### Browser Compatibility

- **Chrome/Edge**: Full support (File System Access API + Google Drive)
- **Firefox**: Google Drive only (no File System Access API)
- **Safari**: Google Drive only (limited File System Access API support)
- **Mobile browsers**: Google Drive only

## Debugging Tips

### Common Issues

**"Storage adapter not connected"**:
- User hasn't selected storage yet
- Permission was revoked
- Google Drive token expired

**"Failed to load items"**:
- Check browser console for specific error
- Verify file format (valid YAML frontmatter)
- Check network tab for API failures

**"Keyboard shortcuts not working"**:
- Check if modal is open (shortcuts are modal-aware)
- Verify focus is on body (not in input field)
- Check browser console for errors

**"Google Drive slow to load"**:
- First load is expected to be slow for large libraries
- Check Network tab to verify caching is working
- Try clearing cache from Storage Indicator menu

### Logging

The codebase uses `console.log` for debugging:
- Storage operations logged in adapter classes
- API calls logged in service files
- Hook state changes can be logged in custom hooks
- Remove verbose logging before production deployment

## Questions?

For questions about the codebase or contribution process, please:

1. Check CONTRIBUTING.md for detailed guidelines
2. Review existing code for patterns and examples
3. Open an issue for clarification on architectural decisions
