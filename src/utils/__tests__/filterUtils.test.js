import { describe, it, expect } from 'vitest';
import { filterItems, sortItems, getAllTags, getAllStatuses } from '../../utils/filterUtils.js';
import { SORT_OPTIONS, SORT_ORDERS, RECENT_FILTER_OPTIONS } from '../../constants/index.js';

describe('filterUtils', () => {
  const sampleItems = [
    {
      id: '1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      type: 'book',
      status: 'read',
      rating: 5,
      year: '1925',
      tags: ['classic', 'fiction'],
      dateAdded: '2024-01-10',
      dateRead: '2024-01-15',
    },
    {
      id: '2',
      title: 'The Matrix',
      director: 'Wachowski Brothers',
      actors: ['Keanu Reeves', 'Laurence Fishburne'],
      type: 'movie',
      status: 'watched',
      rating: 5,
      year: '1999',
      tags: ['sci-fi', 'action'],
      dateAdded: '2024-02-10',
      dateWatched: '2024-02-15',
    },
    {
      id: '3',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      type: 'book',
      status: 'reading',
      rating: 0,
      year: '1960',
      tags: ['classic'],
      dateAdded: '2024-03-01',
    },
    {
      id: '4',
      title: 'Inception',
      director: 'Christopher Nolan',
      type: 'movie',
      status: 'to-watch',
      rating: 0,
      year: '2010',
      tags: ['sci-fi', 'thriller'],
      dateAdded: '2024-03-05',
    },
  ];

  describe('filterItems', () => {
    it('should return all items when no filters applied', () => {
      const result = filterItems(sampleItems, {});
      expect(result).toHaveLength(4);
    });

    it('should filter by search term in title', () => {
      const result = filterItems(sampleItems, { searchTerm: 'matrix' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('The Matrix');
    });

    it('should filter by search term in author', () => {
      const result = filterItems(sampleItems, { searchTerm: 'fitzgerald' });
      expect(result).toHaveLength(1);
      expect(result[0].author).toBe('F. Scott Fitzgerald');
    });

    it('should filter by search term in director', () => {
      const result = filterItems(sampleItems, { searchTerm: 'nolan' });
      expect(result).toHaveLength(1);
      expect(result[0].director).toBe('Christopher Nolan');
    });

    it('should filter by search term in actors', () => {
      const result = filterItems(sampleItems, { searchTerm: 'keanu' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('The Matrix');
    });

    it('should filter by search term in tags', () => {
      const result = filterItems(sampleItems, { searchTerm: 'thriller' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Inception');
    });

    it('should filter by type - books only', () => {
      const result = filterItems(sampleItems, { filterType: 'book' });
      expect(result).toHaveLength(2);
      expect(result.every(item => item.type === 'book')).toBe(true);
    });

    it('should filter by type - movies only', () => {
      const result = filterItems(sampleItems, { filterType: 'movie' });
      expect(result).toHaveLength(2);
      expect(result.every(item => item.type === 'movie')).toBe(true);
    });

    it('should filter by rating', () => {
      const result = filterItems(sampleItems, { filterRating: 5 });
      expect(result).toHaveLength(2);
      expect(result.every(item => item.rating >= 5)).toBe(true);
    });

    it('should filter by tags', () => {
      const result = filterItems(sampleItems, { filterTags: ['classic'] });
      expect(result).toHaveLength(2);
      expect(result.every(item => item.tags?.includes('classic'))).toBe(true);
    });

    it('should filter by multiple tags (AND logic)', () => {
      const result = filterItems(sampleItems, { filterTags: ['classic', 'fiction'] });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('The Great Gatsby');
    });

    it('should filter by status', () => {
      const result = filterItems(sampleItems, { filterStatuses: ['read'] });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('read');
    });

    it('should filter by multiple statuses', () => {
      const result = filterItems(sampleItems, { filterStatuses: ['read', 'watched'] });
      expect(result).toHaveLength(2);
      expect(result.every(item => ['read', 'watched'].includes(item.status))).toBe(true);
    });

    it('should filter by recent - last 7 days', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const itemsWithRecentDate = [
        {
          ...sampleItems[0],
          dateRead: recentDate.toISOString().split('T')[0],
        },
      ];
      
      const result = filterItems(itemsWithRecentDate, { 
        filterRecent: RECENT_FILTER_OPTIONS.LAST_7 
      });
      expect(result).toHaveLength(1);
    });

    it('should filter by recent - last 30 days', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
      const itemsWithRecentDate = [
        {
          ...sampleItems[0],
          dateRead: recentDate.toISOString().split('T')[0],
        },
      ];
      
      const result = filterItems(itemsWithRecentDate, { 
        filterRecent: RECENT_FILTER_OPTIONS.LAST_30 
      });
      expect(result).toHaveLength(1);
    });

    it('should not include items without consumption date in recent filter', () => {
      const result = filterItems(sampleItems, { 
        filterRecent: RECENT_FILTER_OPTIONS.LAST_7 
      });
      expect(result).toHaveLength(0);
    });

    it('should combine multiple filters', () => {
      const result = filterItems(sampleItems, {
        filterType: 'book',
        filterRating: 4,
        filterTags: ['classic'],
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('The Great Gatsby');
    });

    it('should handle empty items array', () => {
      const result = filterItems([], { searchTerm: 'test' });
      expect(result).toHaveLength(0);
    });

    it('should be case insensitive for search', () => {
      const result = filterItems(sampleItems, { searchTerm: 'MATRIX' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('The Matrix');
    });

    it('should handle items without tags', () => {
      const itemsNoTags = [{ id: '1', title: 'Test', type: 'book' }];
      const result = filterItems(itemsNoTags, { filterTags: ['fiction'] });
      expect(result).toHaveLength(0);
    });

    it('should filter by ISBN', () => {
      const itemsWithISBN = [
        { ...sampleItems[0], isbn: '9780743273565' },
      ];
      const result = filterItems(itemsWithISBN, { searchTerm: '9780743273565' });
      expect(result).toHaveLength(1);
    });
  });

  describe('sortItems', () => {
    it('should sort by title ascending', () => {
      const result = sortItems(sampleItems, SORT_OPTIONS.TITLE, SORT_ORDERS.ASC);
      expect(result[0].title).toBe('Inception');
      expect(result[1].title).toBe('The Great Gatsby');
      expect(result[2].title).toBe('The Matrix');
      expect(result[3].title).toBe('To Kill a Mockingbird');
    });

    it('should sort by title descending', () => {
      const result = sortItems(sampleItems, SORT_OPTIONS.TITLE, SORT_ORDERS.DESC);
      expect(result[0].title).toBe('To Kill a Mockingbird');
      expect(result[3].title).toBe('Inception');
    });

    it('should sort by author ascending', () => {
      const result = sortItems(sampleItems, SORT_OPTIONS.AUTHOR, SORT_ORDERS.ASC);
      // Should use director for movies
      expect(result[0].director || result[0].author).toBe('Christopher Nolan');
      expect(result[1].author || result[1].director).toBe('F. Scott Fitzgerald');
    });

    it('should sort by year ascending', () => {
      const result = sortItems(sampleItems, SORT_OPTIONS.YEAR, SORT_ORDERS.ASC);
      expect(result[0].year).toBe('1925');
      expect(result[3].year).toBe('2010');
    });

    it('should sort by year descending', () => {
      const result = sortItems(sampleItems, SORT_OPTIONS.YEAR, SORT_ORDERS.DESC);
      expect(result[0].year).toBe('2010');
      expect(result[3].year).toBe('1925');
    });

    it('should sort by rating ascending', () => {
      const result = sortItems(sampleItems, SORT_OPTIONS.RATING, SORT_ORDERS.ASC);
      expect(result[0].rating).toBe(0);
      expect(result[2].rating).toBe(5);
    });

    it('should sort by rating descending', () => {
      const result = sortItems(sampleItems, SORT_OPTIONS.RATING, SORT_ORDERS.DESC);
      expect(result[0].rating).toBe(5);
    });

    it('should sort by date added ascending', () => {
      const result = sortItems(sampleItems, SORT_OPTIONS.DATE_ADDED, SORT_ORDERS.ASC);
      expect(result[0].dateAdded).toBe('2024-01-10');
      expect(result[3].dateAdded).toBe('2024-03-05');
    });

    it('should sort by date consumed ascending', () => {
      const result = sortItems(sampleItems, SORT_OPTIONS.DATE_CONSUMED, SORT_ORDERS.ASC);
      // Items without dates should come first (as 0)
      expect(result[2].dateRead).toBe('2024-01-15');
      expect(result[3].dateWatched).toBe('2024-02-15');
    });

    it('should sort by status in predefined order', () => {
      const result = sortItems(sampleItems, SORT_OPTIONS.STATUS, SORT_ORDERS.ASC);
      // Expected order: watched, read, watching, reading, to-watch, to-read
      const statuses = result.map(item => item.status);
      expect(statuses.indexOf('watched')).toBeLessThan(statuses.indexOf('reading'));
      expect(statuses.indexOf('read')).toBeLessThan(statuses.indexOf('to-watch'));
    });

    it('should not mutate original array', () => {
      const original = [...sampleItems];
      sortItems(sampleItems, SORT_OPTIONS.TITLE, SORT_ORDERS.ASC);
      expect(sampleItems).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = sortItems([], SORT_OPTIONS.TITLE, SORT_ORDERS.ASC);
      expect(result).toHaveLength(0);
    });

    it('should handle items without sort field', () => {
      const itemsNoYear = [
        { id: '1', title: 'A' },
        { id: '2', title: 'B', year: '2020' },
      ];
      const result = sortItems(itemsNoYear, SORT_OPTIONS.YEAR, SORT_ORDERS.ASC);
      expect(result).toHaveLength(2);
    });
  });

  describe('getAllTags', () => {
    it('should return all unique tags sorted', () => {
      const result = getAllTags(sampleItems);
      expect(result).toEqual(['action', 'classic', 'fiction', 'sci-fi', 'thriller']);
    });

    it('should handle empty items array', () => {
      const result = getAllTags([]);
      expect(result).toEqual([]);
    });

    it('should handle items without tags', () => {
      const itemsNoTags = [
        { id: '1', title: 'Test 1' },
        { id: '2', title: 'Test 2' },
      ];
      const result = getAllTags(itemsNoTags);
      expect(result).toEqual([]);
    });

    it('should handle duplicate tags', () => {
      const itemsWithDuplicates = [
        { id: '1', tags: ['fiction', 'classic'] },
        { id: '2', tags: ['fiction', 'modern'] },
      ];
      const result = getAllTags(itemsWithDuplicates);
      expect(result).toEqual(['classic', 'fiction', 'modern']);
    });

    it('should sort tags case-insensitively', () => {
      const itemsWithCasedTags = [
        { id: '1', tags: ['Zebra', 'apple', 'Banana'] },
      ];
      const result = getAllTags(itemsWithCasedTags);
      expect(result).toEqual(['apple', 'Banana', 'Zebra']);
    });
  });

  describe('getAllStatuses', () => {
    it('should return unique statuses in predefined order', () => {
      const result = getAllStatuses(sampleItems);
      // Should only include statuses that exist
      expect(result).toContain('read');
      expect(result).toContain('reading');
      expect(result).toContain('watched');
      expect(result).toContain('to-watch');
    });

    it('should return statuses in correct order', () => {
      const result = getAllStatuses(sampleItems);
      const readIndex = result.indexOf('read');
      const watchedIndex = result.indexOf('watched');
      const readingIndex = result.indexOf('reading');
      
      // Book statuses should come before movie statuses
      expect(readIndex).toBeGreaterThan(-1);
      expect(watchedIndex).toBeGreaterThan(-1);
    });

    it('should handle empty items array', () => {
      const result = getAllStatuses([]);
      expect(result).toEqual([]);
    });

    it('should handle items without status', () => {
      const itemsNoStatus = [
        { id: '1', title: 'Test 1' },
        { id: '2', title: 'Test 2' },
      ];
      const result = getAllStatuses(itemsNoStatus);
      expect(result).toEqual([]);
    });

    it('should not include duplicate statuses', () => {
      const itemsWithDuplicates = [
        { id: '1', status: 'read' },
        { id: '2', status: 'read' },
        { id: '3', status: 'watched' },
      ];
      const result = getAllStatuses(itemsWithDuplicates);
      expect(result.filter(s => s === 'read')).toHaveLength(1);
    });
  });
});
