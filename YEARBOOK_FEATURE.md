# Feature: PDF Yearbook Generator

## Overview

Implement a "Generate Yearbook" feature that creates a personalized PDF report from the user's movie and book ratings. The yearbook should feel like a curated artifact - minimal, elegant, with splashes of the user's custom UI colors.

## User Experience

### Access Point

- Add "Generate Yearbook" button in the main menu or toolbar
- When clicked, uses the currently applied filters from the existing filter modal
- User workflow:
  1. Apply filters using existing filter UI (date range, rating, tags, type, sort)
  2. Click "Generate Yearbook"
  3. PDF generates based on currently filtered/sorted view
  4. Download begins automatically

### Reusing Existing Filter Modal

**Do NOT build new filter UI.** Instead:

- Read the current filter state from the existing filter modal/component
- Use those filters as input for yearbook generation
- The yearbook should include exactly what the user sees in their filtered view

This approach:

- ✅ Maintains UI consistency
- ✅ Avoids duplicate code
- ✅ Users already understand the filtering system
- ✅ WYSIWYG: "What you see is what you get" in the yearbook

### Generation Button

- "Generate Yearbook" button appears when filters are active (or always in menu)
- Show loading state while generating
- Download PDF automatically when complete
- Optional: Show preview of item count before generating ("Generate yearbook with 23 items")

## PDF Layout Design

### Design Principles

- **Minimalist**: Clean typography, generous whitespace
- **Personalized**: Incorporate user's custom UI accent colors for headers, dividers, and highlights
- **Professional**: High-quality layout that feels like a real yearbook

### Cover Page

- Title: "My [Year/Period] Yearbook" or custom title
- Subtitle: Date range covered
- Statistics block:
  - Total items (X books, Y movies)
  - Average rating
  - Total hours (if available)
  - Favorite genre/tag
- Use user's accent color for title and key stats

### Individual Item Pages

**One item per page:**

Layout:

```
┌─────────────────────────────┐
│                             │
│      [Cover Image]          │  <- Centered, scaled nicely
│                             │
├─────────────────────────────┤
│ Title                       │  <- Large, bold
│ by Author/Director          │  <- Smaller
│                             │
│ ★★★★★                      │  <- Rating (filled stars in accent color)
│                             │
│ Reviewed: Jan 15, 2024      │
│ Tags: fiction, scifi        │
│                             │
├─────────────────────────────┤
│ Review Text                 │  <- User's review/notes
│ (if present)                │     Wrapped nicely
│                             │
└─────────────────────────────┘
```

### Back Cover (optional)

- "Created with [App Name]"
- Generation date
- Subtle accent color accent

## Technical Requirements

### PDF Generation Library

Use a JavaScript PDF library that supports:

- Images (for covers)
- Custom fonts/typography
- Precise layout control
- Works in browser (no server-side requirement)

Recommended: **jsPDF** with **jsPDF-AutoTable** or **PDFKit** (via browserify)

### Cover Images

- Embed cover images directly in PDF (as base64 or binary)
- Scale images proportionally to fit designated space
- Handle missing images gracefully (placeholder or skip image)
- Fetch from cache/local storage if already downloaded
- If image URLs need fetching, do this before PDF generation starts

### Color Integration

- Read user's selected accent color from app settings/preferences
- Apply to:
  - Cover page title
  - Section headers
  - Star ratings (filled stars)
  - Divider lines
  - Any highlighted statistics

### Performance Considerations

- Show progress indicator during generation
- If many items (50+), warn user about file size
- Consider pagination or compression for very large collections
- Generate PDF in chunks if possible to avoid freezing UI

## Test-Driven Development Approach

### Phase 1: Tests for Reading Existing Filter State

**Test Suite: Filter State Integration**

Write tests that verify the yearbook generator correctly reads from existing filter state:

1. **Reads current filter state correctly**

   ```javascript
   test('reads active filters from filter store/state', () => {
     // Given: user has applied filters (date range, rating, tags)
     // When: yearbook generator accesses filter state
     // Then: correct filter values retrieved
   })
   ```

2. **Generates yearbook with filtered items**

   ```javascript
   test('uses currently filtered items for yearbook', () => {
     // Given: user has filtered to "last year + 5 stars"
     // And: filtered view shows 10 items
     // When: generate yearbook
     // Then: yearbook contains exactly those 10 items
   })
   ```

3. **Respects sort order**

   ```javascript
   test('maintains current sort order in yearbook', () => {
     // Given: user has sorted by "rating descending"
     // When: generate yearbook
     // Then: items appear in yearbook in same order
   })
   ```

4. **Handles no active filters**

   ```javascript
   test('uses all items when no filters active', () => {
     // Given: no filters applied (showing all items)
     // When: generate yearbook
     // Then: yearbook contains entire collection
   })
   ```

5. **Handles empty filtered results**

   ```javascript
   test('handles when filters result in zero items', () => {
     // Given: filters applied that match nothing
     // When: attempt to generate yearbook
     // Then: shows friendly message about empty results
     // And: does not generate PDF
   })
   ```

### Phase 2: Tests for PDF Generation

**Test Suite: PDF Structure**

Write tests that verify:

1. **PDF is created successfully**

   ```javascript
   test('generates valid PDF document', async () => {
     // Given: filtered collection of items
     // When: generateYearbook() called
     // Then: PDF Blob returned with correct MIME type
   })
   ```

2. **Cover page is generated**

   ```javascript
   test('includes cover page with title and stats', () => {
     // Given: 10 books rated 4.5 avg
     // When: generate PDF
     // Then: cover page includes:
     //   - Title with date range
     //   - "10 books" stat
     //   - "★★★★½ average" stat
   })
   ```

3. **Individual item pages are created**

   ```javascript
   test('creates one page per item', () => {
     // Given: 5 filtered items
     // When: generate PDF
     // Then: PDF has 6 pages (1 cover + 5 items)
   })

   test('item page includes all required elements', () => {
     // Given: item with title, rating, review, tags
     // When: generate page for item
     // Then: page includes:
     //   - Title and author/director
     //   - Star rating display
     //   - Review text
     //   - Tags
     //   - Date reviewed
   })
   ```

4. **Images are embedded correctly**

   ```javascript
   test('embeds cover images in PDF', async () => {
     // Given: item with cover image URL
     // When: generate PDF
     // Then: image is fetched and embedded in document
   })

   test('handles missing images gracefully', async () => {
     // Given: item with no cover image
     // When: generate PDF
     // Then: page generated without image, no error
   })
   ```

5. **User accent color is applied**

   ```javascript
   test('applies user accent color to elements', () => {
     // Given: user has accent color #FF6B6B
     // When: generate PDF
     // Then: title, stars, dividers use #FF6B6B
   })
   ```

6. **Empty collection handled gracefully**

   ```javascript
   test('handles no items matching filter', () => {
     // Given: filters that match zero items
     // When: attempt to generate PDF
     // Then: show friendly message, don't generate empty PDF
   })
   ```

### Phase 3: Tests for UI Integration

**Test Suite: User Interface**

Write tests that verify:

1. **Generation button is present**

   ```javascript
   test('menu/toolbar includes "Generate Yearbook" button', () => {
     // Given: app is loaded
     // When: view menu or toolbar
     // Then: "Generate Yearbook" option visible
   })
   ```

2. **Button shows item count**

   ```javascript
   test('button displays count of filtered items', () => {
     // Given: user has filtered to 23 items
     // When: viewing generation button
     // Then: button text shows "Generate Yearbook (23 items)"
   })
   ```

3. **Generation triggers correctly**

   ```javascript
   test('clicking button starts PDF creation', async () => {
     // Given: filters are applied
     // When: click "Generate Yearbook"
     // Then: loading indicator appears
     // And: PDF generation function is called with filtered items
   })
   ```

4. **Loading state is shown**

   ```javascript
   test('shows loading state during generation', async () => {
     // Given: generation started
     // When: PDF is being created
     // Then: loading spinner/overlay shown
     // And: button is disabled during generation
   })
   ```

5. **PDF downloads automatically**

   ```javascript
   test('downloads PDF when generation completes', async () => {
     // Given: PDF generation completes
     // When: processing finishes
     // Then: browser download triggered
     // And: filename includes date range or filter info
     //      (e.g., "2024-yearbook.pdf" or "5-star-books.pdf")
   })
   ```

6. **Loading state clears after success**

   ```javascript
   test('clears loading state after successful generation', async () => {
     // Given: PDF generated and downloaded
     // When: process completes
     // Then: loading indicator disappears
     // And: button returns to normal state
     // And: brief success message shown (optional)
   })
   ```

7. **Error handling**

   ```javascript
   test('shows error if generation fails', async () => {
     // Given: PDF generation fails
     // When: error occurs
     // Then: error message shown to user
     // And: loading state clears
     // And: user can try again
   })
   ```

8. **Empty results prevention**

   ```javascript
   test('prevents generation when no items filtered', () => {
     // Given: filters result in 0 items
     // When: user tries to generate yearbook
     // Then: warning message shown
     // And: PDF generation does not start
   })
   ```

## Implementation Guidance

### Step 1: Create Filter State Reader

After writing tests in Phase 1, implement:

- `getCurrentFilteredItems()` - reads from existing filter state/store and returns currently filtered items array
- `getCurrentSortOrder()` - reads current sort setting from state
- Should integrate with whatever state management the app uses (Redux, Zustand, Context, etc.)

### Step 2: Create PDF Generation Module

After writing tests in Phase 2, implement:

- `generateYearbookPDF(items, options)` - main function
  - `options`: { accentColor, coverTitle, dateRange }
- `createCoverPage(pdf, stats, options)`
- `createItemPage(pdf, item, options)`
- `embedCoverImage(pdf, imageUrl)`
- `calculateStats(items)` - returns object with totals, averages, etc.

### Step 3: Create UI Components

After writing tests in Phase 3, implement:

- "Generate Yearbook" button in menu/toolbar
- Loading state overlay during generation
- Success/error notifications
- Optional: Item count display on button

### Step 4: Integration

- Wire up button click → read current filtered items
- Wire up to PDF generation function
- Handle download trigger
- Add error boundaries

## Data Requirements

### Expected Input Format

The yearbook generator should receive an array of already-filtered items from the existing filter system. Each item should be in the format:

```javascript
{
  id: "book-123",
  type: "book", // or "movie"
  title: "Project Hail Mary",
  author: "Andy Weir", // or director for movies
  rating: 5,
  dateReviewed: "2024-01-15",
  tags: ["scifi", "audiobook"],
  review: "Absolutely loved this...",
  coverUrl: "https://...",
  // ... other metadata
}
```

### Reading Existing Filter State

The implementation should integrate with your existing filter/state management system to:

- Access the currently filtered array of items
- Read the current sort order
- Optionally read filter metadata (date range, which filters are active) for the cover page title

**Note**: You do NOT need to re-implement filtering logic. Simply read what's already filtered in the UI.

## Dependencies to Add

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2"
  }
}
```

Or alternative if you prefer more control:

```json
{
  "dependencies": {
    "pdfkit": "^0.13.0"
  }
}
```

## File Structure

```
src/
  features/
    yearbook/
      YearbookGenerator.js        # PDF generation logic
      yearbookButton.jsx          # Button component for toolbar/menu
      filterStateReader.js        # Utilities to read existing filter state
      pdfStyles.js               # Style constants (fonts, colors, spacing)
      __tests__/
        filterStateReader.test.js
        YearbookGenerator.test.js
        yearbookButton.test.js
```

## Design Tokens

Define constants for PDF styling:

```javascript
const YEARBOOK_STYLES = {
  fonts: {
    title: { size: 24, weight: 'bold' },
    subtitle: { size: 16, weight: 'normal' },
    body: { size: 11, weight: 'normal' },
    small: { size: 9, weight: 'normal' }
  },
  spacing: {
    pageMargin: 40,
    sectionGap: 20,
    elementGap: 10
  },
  colors: {
    text: '#1a1a1a',
    textLight: '#666666',
    divider: '#e0e0e0',
    accent: null // set from user preferences
  },
  images: {
    maxWidth: 300,
    maxHeight: 400
  }
}
```

## Accessibility Considerations

- Use semantic PDF structure (if library supports)
- Ensure sufficient color contrast even with user accent colors
- Provide alt text for embedded images
- Make sure text is selectable/copyable in final PDF

## Future Enhancements (Not in Initial Implementation)

- Custom templates (different layouts)
- Add charts/graphs (genre breakdown pie chart, rating distribution)
- Multiple pages per item for longer reviews
- Export to other formats (EPUB, print-ready PDF)
- Scheduled auto-generation (e.g., monthly yearbook)
- Social sharing (upload to dedicated sharing platform)

## Success Metrics

After implementation, verify:

- ✅ Users can apply multiple filters and see accurate results
- ✅ PDFs generate within 5 seconds for collections up to 50 items
- ✅ PDFs look good on mobile and desktop PDF viewers
- ✅ Cover images display correctly at appropriate resolution
- ✅ User accent colors are visually appealing in the PDF
- ✅ No crashes or errors for edge cases (empty reviews, missing data, etc.)

## Notes for Development Team

- **CRITICAL**: Do not build new filter UI. Integrate with existing filter modal/system that's already in the app.
- The yearbook should generate from whatever is currently visible in the filtered view - WYSIWYG principle
- Prioritize clean, readable code over premature optimization
- Write descriptive test names that serve as documentation
- Test on multiple devices/PDF viewers before considering complete
- If cover images fail to load, the PDF should still generate successfully
- Consider file size - warn user if PDF will be >10MB
- Use async/await for image loading to keep UI responsive
- The button should ideally show how many items will be in the yearbook (e.g., "Generate Yearbook (47 items)")

---

**Remember**: Tests first, implementation second. Each test should fail initially, then pass after implementing the feature.
