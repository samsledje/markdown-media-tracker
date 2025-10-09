# Google Drive Performance Optimization - Phased Prompts

This document contains a series of focused prompts to guide implementation of the Google Drive performance optimizations. Copy each prompt one at a time and provide them to your LLM coding agent along with the comprehensive reference document.

---

## Prompt 1: Create IndexedDB Cache Module

**Context:** We need local caching for instant loads and offline access.

**Task:** Create `src/utils/cacheUtils.js` with a `LibraryCache` class that wraps IndexedDB operations.

**Requirements:**
- Database name: `MediaTrackerCache`, version 1
- Two object stores:
  - `items` (keyPath: 'id', indexes: modifiedTime, type)
  - `metadata` (keyPath: 'key')
- Methods needed:
  - `init()` - Initialize IndexedDB
  - `getCachedItems()` - Return all cached items as array
  - `updateCache(items)` - Store/update items array
  - `getCacheMetadata()` - Return { lastSync, age, needsSync, itemCount }
  - `updateMetadata(data)` - Store sync metadata
  - `clearCache()` - Clear all data
  - `removeItems(itemIds)` - Delete specific items
  - `getCacheStats()` - Return cache statistics

**Notes:**
- Cache is "fresh" if age < 5 minutes
- Store each item with a `cachedAt` timestamp
- Handle errors gracefully (IndexedDB might not be available)
- Add JSDoc comments for all public methods
- Test in isolation before moving to next phase

**Success Criteria:**
- Can store and retrieve 100 items
- Cache metadata persists between sessions
- All operations handle errors without crashing

---

## Prompt 2: Add Pagination to GoogleDriveStorageAdapter

**Context:** Currently loads all files sequentially. Need pagination for progressive loading.

**Task:** Modify `src/services/GoogleDriveStorageAdapter.js` to support batched loading.

**Requirements:**
1. **Split connection from loading:**
   - `connect()` should only authenticate and get folder info (< 2 seconds)
   - Don't load any file content in `connect()`
   - Return metadata: `{ connected: true, itemCount, lastModified }`

2. **Add pagination to loadItems:**
   ```javascript
   async loadItems(options = {}) {
     const { pageSize = 50, pageToken = null } = options;
     // Use gapi.client.drive.files.list with pageSize and pageToken
     // Return: { items: [...], nextPageToken: '...', hasMore: boolean }
   }
   ```

3. **Add sync method:**
   ```javascript
   async syncChanges(lastSyncTime) {
     // Query: modifiedTime > lastSyncTime
     // Return only changed items
   }
   ```

**Key Implementation:**
- Use Drive API `fields` parameter to minimize response size
- Order by `modifiedTime desc` for newest first
- Parse files in parallel within each batch (Promise.all)
- Handle `nextPageToken` for pagination

**Success Criteria:**
- `connect()` completes in < 2 seconds
- Can load items in batches of 50
- Pagination works correctly across multiple pages
- `syncChanges()` returns only modified files

---

## Prompt 3: Integrate Cache into useItems Hook

**Context:** Need to load from cache first, then sync in background.

**Task:** Modify `src/hooks/useItems.js` to use caching with progressive loading.

**Requirements:**
1. **Add state for loading progress:**
   ```javascript
   const [loadProgress, setLoadProgress] = useState({ 
     current: 0, 
     total: 0, 
     phase: 'idle' // idle, connecting, loading-cache, loading-drive, complete
   });
   ```

2. **Implement cache-first loading in `initializeStorage()`:**
   ```
   Flow:
   1. Initialize cache
   2. Connect to storage (quick)
   3. Check cache metadata
   4. If cache fresh (< 5 min):
      - Load from cache instantly
      - Start background sync
   5. If cache stale/missing:
      - Progressive load from Drive
      - Update cache after each batch
   ```

3. **Add progressive loading function:**
   ```javascript
   const progressiveLoad = async (adapter) => {
     // Loop through pages
     // Update items and UI after each batch
     // Update cache incrementally
     // Update loadProgress state
   }
   ```

4. **Add background sync function:**
   ```javascript
   const syncInBackground = async (adapter, lastSyncTime) => {
     // Get changed items silently
     // Merge into existing items
     // Update cache
     // Fail silently if errors
   }
   ```

**Important:**
- Update `items` state after each batch (incremental UI updates)
- Show progress in `loadProgress` state
- Cache operations should not block UI
- Background sync should be silent (no loading indicators)

**Success Criteria:**
- First load: Items appear progressively (50 at a time)
- Cached load: Items appear instantly (< 1 second)
- Background sync works without blocking UI
- Progress state updates correctly

---

## Prompt 4: Add Loading Progress UI

**Context:** Users need visual feedback during loading operations.

**Task:** Add loading progress overlay to `src/components/MediaTracker.jsx`.

**Requirements:**
1. **Create loading progress modal:**
   - Show when `isLoading === true && loadProgress.total > 0`
   - Display phase-specific messages:
     - connecting: "Connecting to Google Drive..."
     - loading-cache: "Loading from cache..."
     - loading-drive: "Loading library... (X of Y items)"
     - complete: Don't show
   - Progress bar: `(current / total) * 100%`
   - Use existing color: `var(--mt-highlight)`

2. **Position and styling:**
   - Fixed overlay with backdrop-blur
   - Centered modal
   - Progress bar with smooth transitions
   - Match existing Tailwind styling

3. **Handle edge cases:**
   - Don't show for cache loads (too fast)
   - Do show for Drive loads (slower)
   - Smooth fade in/out

**Example Structure:**
```jsx
{isLoading && loadProgress.phase === 'loading-drive' && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
      <h3>Loading Library</h3>
      <div className="progress-bar">...</div>
      <p>{loadProgress.current} of {loadProgress.total} items</p>
    </div>
  </div>
)}
```

**Success Criteria:**
- Progress bar updates smoothly
- Shows correct phase messages
- Doesn't flash for instant cache loads
- Matches existing design system

---

## Prompt 5: Refactor CSV Import to O(n) Complexity

**Context:** Current import has O(n²) complexity - reloads all items for each row. Need to load once and batch save.

**Task:** Completely refactor `src/utils/importUtils.js` function `processCSVImport()`.

**Current Problem:**
```javascript
// OLD (O(n²) - DON'T DO THIS):
for each CSV row {
  loadAllItems()        // Loads n items
  checkDuplicate()      // Checks n items
  saveItem()            // Saves 1 item
}
```

**New Approach:**
```javascript
// NEW (O(n) - DO THIS):
existingItems = loadAllItems()              // Load once
duplicateMap = buildHashMap(existingItems)  // Build once
newItems = []

for each CSV row {
  hash = getItemHash(row)              // O(1)
  if (!duplicateMap.has(hash)) {       // O(1)
    newItems.push(row)
  }
}

batchSaveAll(newItems)  // Save once
```

**Required Functions:**

1. **Hash function for duplicate detection:**
   ```javascript
   function getItemHash(item) {
     const title = (item.title || '').toLowerCase().trim();
     const author = (item.author || item.director || '').toLowerCase().trim();
     const year = item.year || '';
     return `${title}|||${author}|||${year}`;
   }
   ```

2. **Build lookup map:**
   ```javascript
   function buildItemHashMap(items) {
     return new Map(items.map(item => [getItemHash(item), item]));
   }
   ```

3. **New import flow:**
   ```javascript
   async function processCSVImport(file, existingItems, storageAdapter, onProgress) {
     // Phase 1: Build duplicate map (pass existingItems, don't reload)
     // Phase 2: Parse CSV
     // Phase 3: Validate all rows in memory
     // Phase 4: Batch save all new items
     // Phase 5: Return results
   }
   ```

4. **Validation function:**
   ```javascript
   function validateItems(csvRows, duplicateMap, format) {
     const newItems = [];
     const duplicates = [];
     
     for (const row of csvRows) {
       const item = csvRowToItem(row, format);
       const hash = getItemHash(item);
       
       if (duplicateMap.has(hash)) {
         duplicates.push({ row, reason: 'Duplicate' });
       } else {
         newItems.push(item);
         duplicateMap.set(hash, item); // Prevent intra-CSV duplicates
       }
     }
     
     return { newItems, duplicates };
   }
   ```

**Progress Callback:**
Add `onProgress` parameter that reports:
- Phase: 'loading', 'parsing', 'validating', 'saving', 'complete'
- Current/total counts
- New items count, duplicates count

**Success Criteria:**
- Import 50 items with 100 existing: < 30 seconds (vs 5-10 minutes)
- Items only loaded once (check console.log)
- Duplicate detection works correctly
- Progress callback fires at each phase

---

## Prompt 6: Add Batch Save to GoogleDriveStorageAdapter

**Context:** Need to save multiple items efficiently during import.

**Task:** Add `batchSave(items)` method to `src/services/GoogleDriveStorageAdapter.js`.

**Requirements:**

**Simple Approach (Recommended):**
```javascript
async batchSave(items) {
  const batchSize = 10; // Parallel limit
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Save in parallel
    const batchResults = await Promise.all(
      batch.map(item => this.saveItem(item))
    );
    
    results.push(...batchResults);
    console.log(`Saved ${Math.min(i + batchSize, items.length)} of ${items.length}`);
    
    // Small delay to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}
```

**Advanced Approach (Optional):**
Use Drive API batch request format (multipart/mixed) to send multiple files in one HTTP request. Only implement if simple approach isn't fast enough.

**Error Handling:**
- Continue with next batch if one fails
- Log errors but don't throw
- Return partial results

**Success Criteria:**
- Can save 50 items in < 20 seconds
- Parallel requests don't hit rate limits
- Errors in one batch don't stop others

---

## Prompt 7: Update Import Flow in MediaTracker

**Context:** Need to wire up the new import flow with progress UI.

**Task:** Modify import handling in `src/components/MediaTracker.jsx` and related components.

**Requirements:**

1. **Update `handleImportFile` function:**
   ```javascript
   const handleImportFile = async (e) => {
     const file = e.target.files?.[0];
     if (!file) return;
     
     // Show progress modal
     setImportProgress({ phase: 'loading', current: 0, total: 0 });
     
     try {
       const result = await processCSVImport(
         file,
         items, // Pass existing items (already loaded)
         storageAdapter.current,
         (progress) => {
           setImportProgress(progress);
         }
       );
       
       // Show success
       alert(`Imported ${result.added} items (${result.skipped} duplicates)`);
       
     } catch (error) {
       alert('Import failed: ' + error.message);
     } finally {
       setImportProgress({ phase: 'idle' });
       e.target.value = ''; // Reset input
     }
   };
   ```

2. **Add import progress state:**
   ```javascript
   const [importProgress, setImportProgress] = useState({
     phase: 'idle', // idle, loading, parsing, validating, saving, complete
     current: 0,
     total: 0
   });
   ```

3. **Create import progress modal:**
   ```jsx
   {importProgress.phase !== 'idle' && (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
       <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
         <h3>Importing CSV</h3>
         
         {importProgress.phase === 'loading' && <p>Loading existing items...</p>}
         {importProgress.phase === 'parsing' && <p>Parsing CSV file...</p>}
         {importProgress.phase === 'validating' && <p>Validating {importProgress.total} rows...</p>}
         {importProgress.phase === 'saving' && (
           <>
             <div className="progress-bar">...</div>
             <p>Saving {importProgress.current} of {importProgress.total} items</p>
           </>
         )}
         {importProgress.phase === 'complete' && <p>Import complete!</p>}
       </div>
     </div>
   )}
   ```

**Success Criteria:**
- Progress updates during import
- Clear phase messages
- Can't start multiple imports simultaneously
- Modal auto-closes on complete

---

## Prompt 8: Add Error Handling and Retry Logic

**Context:** Need robust error handling for network failures and rate limits.

**Task:** Add retry logic with exponential backoff to `src/services/GoogleDriveStorageAdapter.js`.

**Requirements:**

1. **Create retry utility:**
   ```javascript
   async retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.status === 429) {
           // Rate limited
           const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
           console.log(`Rate limited, retrying in ${delay}ms...`);
           await new Promise(resolve => setTimeout(resolve, delay));
         } else if (i === maxRetries - 1) {
           throw error; // Give up
         } else {
           await new Promise(resolve => setTimeout(resolve, 1000));
         }
       }
     }
   }
   ```

2. **Wrap Drive API calls:**
   ```javascript
   async loadItems(options) {
     return this.retryWithBackoff(async () => {
       const response = await gapi.client.drive.files.list({...});
       return this.parseResponse(response);
     });
   }
   ```

3. **Add graceful fallback:**
   ```javascript
   // In useItems hook
   try {
     const items = await loadFromDrive();
   } catch (error) {
     console.error('Drive error:', error);
     
     // Try cache as fallback
     const cachedItems = await cache.current.getCachedItems();
     if (cachedItems.length > 0) {
       setItems(cachedItems);
       showNotification('Offline mode - showing cached items');
     } else {
       throw new Error('Unable to load. Check connection.');
     }
   }
   ```

**Error Types to Handle:**
- 401: Re-authenticate
- 429: Rate limit (retry with backoff)
- 403: Permission denied (clear error message)
- 404: File not found (skip and continue)
- Network error: Retry then fallback to cache

**Success Criteria:**
- Recovers from temporary network failures
- Handles rate limits gracefully
- Falls back to cache when offline
- Clear error messages for user

---

## Prompt 9: Testing and Validation

**Context:** Need to verify all optimizations work correctly.

**Task:** Test the implementation across different scenarios.

**Test Scenarios:**

1. **Cache Testing:**
   ```
   [ ] Empty cache → Progressive load → Items appear incrementally
   [ ] Fresh cache (< 5 min) → Instant load → Background sync
   [ ] Stale cache (> 5 min) → Progressive load → Cache updated
   [ ] Clear cache (in DevTools) → Works as new install
   ```

2. **Loading Testing:**
   ```
   [ ] 0 items → Quick connection (< 2 sec)
   [ ] 10 items → Load in 1-2 seconds
   [ ] 100 items → Load in 5-8 seconds (progressive)
   [ ] Test pagination: verify nextPageToken works
   ```

3. **Import Testing:**
   ```
   [ ] Import 10 items (empty library) → < 5 seconds
   [ ] Import 50 items (100 existing) → < 30 seconds
   [ ] Import with duplicates → Correct count skipped
   [ ] Import invalid CSV → Clear error message
   ```

4. **Sync Testing:**
   ```
   [ ] Background sync finds 0 changes → No UI update
   [ ] Modify file in Drive → Sync detects change
   [ ] Background sync fails → Cached data still works
   ```

5. **Performance Benchmarks:**
   ```javascript
   // Add timing logs
   console.time('operation');
   await operation();
   console.timeEnd('operation');
   ```

   **Target Times:**
   - Connection: < 2 seconds
   - First 50 items: < 5 seconds  
   - Cache load: < 1 second
   - Import 50 items: < 30 seconds

**Verification:**
- Check IndexedDB in DevTools → Application → IndexedDB
- Monitor Network tab for Drive API calls
- Check Console for timing logs
- Test keyboard shortcuts still work
- Verify all existing features work

**Success Criteria:**
- All test scenarios pass
- Performance targets met
- No regression in existing features
- Cache persists between sessions

---

## Prompt 10: Polish and Documentation

**Context:** Final cleanup and documentation.

**Task:** Add comments, clean up console logs, and document changes.

**Requirements:**

1. **Add JSDoc comments:**
   ```javascript
   /**
    * Load items progressively from Google Drive with caching
    * @param {Object} adapter - Storage adapter instance
    * @returns {Promise<Array>} Loaded items
    */
   async function progressiveLoad(adapter) { ... }
   ```

2. **Clean up debug logs:**
   - Remove excessive console.logs
   - Keep important timing logs (optional, comment out)
   - Keep error logs

3. **Update README (optional):**
   - Mention caching behavior
   - Note that first load builds cache
   - Explain 5-minute sync window

4. **Add cache management UI (optional):**
   ```jsx
   // In menu or settings
   <button onClick={async () => {
     await cache.current.clearCache();
     window.location.reload();
   }}>
     Clear Cache & Reload
   </button>
   ```

5. **Performance monitoring (optional):**
   ```javascript
   // Add to MediaTracker for debugging
   useEffect(() => {
     if (process.env.NODE_ENV === 'development') {
       console.log('Performance:', {
         cacheHitRate: stats.cacheHits / stats.totalLoads,
         avgLoadTime: stats.totalLoadTime / stats.loads,
         itemCount: items.length
       });
     }
   }, [items]);
   ```

**Final Checklist:**
- [ ] All console.errors have meaningful messages
- [ ] No console.logs in production code
- [ ] JSDoc comments on public methods
- [ ] Code follows existing style
- [ ] No unused imports or variables
- [ ] Error handling is comprehensive
- [ ] User-facing messages are clear

**Success Criteria:**
- Code is clean and documented
- No unnecessary console output
- Easy to understand and maintain
- Ready for production use

---

## Summary

These 10 prompts guide you through the complete optimization:

1. ✅ Create cache module
2. ✅ Add pagination to Drive adapter  
3. ✅ Integrate cache in useItems hook
4. ✅ Add loading progress UI
5. ✅ Refactor import to O(n)
6. ✅ Add batch save
7. ✅ Update import flow
8. ✅ Add error handling
9. ✅ Test everything
10. ✅ Polish and document

**Expected Results:**
- 15x faster initial connection
- 20-40x faster imports  
- Instant cached loads
- Silent background sync

Work through each prompt sequentially, testing after each phase before moving to the next.