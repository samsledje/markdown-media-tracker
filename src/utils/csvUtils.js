import { CSV_FORMATS } from '../constants/index.js';

/**
 * Parse CSV text into headers and rows
 * @param {string} text - CSV text content
 * @returns {object} Object with headers array and rows array
 */
export const parseCSV = (text) => {
  // Basic RFC4180-compatible CSV parser (handles quoted fields)
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const nxt = text[i + 1];

    if (ch === '"') {
      if (inQuotes && nxt === '"') { // escaped quote
        cur += '"';
        i++; // skip next
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
    } else if ((ch === '\n' || (ch === '\r' && nxt === '\n')) && !inQuotes) {
      // handle CRLF or LF
      if (ch === '\r' && nxt === '\n') i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += ch;
    }
  }
  
  // push last
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1).map(r => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = r[i] !== undefined ? r[i].trim() : '';
    }
    return obj;
  }).filter(r => Object.values(r).some(v => v !== ''));

  return { headers, rows: dataRows };
};

/**
 * Detect CSV format based on headers
 * @param {string[]} headers - Array of header strings
 * @returns {string} Detected format type
 */
export const detectCSVFormat = (headers = []) => {
  const h = headers.map(x => String(x).toLowerCase()).join('|');
  if (h.includes('my rating') || h.includes('isbn') && h.includes('author')) return CSV_FORMATS.GOODREADS;
  if (h.includes('your rating') || h.includes('watched') || h.includes('name') && h.includes('year')) return CSV_FORMATS.LETTERBOXD;
  return CSV_FORMATS.GENERIC;
};

/**
 * Map Goodreads CSV row to item object
 * @param {object} r - Raw CSV row object
 * @returns {object} Mapped item object
 */
export const mapGoodreadsRow = (r) => {
  const tags = (r['My Tags'] || r['Tags'] || r['Bookshelves'] || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const rating = r['My Rating'] ? parseInt(r['My Rating'], 10) : (r['Rating'] ? parseInt(r['Rating'], 10) : 0);
  
  return {
    title: r['Title'] || r['title'] || r['Name'] || '',
    author: r['Author'] || r['author'] || '',
    isbn: r['ISBN13'] || r['ISBN'] || '',
    year: r['Year Published'] || r['Original Publication Year'] || r['Year'] || '',
    rating: isNaN(rating) ? 0 : rating,
    dateRead: r['Date Read'] || r['Date read'] || r['Date read (YYYY/MM/DD)'] || '',
    tags,
    review: r['My Review'] || r['Review'] || '',
    type: 'book',
    dateAdded: new Date().toISOString()
  };
};

/**
 * Map Letterboxd CSV row to item object
 * @param {object} r - Raw CSV row object
 * @returns {object} Mapped item object
 */
export const mapLetterboxdRow = (r) => {
  const tags = (r['Tags'] || r['tags'] || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const rawRating = r['Your Rating'] || r['Rating'] || r['star_rating'] || '';
  const rating = rawRating ? Math.round(parseFloat(rawRating)) : 0;
  
  return {
    title: r['Name'] || r['Title'] || r['name'] || '',
    year: r['Year'] || r['year'] || '',
    rating: isNaN(rating) ? 0 : rating,
    dateWatched: r['Date Watched'] || r['Watched Date'] || r['Date'] || '',
    tags,
    review: r['Review'] || r['Notes'] || '',
    type: 'movie',
    dateAdded: new Date().toISOString()
  };
};

/**
 * Map generic CSV row to item object
 * @param {object} r - Raw CSV row object
 * @returns {object} Mapped item object
 */
export const mapGenericRow = (r) => {
  // best-effort mapping from common column names
  const title = r['title'] || r['Title'] || r['name'] || r['Name'] || '';
  const type = (r['type'] || '').toLowerCase().includes('movie') ? 'movie' : 'book';
  const tags = (r['tags'] || r['Tags'] || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const actors = (r['actors'] || r['Actors'] || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const rating = r['rating'] ? Math.round(parseFloat(r['rating'])) : 0;
  
  return {
    title,
    type,
    author: r['author'] || r['Author'] || '',
    director: r['director'] || r['Director'] || '',
    actors,
    isbn: r['isbn'] || r['ISBN'] || '',
    year: r['year'] || r['Year'] || '',
    rating: isNaN(rating) ? 0 : rating,
    dateRead: r['dateRead'] || r['Date Read'] || r['date_read'] || '',
    dateWatched: r['dateWatched'] || r['Date Watched'] || r['date_watched'] || '',
    tags,
    review: r['review'] || r['Review'] || '',
    dateAdded: new Date().toISOString()
  };
};

/**
 * Export items to CSV format
 * @param {object[]} items - Array of items to export
 * @returns {void} Downloads CSV file
 */
export const exportCSV = (items = []) => {
  try {
    const headers = [
      'id', 'title', 'type', 'author', 'director', 'actors', 'isbn', 'year', 'rating',
      'dateRead', 'dateWatched', 'dateAdded', 'tags', 'coverUrl', 'review', 'filename'
    ];

    const escape = (s) => {
      if (s === null || s === undefined) return '""';
      const str = String(Array.isArray(s) ? s.join(';') : s);
      return '"' + str.replace(/"/g, '""') + '"';
    };

    const rows = items.map(it => headers.map(h => {
      switch (h) {
        case 'actors': return escape(it.actors || []);
        case 'tags': return escape(it.tags || []);
        case 'filename': return escape(it.filename || '');
        case 'dateRead': return escape(it.dateRead || '');
        case 'dateWatched': return escape(it.dateWatched || '');
        default: return escape(it[h] ?? '');
      }
    }).join(',')).join('\n');

    const csv = headers.join(',') + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `media-tracker-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting CSV', err);
    alert('Error exporting CSV. See console for details.');
  }
};