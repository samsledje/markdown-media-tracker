# Media Tracker

>A small, local-first app for tracking books and movies saved as Markdown files with YAML frontmatter. Built with React + Vite and designed to use the browser File System Access API so your library lives in a directory you choose.

## Features

- Store each item (book or movie) as a single `.md` file with YAML frontmatter.
- Browse, search, filter, sort, and batch-edit items.
- Add items manually or search online (Open Library for books, OMDb for movies).
- Customize card size and theme colors.
- Soft-delete to a `.trash` area with an undo stack.

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

## How to use (quick tips)

- Select Directory: Click "Select Directory" and pick a folder where you want item `.md` files stored.
- Search Online: Click "Search Online" to look up books (Open Library) or movies (OMDb). Pick a result to import and save.
- Add Manually: Fill in the form to create a new item.
- Filters: Use the Filters panel to narrow results by type (book/movie), rating, recent reads, and tags.
- Selection Mode: Toggle selection to batch-edit or delete multiple items.
- Customize: Click "Customize Style" (bottom-right) to change card size and theme colors.

## Demo screens (placeholders)

Below are example screenshots referenced by filename. These are placeholders — take screenshots from your running app and put them in `public/screenshots/` or `docs/screenshots/` and update the README references if you like.

- Select Directory screen (placeholder): `screenshots/select-directory.png`
	- Suggested shot: app landing page with the "Select Directory" button visible.

- Main list / grid view: `screenshots/main-list.png`
	- Suggested shot: after selecting a directory showing several items in the grid, search bar visible, and filters open.

- Item detail modal: `screenshots/item-detail.png`
	- Suggested shot: opened item detail modal showing metadata and markdown content.

- Search modal (OMDb / Open Library results): `screenshots/search-modal.png`
	- Suggested shot: search results returned from online lookup.

Place screenshots at the paths above relative to the project root (for example `public/screenshots/main-list.png`).

## Troubleshooting

- File System Access API not available: If your browser doesn't support the File System Access API (Safari on macOS and iOS currently lacks full support), the "Select Directory" flow will not work. Options:
	- Use Chrome or Edge on desktop.
	- Run the app inside an Electron wrapper that enables the API.
	- As a temporary fallback you can edit or add markdown files directly in the `data/` folder — the sample files there follow the same structure the app expects.

- OMDb rate limits / API key: If movie searches fail, confirm your OMDb key is set in `src/config.js` and valid. OMDb requires a (free) API key you can get at http://www.omdbapi.com/apikey.aspx.

## Project structure (important files)

- `src/MediaTracker.jsx` — main app UI and logic
- `src/config.js` — place your OMDb API key here
- `data/` — sample markdown items provided for demo/testing
- `public/` — static assets

## Contributing

Contributions are welcome. Open an issue or send a pull request with bug fixes or small improvements. For larger changes, please open an issue first to discuss the design.

## License

This project is licensed under the terms in the repository `LICENSE` file.

---