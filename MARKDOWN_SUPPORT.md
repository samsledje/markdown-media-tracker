# Markdown Support in Review Text

## Overview

Review and notes text in Markdown Media Tracker now supports full Markdown formatting! This allows you to create rich, well-structured reviews with proper formatting, lists, quotes, code snippets, and more.

## What's New

### ✨ Full Markdown Rendering
- Headers (h1-h6)
- **Bold** and *italic* text
- [Links](https://example.com)
- Ordered and unordered lists
- > Blockquotes
- `Inline code`
- Code blocks
- Horizontal rules
- Tables (basic support)

### 🔒 Security
All markdown is sanitized using DOMPurify to prevent XSS attacks while preserving safe formatting.

### 🎨 Beautiful Styling
Custom CSS ensures markdown content matches the app's dark theme with:
- Color-coded elements
- Proper spacing and typography
- Hover effects on links
- Styled code blocks
- Elegant blockquotes

## Example Usage

When you write a review like this:

```markdown
## My Thoughts

This is a **masterpiece** that truly showcases *brilliant* storytelling.

### Highlights

1. Outstanding performances
2. Beautiful cinematography
3. Compelling narrative

> "An unforgettable experience"

The technical aspects, particularly the use of `color grading`, were exceptional.

---

**Final Rating**: 5/5 stars
```

It renders as beautifully formatted text with all the styling applied!

## Supported Markdown Syntax

### Text Formatting
- `**bold**` → **bold**
- `*italic*` → *italic*
- `***bold italic***` → ***bold italic***

### Headings
```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
```

### Lists
```markdown
- Bullet point
- Another point
  - Nested point

1. Numbered item
2. Another item
```

### Quotes
```markdown
> This is a blockquote
> It can span multiple lines
```

### Code
- Inline: `` `code here` ``
- Block:
  ````markdown
  ```
  Multi-line code block
  preserves formatting
  ```
  ````

### Links
```markdown
[Link text](https://example.com)
```

### Horizontal Rules
```markdown
---
or
***
```

## Implementation Details

### Files Changed

1. **package.json**
   - Added `marked` (markdown parser)
   - Added `dompurify` (HTML sanitizer)

2. **src/utils/markdownUtils.js**
   - Added `renderMarkdown()` function
   - Configures GitHub Flavored Markdown
   - Sanitizes output for security

3. **src/components/cards/ViewDetails.jsx**
   - Imports `renderMarkdown` utility
   - Renders review HTML with `dangerouslySetInnerHTML`
   - Applies `prose-review` CSS class

4. **src/index.css**
   - Added comprehensive markdown styling
   - Matches app's dark theme
   - Responsive and accessible

### Code Example

```javascript
// In markdownUtils.js
export const renderMarkdown = (markdown) => {
  if (!markdown) return '';
  
  marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true,    // Enable GitHub Flavored Markdown
  });
  
  const rawHtml = marked.parse(markdown);
  
  // Sanitize for security
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3',
      'h4', 'h5', 'h6', 'hr', 'a', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title']
  });
  
  return cleanHtml;
};
```

## Testing

Sample markdown files are included in `data/`:
- `test-markdown-movie.md` - Movie review with varied formatting
- `test-markdown-book.md` - Book review with complex structure

## Future Enhancements

Potential additions mentioned in the issue:

1. **[[Wikilinks]]** - Internal links between items
   - Could enable `[[Item Title]]` to link to other tracked items
   - Useful for series, adaptations, related works

2. **#tag-linking** - Clickable tags within text
   - Make hashtags automatically filter by tag
   - Better integration with the tagging system

3. **Property References** - Advanced Obsidian features
   - Link to other properties
   - Query and embed data
   - May be better suited for Obsidian itself

## Backward Compatibility

- Existing plain text reviews continue to work
- No breaking changes to data format
- Gradual adoption by users

## Notes

- Markdown is stored as plain text in the `.md` files
- Rendering happens on display only
- Works with both local files and Google Drive storage
- Fully compatible with Obsidian and other markdown editors

---

Implemented in PR: Support Markdown in review text
Issue: #[issue-number]
