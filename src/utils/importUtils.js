import { parseCSV, detectCSVFormat, mapGoodreadsRow, mapLetterboxdRow, mapGenericRow } from './csvUtils.js';
import { isDuplicate } from './commonUtils.js';

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
    const format = detectCSVFormat(headers);
    
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

        const itemToSave = {
          title: m.title || 'Untitled',
          type: m.type || 'book',
          author: m.author || '',
          director: m.director || '',
          actors: m.actors || [],
          isbn: m.isbn || '',
          year: m.year || '',
          rating: m.rating || 0,
          tags: m.tags || [],
          coverUrl: m.coverUrl || '',
          dateRead: m.dateRead || '',
          dateWatched: m.dateWatched || '',
          dateAdded: m.dateAdded || new Date().toISOString(),
          review: m.review || ''
        };

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