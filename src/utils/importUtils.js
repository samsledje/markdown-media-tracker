import { parseCSV, detectCSVFormat, mapGoodreadsRow, mapLetterboxdRow, mapGenericRow } from './csvUtils.js';
import { isDuplicate } from './commonUtils.js';
import { getBookByISBN } from '../services/openLibraryService.js';

/**
 * Process CSV import file
 * @param {File} file - CSV file to import
 * @param {object[]} existingItems - Existing items for duplicate detection
 * @param {Function} saveItem - Function to save individual items
 * @returns {Promise<number>} Number of items imported
 */
export const processCSVImport = async (file, existingItems, saveItem) => {
  if (!file) return 0;

  try {
    const text = await file.text();
    const { headers, rows } = parseCSV(text);
    console.log("Parsed CSV with headers:", headers);
    const format = detectCSVFormat(headers);
    console.log("Detected CSV format:", format);
    let mapped = [];
    if (format === 'goodreads') {
      mapped = rows.map(mapGoodreadsRow);
    } else if (format === 'letterboxd') {
      mapped = rows.map(mapLetterboxdRow);
    } else {
      mapped = rows.map(mapGenericRow);
    }

    let added = 0;
    for (const m of mapped) {
      try {
        // Basic de-dup: skip if same title+author exists
        if (isDuplicate(existingItems, m)) {
          continue;
        }

        // Debug: log the mapped row to confirm upstream ISBN parsing
        try {
          console.debug('[Import] mapped row before enrichment:', m);
        } catch (e) {
          // ignore
        }

        // If this is a Goodreads import and an ISBN exists, try to enrich missing fields
        let olData = null;
        if (format === 'goodreads' && m.isbn) {
          try {
            console.log('[Open Library] Looking up Open Library data for ISBN', m.isbn);
            olData = await getBookByISBN(m.isbn);
          } catch (err) {
            // ignore Open Library errors and proceed with spreadsheet data
            console.warn('[Open Library] lookup failed for ISBN', m.isbn, err);
            olData = null;
          }
        }

        // Merge fields: prefer spreadsheet values; only fill when spreadsheet is empty
        const mergedTitle = m.title && m.title.trim() ? m.title : (olData?.title || 'Untitled');
        const mergedAuthor = m.author && m.author.trim() ? m.author : (olData?.author || '');
        const mergedYear = m.year && String(m.year).trim() ? m.year : (olData?.year || '');
        const mergedCover = m.coverUrl && m.coverUrl.trim() ? m.coverUrl : (olData?.coverUrl || '');

        const baseItem = {
          title: mergedTitle,
          type: m.type || 'book',
          author: mergedAuthor,
          director: m.director || '',
          isbn: m.isbn || (olData?.isbn || ''),
          year: mergedYear,
          rating: m.rating || 0,
          tags: m.tags || [],
          status: m.status || 'unread',
          coverUrl: mergedCover,
          dateRead: m.dateRead || '',
          dateWatched: m.dateWatched || '',
          dateAdded: m.dateAdded || new Date().toISOString(),
          review: m.review || ''
        };

        // Only include actors if the source provides them or if it's a movie
        if (m.type && m.type.toLowerCase() === 'movie') {
          baseItem.actors = m.actors || [];
        } else if (m.actors && Array.isArray(m.actors) && m.actors.length > 0) {
          baseItem.actors = m.actors;
        }

        const itemToSave = baseItem;

        await saveItem(itemToSave);
        added++;
      } catch (err) {
        console.error('Error saving imported item', m, err);
      }
    }

    return { added, format };
  } catch (err) {
    console.error('Error importing CSV', err);
    throw new Error('Error importing CSV. See console for details.');
  }
};