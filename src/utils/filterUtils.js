import { RECENT_FILTER_OPTIONS, SORT_OPTIONS, SORT_ORDERS, STATUS_TYPES } from '../constants/index.js';

/**
 * Filter items based on search criteria
 * @param {object[]} items - Array of items to filter
 * @param {object} filters - Filter criteria
 * @returns {object[]} Filtered items
 */
export const filterItems = (items, filters) => {
  const {
    searchTerm = '',
    filterType = 'all',
    filterRating = 0,
    filterTags = [],
    filterRecent = 'any',
    filterStatuses = []
  } = filters;

  return items.filter(item => {
    const matchesSearch = !searchTerm || 
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.author && item.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.director && item.director.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.actors && item.actors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (item.isbn && item.isbn.includes(searchTerm)) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesRating = filterRating === 0 || (item.rating && item.rating >= filterRating);
    const matchesTags = filterTags.length === 0 || 
      (item.tags && filterTags.every(tag => item.tags.includes(tag)));
    
    const matchesStatus = filterStatuses.length === 0 || 
      (item.status && filterStatuses.includes(item.status));
    
    // Recent filter
    const consumedDateStr = item.dateRead || item.dateWatched || null;
    const matchesRecent = (() => {
      if (!filterRecent || filterRecent === RECENT_FILTER_OPTIONS.ANY) return true;
      if (!consumedDateStr) return false;
      const consumed = new Date(consumedDateStr);
      if (isNaN(consumed)) return false;
      const now = new Date();
      let days = 0;
      if (filterRecent === RECENT_FILTER_OPTIONS.LAST_7) days = 7;
      else if (filterRecent === RECENT_FILTER_OPTIONS.LAST_30) days = 30;
      else if (filterRecent === RECENT_FILTER_OPTIONS.LAST_90) days = 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return consumed >= cutoff;
    })();
    
    return matchesSearch && matchesType && matchesRating && matchesTags && matchesStatus && matchesRecent;
  });
};

/**
 * Sort items based on sort criteria
 * @param {object[]} items - Array of items to sort
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {object[]} Sorted items
 */
export const sortItems = (items, sortBy, sortOrder) => {
  return [...items].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case SORT_OPTIONS.TITLE:
        aVal = (a.title || '').toLowerCase();
        bVal = (b.title || '').toLowerCase();
        break;
      case SORT_OPTIONS.AUTHOR:
        aVal = (a.author || a.director || '').toLowerCase();
        bVal = (b.author || b.director || '').toLowerCase();
        break;
      case SORT_OPTIONS.YEAR:
        aVal = parseInt(a.year) || 0;
        bVal = parseInt(b.year) || 0;
        break;
      case SORT_OPTIONS.DATE_CONSUMED:
        aVal = new Date(a.dateRead || a.dateWatched || 0);
        bVal = new Date(b.dateRead || b.dateWatched || 0);
        break;
      case SORT_OPTIONS.RATING:
        aVal = a.rating || 0;
        bVal = b.rating || 0;
        break;
      case SORT_OPTIONS.DATE_ADDED:
      default:
        aVal = new Date(a.dateAdded || 0);
        bVal = new Date(b.dateAdded || 0);
        break;
    }
    
    if (aVal < bVal) return sortOrder === SORT_ORDERS.ASC ? -1 : 1;
    if (aVal > bVal) return sortOrder === SORT_ORDERS.ASC ? 1 : -1;
    return 0;
  });
};

/**
 * Get all unique tags from items
 * @param {object[]} items - Array of items
 * @returns {string[]} Sorted array of unique tags
 */
export const getAllTags = (items) => {
  return Array.from(
    new Set(items.flatMap(it => (it.tags && Array.isArray(it.tags)) ? it.tags : []))
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
};

/**
 * Get all unique statuses from items in the desired order
 * @param {object[]} items - Array of items
 * @returns {string[]} Array of unique statuses
 */
export const getAllStatuses = (items) => {
  const foundStatuses = new Set(items.map(item => item.status).filter(Boolean));
  
  // Define the desired order: book statuses first, then movie statuses
  const orderedStatuses = [
    STATUS_TYPES.BOOK.TO_READ,
    STATUS_TYPES.BOOK.READING, 
    STATUS_TYPES.BOOK.READ,
    STATUS_TYPES.MOVIE.TO_WATCH,
    STATUS_TYPES.MOVIE.WATCHING,
    STATUS_TYPES.MOVIE.WATCHED
  ];
  
  // Return only the statuses that actually exist in the items, in the desired order
  return orderedStatuses.filter(status => foundStatuses.has(status));
};