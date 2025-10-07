![Markdown Media Tracker Logo](public/logo_purple.svg)

# Markdown Media Tracker

A small, local-first app for tracking books and movies saved as Markdown files with YAML frontmatter. Built with React + Vite and designed to use the browser File System Access API so your library lives in a directory you choose.

- Store each item (book or movie) as a single `.md` file with YAML frontmatter.
- Browse, search, filter, sort, and batch-edit items.
- Add items manually or search online (Open Library for books, OMDb for movies).
- Customize card size and theme colors.

## Requirements

- Node.js (14+ recommended) and npm or yarn
- A Chromium-based desktop browser (Chrome, Edge) that supports the File System Access API. Safari and some browsers do not support this API — see Troubleshooting below.

Example data is included in the `data/` folder so you can browse sample items without selecting a directory.

## Install & run locally

1. Install dependencies

```bash
npm install
# or
# yarn
```

2. Start the dev server (Vite)

```bash
npm run dev
# or
# yarn dev
```

3. Open the URL printed by Vite (usually `http://localhost:5173`) in a supported browser.

When you first open the app you'll be prompted to "Select Directory". Choose or create a directory where the app will save individual `.md` files for each item.

## Configure the OMDb API key

The app uses OMDb (for movie lookups) and Open Library (for books). To configure an OMDb API key, edit the `src/config.js` file and set your key:

```js
// src/config.js
export const config = {
	// Replace the value below with your own OMDb API key
	omdbApiKey: 'YOUR_OMDB_API_KEY_HERE'
};
```

If you don't provide an OMDb API key the movie search functionality will be limited or fail — the app will still work for manual entry and browsing local markdown files.

## Demo Screenshots

### Select directory screen

![Directory select](public/screenshots/directory-select.jpg)

### Main grid view

![Main panel](public/screenshots/main-panel.jpg)

### Item detail modal

![Item detail modal](public/screenshots/item-detail.jpg)

### Online search

![Online search](public/screenshots/online-search.jpg)

### Customize appearance

![Customize appearance](public/screenshots/custom-colors.jpg)

## Obsidian Compatibility

This tracker is **fully compatible with Obsidian** and particularly well-suited for use with the new [**Bases**](https://help.obsidian.md/bases) feature

### What is Obsidian Bases?

Obsidian Bases is a powerful feature that allows you to create interactive filtered lists of notes. It turns any set of notes into a database-like view with filtering, sorting, and multiple view options (Table and Card views).

### How This Tracker Works with Obsidian

**YAML Frontmatter Structure**: Each media item is saved as a standalone `.md` file with structured YAML frontmatter containing metadata like title, type, author/director, year, rating, tags, and dates. This format is natively recognized by Obsidian's Properties system.

**Base-Ready Organization**: Your media library directory can be opened as an Obsidian vault or nested within an existing vault. Once opened, you can:
- Create a Base that filters for `type: book` or `type: movie`
- Use Obsidian's native filters to show items by rating, tags, or date ranges
- Switch between Table and Card views to see your collection
- Sort by any property (title, year, rating, date added, etc.)
- Leverage Obsidian's search and tagging system

**Example Base Setup**:
1. Open your media directory as an Obsidian vault
2. Enable the Bases plugin (Settings → Core Plugins → Bases)
3. Create a new Base
4. Add filters: `type = book` or `type = movie`
5. Display properties: title, author/director, year, rating, tags
6. Switch between views to see your collection as a table or cards

**Best of Both Worlds**: Use this React app for quick data entry, online search, and batch operations. Use Obsidian for deep linking between media notes and other notes in your vault, creating reading lists, or analyzing your library with Dataview queries.

**Notes in Obsidian**: The body content of each `.md` file (after the frontmatter) contains your review or notes, which can include standard Obsidian markdown features like internal links, embeds, and formatting.

## Import & Export CSV

- Export CSV: When you've selected a directory, click the "Export CSV" button in the header to download a CSV snapshot of your current library. Fields include title, type, author/director, year, rating, read/watched dates, tags, cover URL, and notes.
- Import CSV: Click "Import CSV" and choose a CSV file exported from this app or a supported service. The app attempts to detect common formats (Goodreads for books, Letterboxd for movies) and will map columns to the internal item fields. Imported items are saved as individual `.md` files in the selected directory.
- Goodreads: Export your "Bookshelf" CSV from Goodreads (My Books → Import/Export). The importer will look for columns like "Title", "Author", "My Rating", "My Review", and "Date Read" and map them to items.
- Letterboxd: Export your CSV from Letterboxd (Settings → Data → Export). The importer will look for columns like "Name", "Year", "Your Rating", and "Date Watched" and map them to movie items.

The importer uses simple heuristics and may not perfectly map every custom CSV. Review imported items and edit any missing details. Basic deduplication is performed by matching Title + Author; duplicates will be skipped. If your browser doesn't support the File System Access API, import will prompt you to select a directory first or use the `data/` folder as a fallback.


## Troubleshooting

- File System Access API not available: If your browser doesn't support the File System Access API (Safari on macOS and iOS currently lacks full support), the "Select Directory" flow will not work. Options:
	- Use Chrome or Edge on desktop.
	- Run the app inside an Electron wrapper that enables the API.
	- As a temporary fallback you can edit or add markdown files directly in the `data/` folder — the sample files there follow the same structure the app expects.

- OMDb rate limits / API key: If movie searches fail, confirm your OMDb key is set in `src/config.js` and valid. OMDb requires a (free) API key you can get at http://www.omdbapi.com/apikey.aspx.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed information about the project structure, development guidelines, and how to contribute.

## License

This project is licensed under the terms in the repository `LICENSE` file.

---