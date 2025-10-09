/**
 * Check if user is currently typing in an input/textarea/contenteditable
 * @returns {boolean} True if user is typing
 */
export const isTyping = () => {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName && el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || el.isContentEditable) return true;
  if (el.getAttribute && el.getAttribute('role') === 'textbox') return true;
  return false;
};

/**
 * Generate a filename for an item
 * @param {string} title - Item title
 * @returns {string} Generated filename
 */
export const generateFilename = (title) => {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
};

/**
 * Check for duplicate items based on title and author
 * @param {object[]} items - Existing items array
 * @param {object} newItem - New item to check
 * @returns {boolean} True if duplicate exists
 */
/**
 * Normalize a string for comparison
 * - Unicode normalize and strip diacritics
 * - Lowercase
 * - Remove punctuation
 * - Collapse whitespace
 */
const normalizeForCompare = (val) => {
  if (val === null || val === undefined) return '';
  try {
    // normalize unicode, remove diacritics
    let s = String(val).normalize('NFKD').replace(/\p{Diacritic}/gu, '');
    // remove punctuation, keep letters, numbers and spaces
    s = s.replace(/[^\p{L}\p{N}\s]/gu, '');
    s = s.toLowerCase().trim().replace(/\s+/g, ' ');
    return s;
  } catch (e) {
    return String(val).toLowerCase().trim().replace(/\s+/g, ' ');
  }
};

/**
 * Normalize an ISBN-like value for comparison
 * - strips spreadsheet quirks like ="..." or leading apostrophes
 * - keeps only digits and trailing X (ISBN-10)
 */
export const normalizeISBNForCompare = (val) => {
  if (val === null || val === undefined) return '';
  let s = String(val).trim();
  if (s.startsWith('="') && s.endsWith('"')) s = s.slice(2, -1);
  else if (s.startsWith('=')) s = s.slice(1);
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
  if (s.startsWith("'")) s = s.slice(1);
  // remove any non-digit or X/x
  s = s.replace(/[^0-9xX]/g, '');
  return s.toUpperCase();
};

/**
 * Check for duplicate items based on normalized title+author OR ISBN
 */
export const isDuplicate = (items, newItem) => {
  const nTitle = normalizeForCompare(newItem.title || '');
  const nAuthor = normalizeForCompare(newItem.author || '');
  const nDirector = normalizeForCompare(newItem.director || '');
  const nIsbn = normalizeISBNForCompare(newItem.isbn || '');

  return items.some(it => {
    const itTitle = normalizeForCompare(it.title || '');
    const itAuthor = normalizeForCompare(it.author || '');
    const itDirector = normalizeForCompare(it.director || '');
    const itIsbn = normalizeISBNForCompare(it.isbn || '');
    
    // Check ISBN first (for books)
    if (itIsbn && nIsbn && itIsbn === nIsbn) return true;
    
    // For movies, check title + director
    if (newItem.type === 'movie' && it.type === 'movie') {
      if (itTitle === nTitle && itDirector === nDirector) return true;
      // Also check title-only for movies (fallback for cases with missing director info)
      if (itTitle === nTitle && (!itDirector || !nDirector)) return true;
    }
    
    // For books, check title + author
    if (newItem.type !== 'movie' && it.type !== 'movie') {
      return itTitle === nTitle && itAuthor === nAuthor;
    }
    
    return false;
  });
};

export { normalizeForCompare };

/**
 * Sanitize a display string for storing/presentation
 * - trims whitespace
 * - replaces smart quotes with straight quotes
 * - collapses multiple spaces
 * - normalizes unicode to NFC
 */
export const sanitizeDisplayString = (val) => {
  if (val === null || val === undefined) return '';
  try {
    let s = String(val).trim();
    // normalize unicode
    s = s.normalize('NFC');
    // replace smart quotes and common weird punctuation
    s = s.replace(/[\u2018\u2019\u201A\uFFFD]/g, "'");
    s = s.replace(/[\u201C\u201D\u201E]/g, '"');
    s = s.replace(/[\u2013\u2014]/g, '-');
    // collapse whitespace
    s = s.replace(/\s+/g, ' ');
    // trim stray surrounding quotes
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1).trim();
    }
    return s;
  } catch (e) {
    return String(val).trim();
  }
};