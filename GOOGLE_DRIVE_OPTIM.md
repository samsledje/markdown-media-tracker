# Google Drive Performance Optimization Guide

## Project Context

**Application:** Markdown Media Tracker - A React app for tracking books and movies stored as Markdown files with YAML frontmatter.

**Storage Backends:**
1. Local File System (File System Access API) - ✅ Works well
2. Google Drive (Google Drive API) - ⚠️ Severe performance issues

**Tech Stack:** React + Vite, Google Identity Services, Google Drive API v3

## Current Performance Problems

### Problem 1: Slow Initial Connection (30+ seconds with 100+ files)

**Symptoms:**
- When users connect to Google Drive, app loads ALL markdown files sequentially
- Each file requires separate Drive API call to fetch content
- With 100+ files, this takes 30+ seconds
- Users see blank screen during loading
- App appears frozen/unresponsive

**Root Cause:** Synchronous, sequential loading of all files during connection initialization.

### Problem 2: Catastrophically Slow CSV Imports (O(n²) complexity)

**Symptoms:**
- Import gets progressively slower as it processes more rows
- With 100 existing items, importing 50 new items can take 10+ minutes
- Each row takes longer than the previous one

**Current Flow:**
```
For each CSV row:
  1. Load ALL existing items from Drive (n items)
  2. Check for duplicates against all items
  3. Save new item to Drive
  4. Repeat (now n+1 items to load next time)
```

**Example Timeline:**
- Row 1: Load 100 items → save → now 101 items (2 seconds)
- Row 2: Load 101 items → save → now 102 items (2.1 seconds)
- Row 3: Load 102 items → save → now 103 items (2.2 seconds)
- ...
- Row 50: Load 149 items → save → now 150 items (3.5 seconds)
- **Total: 125+ seconds for 50 items**

**Root Cause:** O(n²) complexity - reloading all items for each row's duplicate check.

---

## Required Optimizations

## Optimization 1: Progressive Loading with IndexedDB Caching

### Goal
Make initial connection instant and subsequent loads from cache, with background sync for changes.

### Requirements

#### 1.1 Quick Connection (< 2 seconds)
```javascript
async connect() {
  // Only authenticate and get folder metadata
  await this.authenticate();
  this.folderId = await this.getFolderId();
  
  // Get file count without loading content
  const metadata = await this.getLibraryMetadata();
  
  return { 
    connected: true, 
    itemCount: metadata.totalFiles,
    lastModified: metadata.lastModified
  };
}
```

**Key Points:**
- Authenticate with Google Drive
- Get folder info and file count only
- Use Drive API `fields` parameter to minimize response
- Don't load any file content
- Return success immediately

#### 1.2 IndexedDB Caching Layer

**Create:** `src/utils/cacheUtils.js`

**Required Class:** `LibraryCache`

**Required Methods:**
```javascript
class LibraryCache {
  async init()                           // Initialize IndexedDB
  async getCachedItems()                 // Retrieve all cached items
  async updateCache(items)               // Update cache with items array
  async getCacheMetadata()               // Get lastSyncTime, itemCount, version
  async clearCache()                     // Invalidate entire cache
  async removeItems(itemIds)             // Remove specific items from cache
  async getCacheStats()                  // Get cache size, age, etc.
}
```

**Database Schema:**
```javascript
Database: 'MediaTrackerCache'
Version: 1

ObjectStore: 'items'
  - keyPath: 'id'
  - indexes:
    - 'modifiedTime' (for sync queries)
    - 'type' (for filtering)

ObjectStore: 'metadata'
  - keyPath: 'key'
  - stores: lastSyncTime, cacheVersion, itemCount
```

**Storage Strategy:**
- Store complete item objects with all metadata
- Include Drive file ID for sync operations
- Store lastSyncTime for incremental updates
- Version cache to handle schema changes

#### 1.3 Smart Loading Strategy

**Decision Tree:**
```
On connection:
  ├─ Check if cache exists
  │   ├─ Cache exists and fresh (< 5 minutes)
  │   │   ├─ Load from cache immediately (< 1 second)
  │   │   └─ Start background sync for changes
  │   │
  │   └─ Cache missing or stale
  │       └─ Progressive load from Drive with UI updates
  │
  └─ Cache error
      └─ Fall back to progressive load
```

**Implementation Notes:**
- Fresh cache = modified within last 5 minutes
- Background sync = silent, non-blocking
- UI should show cache vs. Drive loading state

#### 1.4 Progressive Loading Implementation

**Load Strategy:**
```javascript
async progressiveLoad(adapter, onProgress) {
  let allItems = [];
  let pageToken = null;
  const pageSize = 50;
  
  do {
    // Load batch
    const result = await adapter.loadItems({ pageSize, pageToken });
    
    // Update UI immediately with new items
    allItems = [...allItems, ...result.items];
    onProgress({
      current: allItems.length,
      total: result.hasMore ? allItems.length + pageSize : allItems.length,
      items: allItems
    });
    
    // Update cache incrementally
    await cache.updateCache(result.items);
    
    pageToken = result.nextPageToken;
    
  } while (pageToken);
  
  // Mark sync complete
  await cache.updateMetadata({ 
    lastSyncTime: new Date().toISOString(),
    itemCount: allItems.length 
  });
  
  return allItems;
}
```

**Key Features:**
- Load in batches of 50 items
- Update UI after each batch (show items as they load)
- Show progress: "Loading 50 of 150 items..."
- Use Drive API pagination (`pageToken`, `pageSize`)
- Update cache after each batch (incremental)
- Handle errors gracefully (continue with partial data)

**Drive API Pagination:**
```javascript
// In GoogleDriveStorageAdapter
async loadItems(options = {}) {
  const { pageSize = 50, pageToken = null } = options;
  
  const response = await gapi.client.drive.files.list({
    q: `'${this.folderId}' in parents and trashed=false`,
    pageSize: pageSize,
    pageToken: pageToken,
    fields: 'files(id, name, modifiedTime), nextPageToken',
    orderBy: 'modifiedTime desc' // Newest first
  });
  
  // Parse files in parallel (within batch)
  const items = await Promise.all(
    response.result.files.map(file => this.parseFileToItem(file))
  );
  
  return {
    items: items,
    nextPageToken: response.result.nextPageToken,
    hasMore: !!response.result.nextPageToken
  };
}
```

#### 1.5 Background Sync

**Purpose:** After loading from cache, silently sync changes without blocking UI.

**Implementation:**
```javascript
async syncChanges(lastSyncTime) {
  try {
    // Query only files modified since last sync
    const query = `'${this.folderId}' in parents and trashed=false and modifiedTime > '${lastSyncTime}'`;
    
    const response = await gapi.client.drive.files.list({
      q: query,
      fields: 'files(id, name, modifiedTime)',
      pageSize: 100 // Assume changes are small
    });
    
    // Download and parse only changed files
    const changedItems = await Promise.all(
      response.result.files.map(file => this.parseFileToItem(file))
    );
    
    return changedItems;
    
  } catch (error) {
    console.warn('Background sync failed:', error);
    return []; // Fail silently, cache is still valid
  }
}
```

**Merge Strategy:**
```javascript
// In useItems hook
const syncInBackground = async (lastSyncTime) => {
  const changedItems = await adapter.syncChanges(lastSyncTime);
  
  if (changedItems.length > 0) {
    setItems(prevItems => {
      // Create map of existing items
      const itemMap = new Map(prevItems.map(item => [item.id, item]));
      
      // Update/add changed items
      changedItems.forEach(item => itemMap.set(item.id, item));
      
      return Array.from(itemMap.values());
    });
    
    // Update cache
    await cache.updateCache(changedItems);
  }
  
  // Update sync timestamp
  await cache.updateMetadata({ 
    lastSyncTime: new Date().toISOString() 
  });
};
```

### Files to Create/Modify

**Create:**
- `src/utils/cacheUtils.js` - Complete IndexedDB implementation

**Modify:**
- `src/hooks/useItems.js` - Add caching logic, progressive loading
- `src/services/GoogleDriveStorageAdapter.js` - Add pagination, sync methods
- `src/components/MediaTracker.jsx` - Add loading progress UI

---

## Optimization 2: Fix CSV Import Performance

### Goal
Change import from O(n²) to O(n) complexity by loading once and batch saving.

### Requirements

#### 2.1 Pre-load Items Once

**New Import Flow:**
```javascript
async function processCSVImport(file, saveItem, storageAdapter) {
  // PHASE 1: Load existing items ONCE
  const existingItems = await storageAdapter.loadAllItems();
  
  // PHASE 2: Build lookup map for O(1) duplicate checking
  const duplicateMap = buildItemHashMap(existingItems);
  
  // PHASE 3: Parse and validate CSV
  const csvData = await parseCSVFile(file);
  
  // PHASE 4: Check duplicates in memory
  const { newItems, duplicates } = validateItems(csvData, duplicateMap);
  
  // PHASE 5: Batch save all new items
  await storageAdapter.batchSave(newItems);
  
  return {
    added: newItems.length,
    skipped: duplicates.length,
    format: detectedFormat
  };
}
```

**Hash Function for Duplicate Detection:**
```javascript
function getItemHash(item) {
  const title = (item.title || '').toLowerCase().trim();
  const author = (item.author || item.director || '').toLowerCase().trim();
  const year = item.year || '';
  
  return `${title}|||${author}|||${year}`;
}

function buildItemHashMap(items) {
  return new Map(
    items.map(item => [getItemHash(item), item])
  );
}
```

**Key Points:**
- Load ALL existing items only ONCE at start
- Use Map with composite key for O(1) lookups
- Never call `loadItems()` inside the loop
- Keep all checking in memory
- Track new vs. duplicate items separately

#### 2.2 Batch Processing

**Validation Phase:**
```javascript
function validateItems(csvRows, duplicateMap) {
  const newItems = [];
  const duplicates = [];
  
  for (const row of csvRows) {
    const item = csvRowToItem(row);
    const hash = getItemHash(item);
    
    if (duplicateMap.has(hash)) {
      duplicates.push({ row, reason: 'Duplicate', existing: duplicateMap.get(hash) });
    } else {
      newItems.push(item);
      duplicateMap.set(hash, item); // Prevent duplicates within CSV
    }
  }
  
  return { newItems, duplicates };
}
```

**Benefits:**
- All validation happens in memory (fast)
- Can show preview before saving
- User can review duplicates
- No partial imports on validation failure

#### 2.3 Drive API Batch Requests

**Implement in GoogleDriveStorageAdapter:**

```javascript
async batchSave(items) {
  const batchSize = 50; // Drive API limit is 100, use 50 for safety
  const batches = [];
  
  // Split into batches
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  // Process batches
  const results = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    // Show progress
    console.log(`Saving batch ${i + 1} of ${batches.length}`);
    
    // Use Drive batch API
    const batchResults = await this.saveBatch(batch);
    results.push(...batchResults);
  }
  
  return results;
}

async saveBatch(items) {
  // Create multipart batch request
  const boundary = 'batch_' + Date.now();
  const delimiter = `--${boundary}`;
  const closeDelimiter = `--${boundary}--`;
  
  let batchBody = '';
  
  for (const item of items) {
    const markdown = generateMarkdown(item);
    const metadata = {
      name: `${sanitizeFilename(item.title)}-${Date.now()}.md`,
      parents: [this.folderId],
      mimeType: 'text/plain'
    };
    
    batchBody += delimiter + '\n';
    batchBody += 'Content-Type: application/http\n\n';
    batchBody += 'POST /upload/drive/v3/files?uploadType=multipart\n';
    batchBody += 'Content-Type: multipart/related; boundary=foo_bar\n\n';
    batchBody += '--foo_bar\n';
    batchBody += 'Content-Type: application/json; charset=UTF-8\n\n';
    batchBody += JSON.stringify(metadata) + '\n\n';
    batchBody += '--foo_bar\n';
    batchBody += 'Content-Type: text/plain\n\n';
    batchBody += markdown + '\n';
    batchBody += '--foo_bar--\n';
  }
  
  batchBody += closeDelimiter;
  
  // Send batch request
  const response = await fetch('https://www.googleapis.com/batch/drive/v3', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/mixed; boundary=${boundary}`,
      'Authorization': `Bearer ${this.accessToken}`
    },
    body: batchBody
  });
  
  // Parse batch response
  return this.parseBatchResponse(await response.text());
}
```

**Alternative: Simple Parallel Approach** (if batch API is too complex)
```javascript
async batchSave(items) {
  const batchSize = 10; // Limit parallelism
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Save in parallel (up to batchSize at once)
    const batchResults = await Promise.all(
      batch.map(item => this.saveItem(item))
    );
    
    results.push(...batchResults);
    
    // Show progress
    console.log(`Saved ${Math.min(i + batchSize, items.length)} of ${items.length}`);
  }
  
  return results;
}
```

#### 2.4 Import Flow Comparison

**Old Flow (O(n²)):**
```
Time complexity: O(n²)
Space complexity: O(1)

for each of 50 CSV rows {
  loadAllItems()      // O(n) - loads 100-150 items
  checkDuplicate()    // O(n) - checks against all items
  saveItem()          // O(1) - saves 1 item
}

Total: 50 × (n + n + 1) ≈ 50 × 200 = 10,000 operations
Time: ~5-10 minutes
```

**New Flow (O(n)):**
```
Time complexity: O(n + m) where n=existing, m=new
Space complexity: O(n)

existingItems = loadAllItems()              // O(n) - load 100 items once
duplicateMap = buildHashMap(existingItems)  // O(n) - build map once

newItems = []
for each of 50 CSV rows {                   // O(m)
  hash = getItemHash(row)                   // O(1)
  if (!duplicateMap.has(hash)) {            // O(1)
    newItems.push(row)                      // O(1)
  }
}

batchSaveAll(newItems)                      // O(m) - save 45 items once

Total: n + n + m + m = 2n + 2m ≈ 290 operations
Time: ~10-20 seconds
```

**Performance Improvement:** 30-50x faster!

#### 2.5 Import UI Improvements

**Progress Phases:**
```javascript
const [importProgress, setImportProgress] = useState({
  phase: 'idle',        // idle, loading, validating, saving, complete
  current: 0,
  total: 0,
  message: ''
});

// Phase 1: Loading existing items
setImportProgress({
  phase: 'loading',
  current: 0,
  total: 0,
  message: 'Loading existing items...'
});

// Phase 2: Validating CSV
setImportProgress({
  phase: 'validating',
  current: 0,
  total: csvRows.length,
  message: 'Validating 500 rows...'
});

// Phase 3: Deduplication results
setImportProgress({
  phase: 'ready',
  current: 0,
  total: 0,
  message: `Found ${newItems.length} new items, ${duplicates.length} duplicates`
});

// Phase 4: Saving
setImportProgress({
  phase: 'saving',
  current: savedCount,
  total: newItems.length,
  message: `Saving batch ${currentBatch} of ${totalBatches}...`
});

// Phase 5: Complete
setImportProgress({
  phase: 'complete',
  current: newItems.length,
  total: newItems.length,
  message: `Successfully imported ${newItems.length} items!`
});
```

**Import Preview (Optional but Recommended):**
```javascript
// Show preview before saving
const ImportPreview = ({ newItems, duplicates, onConfirm, onCancel }) => (
  <div className="import-preview">
    <h3>Import Preview</h3>
    <div className="stats">
      <p>✅ {newItems.length} new items will be added</p>
      <p>⏭️ {duplicates.length} duplicates will be skipped</p>
    </div>
    
    {duplicates.length > 0 && (
      <details>
        <summary>View duplicates</summary>
        <ul>
          {duplicates.slice(0, 10).map(dup => (
            <li key={dup.row.title}>{dup.row.title} - {dup.reason}</li>
          ))}
        </ul>
      </details>
    )}
    
    <button onClick={onConfirm}>Import {newItems.length} items</button>
    <button onClick={onCancel}>Cancel</button>
  </div>
);
```

### Files to Modify

**Critical Changes:**
- `src/utils/importUtils.js` - Complete refactor of `processCSVImport()`
- `src/services/GoogleDriveStorageAdapter.js` - Add `batchSave()` method

**UI Updates:**
- `src/components/MediaTracker.jsx` - Add import progress modal
- Consider creating `src/components/modals/ImportProgressModal.jsx`

---

## Optimization 3: Additional Performance Improvements

### 3.1 Metadata-Only Queries

**When to Use:**
- Getting file count
- Checking if file exists
- Getting modification times for sync

**How to Implement:**
```javascript
// Instead of full file fetch
const response = await gapi.client.drive.files.list({
  q: `'${folderId}' in parents`,
  fields: 'files(id, name, modifiedTime)', // Only fetch what you need
  pageSize: 1000
});

// This returns ~10KB instead of ~1MB
```

**Apply to:**
- Initial connection (just count files)
- Background sync (just check modified times)
- Duplicate checking (just compare names/metadata)

### 3.2 Parallel Processing with Limits

**Problem:** Loading 100 files sequentially is slow, but loading 100 in parallel can hit rate limits.

**Solution:** Controlled parallelism
```javascript
async function processInParallel(items, asyncFn, concurrency = 5) {
  const results = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(item => asyncFn(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}

// Usage
const items = await processInParallel(
  files, 
  file => adapter.parseFileToItem(file),
  5 // Process 5 files at a time
);
```

**Benefits:**
- 5x faster than sequential
- Won't hit rate limits (stays under 10 req/sec)
- Predictable memory usage

### 3.3 Error Handling & Rate Limiting

**Exponential Backoff:**
```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) { // Rate limit
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await sleep(delay);
      } else if (i === maxRetries - 1) {
        throw error; // Give up after max retries
      } else {
        await sleep(1000); // Generic retry delay
      }
    }
  }
}

// Usage
const response = await retryWithBackoff(() => 
  gapi.client.drive.files.get({ fileId: id })
);
```

**Graceful Degradation:**
```javascript
try {
  // Try to load from Drive
  const items = await loadFromDrive();
} catch (error) {
  console.error('Drive error:', error);
  
  // Fall back to cache
  const cachedItems = await cache.getCachedItems();
  
  if (cachedItems.length > 0) {
    showNotification('Offline mode - showing cached items');
    return cachedItems;
  } else {
    showError('Unable to load library. Please check your connection.');
    return [];
  }
}
```

### 3.4 Virtual Scrolling (For 500+ Items)

**Problem:** Rendering 500+ cards can be slow, even with React.

**Solution:** Only render visible items

**Recommended Library:** `react-window` or `react-virtual`

**Implementation Example:**
```javascript
import { FixedSizeGrid } from 'react-window';

const ItemGrid = ({ items, cardSize }) => {
  const columnCount = getColumnCount(cardSize); // Calculate based on viewport
  const rowCount = Math.ceil(items.length / columnCount);
  
  return (
    <FixedSizeGrid
      columnCount={columnCount}
      columnWidth={getCardWidth(cardSize)}
      height={window.innerHeight - 200}
      rowCount={rowCount}
      rowHeight={getCardHeight(cardSize)}
      width={window.innerWidth}
    >
      {({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        const item = items[index];
        
        if (!item) return null;
        
        return (
          <div style={style}>
            <ItemCard item={item} />
          </div>
        );
      }}
    </FixedSizeGrid>
  );
};
```

**When to Use:**
- Only if user has 500+ items
- Can be feature-flagged
- Test thoroughly with keyboard navigation

---

## Implementation Plan

### Phase 1: Foundation (Day 1-2)
**Priority: Critical**

1. Create `cacheUtils.js` with IndexedDB implementation
   - Test cache CRUD operations independently
   - Add error handling and versioning
   - Verify in Chrome DevTools → Application → IndexedDB

2. Update `GoogleDriveStorageAdapter.js`
   - Split `connect()` from `loadItems()`
   - Add pagination support
   - Add `syncChanges()` method
   - Test with small dataset (10 files)

3. Basic `useItems` integration
   - Add cache initialization
   - Implement cache-first loading
   - Test: Fresh cache vs. stale cache vs. no cache

**Success Criteria:**
- ✅ Cache working in IndexedDB
- ✅ Can load from cache in < 1 second
- ✅ Progressive loading works with pagination

### Phase 2: Import Optimization (Day 3)
**Priority: Critical**

1. Refactor `importUtils.js`
   - Implement single-load + batch-save pattern
   - Add hash-based duplicate detection
   - Test with small CSV (10 rows)

2. Add `batchSave()` to GoogleDriveStorageAdapter
   - Start with simple parallel approach (Promise.all)
   - Limit concurrency to 5-10
   - Test with 20-30 items

3. Test import performance
   - Test: 50 rows, 100 existing items
   - Target: < 30 seconds
   - Compare before/after times

**Success Criteria:**
- ✅ Import 50 items in < 30 seconds
- ✅ No reloading items during import
- ✅ Duplicate detection works correctly

### Phase 3: UI/UX (Day 4)
**Priority: High**

1. Add loading progress indicators
   - Progressive loading progress bar
   - Import progress modal
   - Cache status indicator

2. Background sync implementation
   - Silent sync after cache load
   - Show notification if changes found
   - Handle errors gracefully

3. Polish and testing
   - Test with 100+ item library
   - Test various import scenarios
   - Test offline behavior

**Success Criteria:**
- ✅ User sees progress feedback
- ✅ Background sync works silently
- ✅ Offline mode degrades gracefully

### Phase 4: Advanced Features (Day 5 - Optional)
**Priority: Medium**

1. Error handling improvements
   - Retry logic with exponential backoff
   - Better error messages
   - Recovery from partial failures

2. Additional optimizations
   - Parallel processing with limits
   - Metadata-only queries
   - Virtual scrolling (if needed)

3. Performance monitoring
   - Add timing logs
   - Track cache hit rate
   - Monitor Drive API usage

**Success Criteria:**
- ✅ All error cases handled gracefully
- ✅ Performance metrics visible in console
- ✅ Works reliably with 500+ items

---

## Testing Strategy

### Test Scenarios

#### Cache Testing
- [ ] Empty cache → Progressive load → Items appear incrementally
- [ ] Fresh cache (< 5 min) → Instant load → Background sync
- [ ] Stale cache (> 5 min) → Progressive load → Cache updated
- [ ] Corrupted cache → Graceful fallback → Rebuild cache
- [ ] Cache size limits → Old items cleaned up

#### Loading Testing
- [ ] 0 items → Quick connection
- [ ] 10 items → Load in 1-2 seconds
- [ ] 100 items → Load in 5-8 seconds (progressive)
- [ ] 500 items → Load in 15-20 seconds (progressive)
- [ ] Network error during load → Partial data + error message

#### Import Testing
- [ ] Import 10 items (empty library) → < 5 seconds
- [ ] Import 50 items (100 existing) → < 30 seconds
- [ ] Import 200 items (50 existing) → < 90 seconds
- [ ] Import with duplicates → Correct count skipped
- [ ] Import with errors → Partial success + error report
- [ ] Import multiple CSVs sequentially → No conflicts

#### Sync Testing
- [ ] Background sync finds 0 changes → No UI update
- [ ] Background sync finds 5 changes → Smooth merge
- [ ] Background sync fails → Cached data still valid
- [ ] Manual sync button → Force refresh works

#### Error Testing
- [ ] Network offline → Cache works, sync queued
- [ ] Rate limit hit (429) → Retry with backoff
- [ ] Auth token expired → Re-authenticate
- [ ] Drive quota exceeded → Clear error message
- [ ] Corrupted markdown file → Skip + log error

### Performance Benchmarks

**Target Performance:**
| Scenario | Target | Current | Improvement |
|----------|--------|---------|-------------|
| Initial connection | < 2s | 30s+ | 15x faster |
| First 50 items visible | < 5s | 30s+ | 6x faster |
| Load from cache | < 1s | N/A | Instant |
| Import 50 items | < 30s | 10 min | 20x faster |
| Import 200 items | < 90s | 60 min | 40x faster |
| Background sync | 2-5s | N/A | Silent |

**How to Measure:**
```javascript
// Add timing to key operations
const start = performance.now();
await adapter.connect();
const duration = performance.now() - start;
console.log(`Connection took ${duration.toFixed(0)}ms`);
```

---

## Code Quality Guidelines

### General Principles
1. **Maintain existing patterns** - Use async/await, hooks, functional components
2. **Add JSDoc comments** - Document complex functions and classes
3. **Error handling** - Try/catch blocks, user-friendly messages
4. **Logging** - Console.log for debugging, easily removable
5. **No breaking changes** - All existing features must work

### Code Style
- Use existing formatting (2-space indentation, semicolons)
- Follow React hooks best practices
- Use descriptive variable names
- Keep functions focused (< 50 lines ideal)
- Extract complex logic to utility functions

### Documentation
- Add comments explaining "why", not "what"
- Document assumptions and edge cases
- Include examples for complex functions
- Update README with new features/requirements

### Testing
- Test happy path
- Test error cases
- Test edge cases (0 items, 1 item, 1000 items)
- Test offline behavior
- Test with real Drive API (not just mocks)

---

## File Structure Reference

### New Files to Create
```
src/
└── utils/
    └── cacheUtils.js          # IndexedDB cache implementation (NEW)
```

### Files to Modify

#### High Priority (Core Functionality)
```
src/
├── hooks/
│   └── useItems.js            # Add cache integration, progressive loading
├── services/
│   └── GoogleDriveStorageAdapter.js  # Add pagination, batchSave, syncChanges
└── utils/
    └── importUtils.js         # Refactor to O(n) complexity
```

#### Medium Priority (UI/UX)
```
src/
├── components/
│   ├── MediaTracker.jsx       # Add loading progress UI
│   └── modals/
│       └── ImportProgressModal.jsx  # Import progress (optional new file)
```

#### Low Priority (Keep Unchanged)
```
src/
├── services/
│   └── FileSystemStorageAdapter.js   # No changes needed
├── hooks/
│   ├── useFilters.js                 # No changes needed
│   ├── useSelection.js               # No changes needed
│   ├── useTheme.js                   # No changes needed
│   └── useKeyboardNavigation.js      # No changes needed
└── utils/
    ├── markdownUtils.js              # No changes needed
    └── fileUtils.js                  # No changes needed
```

---

## Detailed Implementation Examples

### Example 1: IndexedDB Cache Implementation

**File:** `src/utils/cacheUtils.js`

```javascript
/**
 * IndexedDB cache for storing media library items locally
 * Enables instant loading and offline access
 */
export class LibraryCache {
  constructor() {
    this.dbName = 'MediaTrackerCache';
    this.version = 1;
    this.db = null;
  }

  /**
   * Initialize IndexedDB database
   * Creates object stores if they don't exist
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create items store
        if (!db.objectStoreNames.contains('items')) {
          const itemStore = db.createObjectStore('items', { keyPath: 'id' });
          itemStore.createIndex('modifiedTime', 'modifiedTime', { unique: false });
          itemStore.createIndex('type', 'type', { unique: false });
        }
        
        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Get all cached items
   * @returns {Promise<Array>} Array of cached items
   */
  async getCachedItems() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['items'], 'readonly');
      const objectStore = transaction.objectStore('items');
      const request = objectStore.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to get cached items:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update cache with new items
   * @param {Array} items - Items to cache
   */
  async updateCache(items) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['items'], 'readwrite');
      const objectStore = transaction.objectStore('items');
      
      for (const item of items) {
        objectStore.put({
          ...item,
          cachedAt: new Date().toISOString()
        });
      }
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        console.error('Failed to update cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Get cache metadata (last sync time, item count, etc.)
   * @returns {Promise<Object>} Cache metadata
   */
  async getCacheMetadata() {
    if (!this.db) await this.init();
    
    const metadata = await this._getMetadata('syncInfo');
    const items = await this.getCachedItems();
    
    const lastSync = metadata?.lastSyncTime 
      ? new Date(metadata.lastSyncTime) 
      : null;
    
    const age = lastSync 
      ? Date.now() - lastSync.getTime() 
      : Infinity;
    
    const needsSync = !lastSync || age > 5 * 60 * 1000; // 5 minutes
    
    return {
      lastSync,
      age,
      needsSync,
      itemCount: items.length,
      version: this.version
    };
  }

  /**
   * Update metadata
   * @param {Object} data - Metadata to store
   */
  async updateMetadata(data) {
    if (!this.db) await this.init();
    
    return this._setMetadata('syncInfo', {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Clear entire cache
   */
  async clearCache() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['items', 'metadata'], 'readwrite');
      
      transaction.objectStore('items').clear();
      transaction.objectStore('metadata').clear();
      
      transaction.oncomplete = () => {
        console.log('Cache cleared');
        resolve();
      };
      transaction.onerror = () => {
        console.error('Failed to clear cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Remove specific items from cache
   * @param {Array<string>} itemIds - IDs of items to remove
   */
  async removeItems(itemIds) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['items'], 'readwrite');
      const objectStore = transaction.objectStore('items');
      
      for (const id of itemIds) {
        objectStore.delete(id);
      }
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getCacheStats() {
    if (!this.db) await this.init();
    
    const items = await this.getCachedItems();
    const metadata = await this.getCacheMetadata();
    
    // Estimate size (rough calculation)
    const estimatedSize = new Blob([JSON.stringify(items)]).size;
    
    return {
      itemCount: items.length,
      estimatedSizeKB: Math.round(estimatedSize / 1024),
      lastSync: metadata.lastSync,
      age: metadata.age,
      needsSync: metadata.needsSync
    };
  }

  // Private helper methods
  
  async _getMetadata(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readonly');
      const request = transaction.objectStore('metadata').get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async _setMetadata(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readwrite');
      const request = transaction.objectStore('metadata').put({ key, ...value });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```

### Example 2: Progressive Loading in useItems Hook

**File:** `src/hooks/useItems.js` (modifications)

```javascript
import { useState, useRef, useEffect } from 'react';
import { LibraryCache } from '../utils/cacheUtils.js';

export const useItems = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ current: 0, total: 0, phase: 'idle' });
  
  const cache = useRef(new LibraryCache());
  const storageAdapter = useRef(null);

  /**
   * Initialize storage with caching
   */
  const initializeStorage = async (storageType) => {
    setIsLoading(true);
    setLoadProgress({ current: 0, total: 0, phase: 'connecting' });
    
    try {
      // Initialize cache
      await cache.current.init();
      
      // Connect to storage (doesn't load files yet)
      const adapter = await createStorageAdapter(storageType);
      await adapter.connect();
      storageAdapter.current = adapter;
      
      // Check cache status
      const cacheMetadata = await cache.current.getCacheMetadata();
      
      if (cacheMetadata.itemCount > 0 && !cacheMetadata.needsSync) {
        // Cache is fresh - load immediately
        setLoadProgress({ current: 0, total: 0, phase: 'loading-cache' });
        const cachedItems = await cache.current.getCachedItems();
        setItems(cachedItems);
        setIsLoading(false);
        setLoadProgress({ current: cachedItems.length, total: cachedItems.length, phase: 'complete' });
        
        // Start background sync
        syncInBackground(adapter, cacheMetadata.lastSync);
      } else {
        // Cache is stale or missing - progressive load
        setLoadProgress({ current: 0, total: 0, phase: 'loading-drive' });
        await progressiveLoad(adapter);
      }
      
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      setIsLoading(false);
      setLoadProgress({ current: 0, total: 0, phase: 'error' });
      throw error;
    }
  };

  /**
   * Load items progressively from Drive
   */
  const progressiveLoad = async (adapter) => {
    let allItems = [];
    let pageToken = null;
    let page = 0;
    const pageSize = 50;
    
    try {
      do {
        // Load batch from Drive
        const result = await adapter.loadItems({ 
          pageSize, 
          pageToken 
        });
        
        // Update items incrementally
        allItems = [...allItems, ...result.items];
        setItems(allItems);
        
        // Update progress
        setLoadProgress({ 
          current: allItems.length, 
          total: result.hasMore ? allItems.length + pageSize : allItems.length,
          phase: 'loading-drive'
        });
        
        // Update cache after each batch
        await cache.current.updateCache(result.items);
        
        pageToken = result.nextPageToken;
        page++;
        
        // Safety limit
        if (page > 20) {
          console.warn('Reached page limit, stopping progressive load');
          break;
        }
        
      } while (pageToken);
      
      // Mark sync complete
      await cache.current.updateMetadata({ 
        lastSyncTime: new Date().toISOString(),
        itemCount: allItems.length 
      });
      
      setIsLoading(false);
      setLoadProgress({ 
        current: allItems.length, 
        total: allItems.length, 
        phase: 'complete' 
      });
      
    } catch (error) {
      console.error('Progressive load failed:', error);
      setIsLoading(false);
      setLoadProgress({ current: 0, total: 0, phase: 'error' });
      throw error;
    }
  };

  /**
   * Sync changes in background (silent)
   */
  const syncInBackground = async (adapter, lastSyncTime) => {
    try {
      console.log('Starting background sync...');
      
      const changedItems = await adapter.syncChanges(lastSyncTime);
      
      if (changedItems.length > 0) {
        console.log(`Found ${changedItems.length} changed items`);
        
        // Merge changed items
        setItems(prevItems => {
          const itemMap = new Map(prevItems.map(item => [item.id, item]));
          changedItems.forEach(item => itemMap.set(item.id, item));
          return Array.from(itemMap.values());
        });
        
        // Update cache
        await cache.current.updateCache(changedItems);
      }
      
      // Update sync timestamp
      await cache.current.updateMetadata({ 
        lastSyncTime: new Date().toISOString() 
      });
      
      console.log('Background sync complete');
      
    } catch (error) {
      console.warn('Background sync failed:', error);
      // Fail silently - cached data is still valid
    }
  };

  // Rest of useItems hook...
  // (saveItem, deleteItem, etc. - keep existing implementation)

  return {
    items,
    isLoading,
    loadProgress,
    initializeStorage,
    // ... other methods
  };
};
```

### Example 3: Refactored CSV Import

**File:** `src/utils/importUtils.js` (complete refactor)

```javascript
import Papa from 'papaparse';

/**
 * Generate hash for duplicate detection
 */
function getItemHash(item) {
  const title = (item.title || '').toLowerCase().trim();
  const author = (item.author || item.director || '').toLowerCase().trim();
  const year = item.year || '';
  
  return `${title}|||${author}|||${year}`;
}

/**
 * Build lookup map for O(1) duplicate checking
 */
function buildItemHashMap(items) {
  return new Map(
    items.map(item => [getItemHash(item), item])
  );
}

/**
 * Process CSV import with optimized flow
 * 
 * New flow: Load once → Validate all → Batch save
 * Time complexity: O(n) instead of O(n²)
 */
export async function processCSVImport(file, existingItems, storageAdapter, onProgress) {
  try {
    // PHASE 1: Load existing items (already passed in)
    onProgress?.({ phase: 'loading', current: 0, total: 0 });
    
    // Build duplicate detection map
    const duplicateMap = buildItemHashMap(existingItems);
    
    // PHASE 2: Parse CSV
    onProgress?.({ phase: 'parsing', current: 0, total: 0 });
    
    const csvData = await parseCSVFile(file);
    const format = detectCSVFormat(csvData);
    
    onProgress?.({ phase: 'validating', current: 0, total: csvData.length });
    
    // PHASE 3: Validate and detect duplicates (in memory)
    const validationResult = validateItems(csvData, duplicateMap, format);
    
    onProgress?.({ 
      phase: 'ready', 
      newItems: validationResult.newItems.length,
      duplicates: validationResult.duplicates.length 
    });
    
    // PHASE 4: Batch save all new items
    if (validationResult.newItems.length > 0) {
      onProgress?.({ 
        phase: 'saving', 
        current: 0, 
        total: validationResult.newItems.length 
      });
      
      await batchSaveItems(
        validationResult.newItems, 
        storageAdapter,
        (current, total) => {
          onProgress?.({ phase: 'saving', current, total });
        }
      );
    }
    
    // PHASE 5: Complete
    onProgress?.({ 
      phase: 'complete',
      added: validationResult.newItems.length,
      skipped: validationResult.duplicates.length
    });
    
    return {
      added: validationResult.newItems.length,
      skipped: validationResult.duplicates.length,
      format: format,
      details: validationResult.duplicates
    };
    
  } catch (error) {
    console.error('Import failed:', error);
    onProgress?.({ phase: 'error', error: error.message });
    throw error;
  }
}

/**
 * Parse CSV file
 */
async function parseCSVFile(file) {
  const text = await file.text();
  
  const result = Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim()
  });
  
  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }
  
  return result.data;
}

/**
 * Detect CSV format (Goodreads, Letterboxd, generic)
 */
function detectCSVFormat(data) {
  if (data.length === 0) return 'unknown';
  
  const headers = Object.keys(data[0]).map(h => h.toLowerCase());
  
  if (headers.includes('my rating') && headers.includes('author')) {
    return 'goodreads';
  }
  
  if (headers.includes('letterboxd uri') || headers.includes('watched')) {
    return 'letterboxd';
  }
  
  return 'generic';
}

/**
 * Validate items and detect duplicates (all in memory)
 */
function validateItems(csvRows, duplicateMap, format) {
  const newItems = [];
  const duplicates = [];
  
  for (const row of csvRows) {
    try {
      // Convert CSV row to item based on format
      const item = csvRowToItem(row, format);
      
      if (!item.title) {
        duplicates.push({ row, reason: 'Missing title' });
        continue;
      }
      
      // Check for duplicate
      const hash = getItemHash(item);
      if (duplicateMap.has(hash)) {
        duplicates.push({ 
          row, 
          reason: 'Duplicate', 
          existing: duplicateMap.get(hash) 
        });
      } else {
        newItems.push(item);
        // Add to map to prevent duplicates within CSV
        duplicateMap.set(hash, item);
      }
      
    } catch (error) {
      console.error('Failed to parse row:', error);
      duplicates.push({ row, reason: 'Parse error: ' + error.message });
    }
  }
  
  return { newItems, duplicates };
}

/**
 * Batch save items with progress reporting
 */
async function batchSaveItems(items, storageAdapter, onProgress) {
  const batchSize = 10; // Save 10 items at a time
  let savedCount = 0;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Save batch in parallel
    await Promise.all(
      batch.map(item => storageAdapter.saveItem(item))
    );
    
    savedCount += batch.length;
    onProgress?.(savedCount, items.length);
  }
  
  return savedCount;
}

/**
 * Convert CSV row to item object based on format
 */
function csvRowToItem(row, format) {
  switch (format) {
    case 'goodreads':
      return csvRowToItemGoodreads(row);
    case 'letterboxd':
      return csvRowToItemLetterboxd(row);
    default:
      return csvRowToItemGeneric(row);
  }
}

// Keep existing format-specific converters
// (csvRowToItemGoodreads, csvRowToItemLetterboxd, etc.)
```

### Example 4: Batch Save in GoogleDriveStorageAdapter

**File:** `src/services/GoogleDriveStorageAdapter.js` (add method)

```javascript
/**
 * Batch save multiple items (optimized for imports)
 * Saves items in parallel batches to improve performance
 */
async batchSave(items) {
  const batchSize = 10; // Save 10 files in parallel
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      // Save batch in parallel
      const batchResults = await Promise.all(
        batch.map(item => this.saveItem(item))
      );
      
      results.push(...batchResults);
      
      // Log progress
      const progress = Math.min(i + batchSize, items.length);
      console.log(`Saved ${progress} of ${items.length} items`);
      
    } catch (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      // Continue with next batch even if this one fails
    }
    
    // Small delay to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}

/**
 * Sync changes since last sync time
 * Only fetches files modified after the given timestamp
 */
async syncChanges(lastSyncTime) {
  try {
    if (!lastSyncTime) {
      return await this.loadAllItems();
    }
    
    // Format timestamp for Drive API
    const isoTime = new Date(lastSyncTime).toISOString();
    
    // Query only modified files
    const query = `'${this.folderId}' in parents and trashed=false and modifiedTime > '${isoTime}'`;
    
    const response = await gapi.client.drive.files.list({
      q: query,
      fields: 'files(id, name, modifiedTime)',
      pageSize: 100,
      orderBy: 'modifiedTime desc'
    });
    
    if (response.result.files.length === 0) {
      return [];
    }
    
    console.log(`Found ${response.result.files.length} changed files`);
    
    // Download and parse changed files
    const changedItems = await Promise.all(
      response.result.files.map(file => this.parseFileToItem(file))
    );
    
    return changedItems;
    
  } catch (error) {
    console.error('Sync changes failed:', error);
    return []; // Return empty array on error
  }
}
```

---

## Success Criteria

### Performance Targets

After successful implementation, the app should meet these targets:

| Operation | Target | Current | Improvement |
|-----------|--------|---------|-------------|
| Initial connection | < 2 seconds | 30+ seconds | **15x faster** |
| First 50 items visible | < 5 seconds | 30+ seconds | **6x faster** |
| Load from cache | < 1 second | N/A | **Instant** |
| Import 50 items (100 existing) | < 30 seconds | 5-10 minutes | **20x faster** |
| Import 200 items (50 existing) | < 90 seconds | 30-60 minutes | **40x faster** |
| Background sync | 2-5 seconds | N/A | **Silent** |

### Functional Requirements

- ✅ All existing features continue to work
- ✅ File System Access API storage unaffected
- ✅ Markdown + YAML frontmatter format preserved
- ✅ Keyboard shortcuts remain functional
- ✅ Theme customization works
- ✅ CSV export works
- ✅ Search and filters work
- ✅ Batch operations work

### User Experience Requirements

- ✅ Never show blank screen during loading
- ✅ Always show progress feedback for long operations
- ✅ Cache is invisible to user (just makes app faster)
- ✅ Offline mode degrades gracefully
- ✅ Background sync doesn't block interactions
- ✅ Error messages are clear and actionable
- ✅ App feels responsive even with 500+ items

---

## Important Constraints & Considerations

### Must Preserve
- ✅ All existing functionality
- ✅ Markdown + YAML frontmatter format
- ✅ File System Access API support (local storage)
- ✅ Current UI/UX design and theming
- ✅ Keyboard shortcuts and navigation
- ✅ No breaking changes to file format

### Technical Requirements
- Use React hooks pattern (no Redux/MobX)
- Use async/await consistently
- Handle errors gracefully
- Add retry logic for network failures
- Support offline mode via caching
- Maintain browser compatibility (Chrome, Edge, etc.)

### Data Integrity
- Never lose user data during sync
- Handle concurrent modifications gracefully
- Validate all imported data
- Provide clear feedback on errors
- Allow user to undo destructive operations

### Privacy & Security
- Cache stored locally (IndexedDB)
- No data sent to third parties
- Use existing Google OAuth flow
- Respect user's Drive permissions
- Clear cache on disconnect (optional)

---

## Additional Context

### Current Tech Stack
- **Framework:** React 18 + Vite
- **Auth:** Google Identity Services (GIS)
- **Drive API:** gapi.client.drive (Google API Client)
- **Storage:** File System Access API + Google Drive API
- **Styling:** Tailwind CSS
- **CSV:** PapaParse library

### Item Data Structure
```javascript
{
  id: string,              // Unique identifier
  title: string,           // Required
  type: 'book' | 'movie',  // Required
  author: string,          // For books
  director: string,        // For movies
  year: number,
  rating: number,          // 0-5
  tags: string[],
  status: string,          // to-read, reading, read, etc.
  dateAdded: string,       // ISO date
  dateConsumed: string,    // ISO date
  notes: string,           // Markdown body
  coverUrl: string,
  driveFileId: string      // For Drive sync
}
```

### Markdown File Format
```markdown
---
title: The Great Gatsby
type: book
author: F. Scott Fitzgerald
year: 1925
rating: 5
tags:
  - classic
  - fiction
status: read
dateAdded: 2024-01-15
dateConsumed: 2024-02-01
coverUrl: https://example.com/cover.jpg
---

# My Review

This book was amazing! The prose is beautiful...
```

---

## Questions for Implementation

Consider these questions during implementation:

### Cache Management
1. Should cache have a size limit (e.g., max 10MB)?
2. Should we auto-cleanup old/unused items from cache?
3. How should we handle cache versioning for future updates?
4. Should users have a "Clear Cache" button?

### User Experience
1. Should we add a manual "Sync Now" button?
2. Should we show a notification when background sync finds changes?
3. Should import show a preview before saving?
4. How should we indicate "working from cache" vs "working from Drive"?

### Error Handling
1. How should we handle conflicts (file modified both locally and on Drive)?
2. Should we queue failed operations for retry?
3. What should happen if IndexedDB is not available?
4. Should we have a "safe mode" that bypasses cache?

### Performance
1. Should we implement virtual scrolling for 500+ items?
2. Should we lazy-load cover images?
3. Should we prefetch next page during progressive loading?
4. Should we add performance metrics/monitoring?

---

## Deliverables

Please provide the following:

### 1. Code Files
- ✅ **New file:** `src/utils/cacheUtils.js` - Complete IndexedDB implementation
- ✅ **Updated file:** `src/hooks/useItems.js` - Cache integration and progressive loading
- ✅ **Updated file:** `src/services/GoogleDriveStorageAdapter.js` - Pagination, batch save, sync
- ✅ **Updated file:** `src/utils/importUtils.js` - Refactored O(n) import
- ✅ **Updated file:** `src/components/MediaTracker.jsx` - Loading progress UI

### 2. Documentation
- Brief comments explaining key optimization decisions
- JSDoc documentation for new public methods
- Any gotchas or edge cases to be aware of

### 3. Dependencies
- List any new npm packages needed (if any)
- Verify IndexedDB is available in all target browsers

### 4. Testing Notes
- Key scenarios to test manually
- Expected behavior for each test case
- Performance benchmarks to measure

### 5. Migration Guide
- How existing users' data will be handled
- Whether cache is automatically built on first load
- Any user-visible changes or new features

---

## Implementation Checklist

Use this checklist to track implementation progress:

### Phase 1: Cache Foundation
- [ ] Create `cacheUtils.js` with LibraryCache class
- [ ] Implement IndexedDB initialization
- [ ] Implement getCachedItems()
- [ ] Implement updateCache()
- [ ] Implement getCacheMetadata()
- [ ] Test cache operations in isolation

### Phase 2: GoogleDrive Adapter
- [ ] Split connect() from loadItems()
- [ ] Add pagination support to loadItems()
- [ ] Implement syncChanges(lastSyncTime)
- [ ] Implement batchSave(items)
- [ ] Add retry logic for rate limits
- [ ] Test with small dataset (10 files)

### Phase 3: useItems Hook Integration
- [ ] Initialize cache on mount
- [ ] Implement cache-first loading strategy
- [ ] Add progressive loading with progress tracking
- [ ] Implement background sync
- [ ] Add error handling
- [ ] Test all loading scenarios

### Phase 4: Import Optimization
- [ ] Refactor processCSVImport() to load once
- [ ] Implement hash-based duplicate detection
- [ ] Add batch processing
- [ ] Update import UI with progress
- [ ] Test with various CSV sizes
- [ ] Verify performance improvement

### Phase 5: UI/UX Polish
- [ ] Add loading progress overlay
- [ ] Add import progress modal
- [ ] Add cache status indicators
- [ ] Test keyboard shortcuts still work
- [ ] Test on mobile/tablet
- [ ] Polish error messages

### Phase 6: Testing & Validation
- [ ] Test with 0 items
- [ ] Test with 10 items
- [ ] Test with 100 items
- [ ] Test with 500+ items
- [ ] Test CSV import (10, 50, 200 rows)
- [ ] Test offline behavior
- [ ] Test error scenarios
- [ ] Measure performance benchmarks

---

## Final Notes

### Philosophy
The goal is to make the app **feel instant** while maintaining data integrity. Users should never feel like they're waiting for something with no feedback. Cache aggressively, sync intelligently, and always provide progress indicators.

### Trade-offs
- **Cache storage** - Uses ~5-10MB of IndexedDB space for 500 items (acceptable)
- **Complexity** - Adds caching layer, but isolated in dedicated module
- **Memory** - Keeps items in memory during import (< 50MB for 1000 items, acceptable)
- **Stale data** - 5-minute cache window means very recent changes might not show immediately (but background sync fixes this)

### Key Principles
1. **Load once, cache everything** - Never reload what you already have
2. **Progressive disclosure** - Show data as soon as it's available
3. **Fail gracefully** - Cache provides offline fallback
4. **Batch operations** - Group Drive API calls whenever possible
5. **User feedback** - Always show progress for long operations

### Success Metrics
After implementation, measure these metrics:

```javascript
// Add to MediaTracker for debugging
console.log('Performance metrics:', {
  connectionTime: connectionDuration,
  firstItemsTime: timeToFirst50Items,
  cacheHitRate: cacheHits / totalLoads,
  importTime: importDuration,
  syncTime: backgroundSyncDuration
});
```

Target metrics:
- Connection: < 2 seconds
- First 50 items: < 5 seconds
- Cache load: < 1 second
- Import 50 items: < 30 seconds
- Background sync: < 5 seconds

### Debugging Tips

**Check Cache Status:**
```javascript
// In browser console
const cache = new LibraryCache();
await cache.init();
const stats = await cache.getCacheStats();
console.log(stats);
```

**Clear Cache (for testing):**
```javascript
// In browser console
const cache = new LibraryCache();
await cache.init();
await cache.clearCache();
location.reload();
```

**Monitor Drive API Calls:**
```javascript
// Add logging to GoogleDriveStorageAdapter
async loadItems(options) {
  console.time('loadItems');
  const result = await this._loadItemsInternal(options);
  console.timeEnd('loadItems');
  return result;
}
```

**Test Import Performance:**
```javascript
// Before import
console.time('import');

// After import
console.timeEnd('import');
console.log(`Import rate: ${itemsImported / (durationSeconds / 60)} items/minute`);
```

---

## Common Pitfalls to Avoid

### 1. Cache Invalidation Issues
**Problem:** Cache becomes stale but app doesn't refresh
**Solution:** Use background sync after every cache load, store lastSyncTime

### 2. Race Conditions
**Problem:** User modifies item while sync is in progress
**Solution:** Last-write-wins strategy, or lock UI during sync

### 3. Memory Leaks
**Problem:** Large item arrays not garbage collected
**Solution:** Clear old references, use pagination for very large libraries

### 4. Rate Limiting
**Problem:** Too many Drive API calls trigger 429 errors
**Solution:** Implement exponential backoff, limit parallelism to 10

### 5. Partial Failures
**Problem:** Import fails halfway through, leaving inconsistent state
**Solution:** Validate everything first, then batch save (atomic operation)

### 6. IndexedDB Quota
**Problem:** Cache exceeds browser storage quota
**Solution:** Implement cache size limits, cleanup old items

### 7. Slow CSV Parsing
**Problem:** Large CSV files block main thread
**Solution:** Use PapaParse with web workers (optional optimization)

### 8. Network Errors
**Problem:** Drive API calls fail randomly
**Solution:** Retry with exponential backoff, fall back to cache

---

## Troubleshooting Guide

### "Cache not working / Always loading from Drive"
1. Check IndexedDB in DevTools → Application → IndexedDB
2. Verify `lastSyncTime` is being set
3. Check if `needsSync` is always true (5-minute threshold)
4. Look for cache initialization errors in console

### "Import still slow"
1. Verify items are loaded ONCE before loop (check console logs)
2. Check if duplicate detection is using Map (O(1) lookups)
3. Verify batch save is being used (not sequential saves)
4. Check Drive API rate limiting (429 errors)

### "Background sync not working"
1. Check if `lastSyncTime` is valid ISO date
2. Verify Drive API query syntax for modifiedTime
3. Check network tab for API calls
4. Look for silent errors in console

### "Items not updating after sync"
1. Check if merge strategy is preserving changes
2. Verify item IDs match between cache and Drive
3. Check if cache is being updated after sync
4. Test with manually modified Drive file

### "App slower after optimization"
1. Check if cache operations are blocking main thread
2. Verify progressive loading isn't waiting for all items
3. Check for console errors during load
4. Test with cache disabled (clear and don't initialize)

---

## Performance Optimization Checklist

### Network Layer
- [ ] Use Drive API `fields` parameter to minimize response size
- [ ] Implement pagination with reasonable page size (50 items)
- [ ] Batch Drive API calls where possible
- [ ] Add retry logic with exponential backoff
- [ ] Limit concurrent requests (5-10 max)
- [ ] Cache DNS/connection (automatically handled by browser)

### Data Layer
- [ ] Use IndexedDB for local caching
- [ ] Implement efficient duplicate detection (Map/Set)
- [ ] Store only necessary data in cache
- [ ] Use indexes for common queries
- [ ] Batch cache updates

### Application Layer
- [ ] Load from cache first, sync in background
- [ ] Progressive loading with incremental UI updates
- [ ] Use useMemo for expensive computations
- [ ] Lazy load images (loading="lazy")
- [ ] Virtual scrolling for 500+ items (optional)

### User Experience
- [ ] Show loading progress for all long operations
- [ ] Never block UI thread
- [ ] Provide cancel buttons for long operations
- [ ] Show cached data immediately
- [ ] Indicate sync status clearly

---

## Additional Resources

### Google Drive API Documentation
- [Files: list](https://developers.google.com/drive/api/v3/reference/files/list) - Pagination and queries
- [Files: create](https://developers.google.com/drive/api/v3/reference/files/create) - Creating files
- [Batch requests](https://developers.google.com/drive/api/guides/performance#batch-requests) - Batch operations
- [Performance tips](https://developers.google.com/drive/api/guides/performance) - Official performance guide

### IndexedDB Documentation
- [MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Complete API reference
- [Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) - Tutorial
- [Browser support](https://caniuse.com/indexeddb) - Compatibility table

### React Performance
- [Optimizing Performance](https://react.dev/learn/render-and-commit) - Official React docs
- [useMemo](https://react.dev/reference/react/useMemo) - Memoization
- [useCallback](https://react.dev/reference/react/useCallback) - Callback memoization

### Algorithms & Data Structures
- Hash maps for O(1) lookups
- Pagination strategies
- Cache invalidation patterns
- Exponential backoff algorithms

---

## Version History & Migration

### Version 1.0 (Current - Pre-optimization)
- Sequential loading of all files on connection
- O(n²) CSV import
- No caching
- 30+ second load times with 100+ files

### Version 2.0 (Target - Post-optimization)
- Progressive loading with IndexedDB caching
- O(n) CSV import with batch operations
- Background sync
- < 2 second connection, < 5 second first load

### Migration Path
1. Users update to v2.0
2. First load: Progressive load as usual (builds cache automatically)
3. Subsequent loads: Instant from cache
4. No user action required
5. Cache version is tracked for future migrations

### Breaking Changes
**None** - All changes are internal optimizations. User data format remains identical.

### Rollback Plan
If issues arise:
1. Cache can be disabled via localStorage flag
2. App falls back to direct Drive loading
3. Clear cache and reload to start fresh
4. Revert to v1.0 if necessary (no data loss)

---

## Summary

This comprehensive guide provides everything needed to optimize Google Drive performance for the Markdown Media Tracker. The optimizations focus on three key areas:

1. **Caching** - IndexedDB for instant subsequent loads
2. **Progressive Loading** - Show items as they load, not all at once
3. **Import Optimization** - Change from O(n²) to O(n) complexity

Expected results:
- **15x faster** initial connection
- **20-40x faster** CSV imports
- **Instant** cached loads
- **Silent** background sync

All while preserving existing functionality, maintaining data integrity, and improving user experience.

Good luck with the implementation! 🚀