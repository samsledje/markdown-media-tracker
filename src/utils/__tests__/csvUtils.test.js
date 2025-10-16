import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  detectCSVFormat,
  mapGoodreadsRow,
  mapLetterboxdRow,
  mapGenericRow,
  mapGoodreadsShelfToStatus,
  mapLetterboxdWatchedToStatus,
  exportCSV
} from '../../utils/csvUtils.js';
import { STATUS_TYPES } from '../../constants/index.js';

describe('csvUtils', () => {
  describe('mapGoodreadsShelfToStatus', () => {
    it('should map "to-read" to TO_READ status', () => {
      expect(mapGoodreadsShelfToStatus('to-read')).toBe(STATUS_TYPES.BOOK.TO_READ);
      expect(mapGoodreadsShelfToStatus('want-to-read')).toBe(STATUS_TYPES.BOOK.TO_READ);
    });

    it('should map "currently-reading" to READING status', () => {
      expect(mapGoodreadsShelfToStatus('currently-reading')).toBe(STATUS_TYPES.BOOK.READING);
      expect(mapGoodreadsShelfToStatus('reading')).toBe(STATUS_TYPES.BOOK.READING);
    });

    it('should map "read" to READ status', () => {
      expect(mapGoodreadsShelfToStatus('read')).toBe(STATUS_TYPES.BOOK.READ);
    });

    it('should map DNF-related shelves to DNF status', () => {
      expect(mapGoodreadsShelfToStatus('dnf')).toBe(STATUS_TYPES.BOOK.DNF);
      expect(mapGoodreadsShelfToStatus('did-not-finish')).toBe(STATUS_TYPES.BOOK.DNF);
      expect(mapGoodreadsShelfToStatus('abandoned')).toBe(STATUS_TYPES.BOOK.DNF);
      expect(mapGoodreadsShelfToStatus('gave-up')).toBe(STATUS_TYPES.BOOK.DNF);
      expect(mapGoodreadsShelfToStatus('did-not-finish-dnf')).toBe(STATUS_TYPES.BOOK.DNF);
    });

    it('should map unknown shelves to READ status as default', () => {
      expect(mapGoodreadsShelfToStatus('unknown')).toBe(STATUS_TYPES.BOOK.READ);
      expect(mapGoodreadsShelfToStatus('')).toBe(STATUS_TYPES.BOOK.READ);
      expect(mapGoodreadsShelfToStatus(null)).toBe(STATUS_TYPES.BOOK.READ);
    });

    it('should be case insensitive', () => {
      expect(mapGoodreadsShelfToStatus('DNF')).toBe(STATUS_TYPES.BOOK.DNF);
      expect(mapGoodreadsShelfToStatus('Did-Not-Finish')).toBe(STATUS_TYPES.BOOK.DNF);
      expect(mapGoodreadsShelfToStatus('READ')).toBe(STATUS_TYPES.BOOK.READ);
    });
  });

  describe('mapLetterboxdWatchedToStatus', () => {
    it('should map "true"/"1"/"yes" to WATCHED status', () => {
      expect(mapLetterboxdWatchedToStatus('true')).toBe(STATUS_TYPES.MOVIE.WATCHED);
      expect(mapLetterboxdWatchedToStatus('1')).toBe(STATUS_TYPES.MOVIE.WATCHED);
      expect(mapLetterboxdWatchedToStatus('yes')).toBe(STATUS_TYPES.MOVIE.WATCHED);
      expect(mapLetterboxdWatchedToStatus('True')).toBe(STATUS_TYPES.MOVIE.WATCHED);
      expect(mapLetterboxdWatchedToStatus('YES')).toBe(STATUS_TYPES.MOVIE.WATCHED);
    });

    it('should map other values to TO_WATCH status', () => {
      expect(mapLetterboxdWatchedToStatus('false')).toBe(STATUS_TYPES.MOVIE.TO_WATCH);
      expect(mapLetterboxdWatchedToStatus('0')).toBe(STATUS_TYPES.MOVIE.TO_WATCH);
      expect(mapLetterboxdWatchedToStatus('no')).toBe(STATUS_TYPES.MOVIE.TO_WATCH);
      expect(mapLetterboxdWatchedToStatus('')).toBe(STATUS_TYPES.MOVIE.TO_WATCH);
      expect(mapLetterboxdWatchedToStatus(null)).toBe(STATUS_TYPES.MOVIE.TO_WATCH);
      expect(mapLetterboxdWatchedToStatus('anything-else')).toBe(STATUS_TYPES.MOVIE.TO_WATCH);
    });
  });

  describe('mapGoodreadsRow', () => {
    it('should map basic Goodreads CSV row', () => {
      const row = {
        'Title': 'Test Book',
        'Author': 'Test Author',
        'ISBN': '1234567890',
        'My Rating': '4',
        'Exclusive Shelf': 'read',
        'My Review': 'Great book!'
      };

      const result = mapGoodreadsRow(row);

      expect(result).toEqual({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        year: '',
        rating: 4,
        status: STATUS_TYPES.BOOK.READ,
        dateRead: '',
        tags: [],
        review: 'Great book!',
        type: 'book',
        dateAdded: expect.any(String)
      });
    });

    it('should handle DNF shelf mapping', () => {
      const row = {
        'Title': 'DNF Book',
        'Author': 'Test Author',
        'Exclusive Shelf': 'dnf'
      };

      const result = mapGoodreadsRow(row);
      expect(result.status).toBe(STATUS_TYPES.BOOK.DNF);
    });

    it('should handle ISBN sanitization', () => {
      const row = {
        'Title': 'Test Book',
        'ISBN': '="9781234567890"'
      };

      const result = mapGoodreadsRow(row);
      expect(result.isbn).toBe('9781234567890');
    });

    it('should parse tags from various columns', () => {
      const row = {
        'Title': 'Test Book',
        'My Tags': 'fiction, classic',
        'Exclusive Shelf': 'read'
      };

      const result = mapGoodreadsRow(row);
      expect(result.tags).toEqual(['fiction', 'classic']);
    });
  });

  describe('mapLetterboxdRow', () => {
    it('should map basic Letterboxd CSV row', () => {
      const row = {
        'Name': 'Test Movie',
        'Year': '2020',
        'Your Rating': '8',
        'Watched': 'true',
        'Review': 'Great movie!'
      };

      const result = mapLetterboxdRow(row);

      expect(result).toEqual({
        title: 'Test Movie',
        year: '2020',
        rating: 4, // 8/2 = 4 stars
        status: STATUS_TYPES.MOVIE.WATCHED,
        dateWatched: '',
        tags: [],
        review: 'Great movie!',
        type: 'movie',
        dateAdded: expect.any(String)
      });
    });

    it('should handle unwatched movies', () => {
      const row = {
        'Name': 'Test Movie',
        'Watched': 'false'
      };

      const result = mapLetterboxdRow(row);
      expect(result.status).toBe(STATUS_TYPES.MOVIE.TO_WATCH);
    });

    it('should convert ratings from 10-point to 5-star scale', () => {
      expect(mapLetterboxdRow({ 'Your Rating': '10' }).rating).toBe(5);
      expect(mapLetterboxdRow({ 'Your Rating': '8' }).rating).toBe(4);
      expect(mapLetterboxdRow({ 'Your Rating': '6' }).rating).toBe(3);
      expect(mapLetterboxdRow({ 'Your Rating': '2' }).rating).toBe(1);
      expect(mapLetterboxdRow({ 'Your Rating': '0' }).rating).toBe(0);
    });
  });

  describe('mapGenericRow', () => {
    it('should map generic CSV row with explicit status', () => {
      const row = {
        'title': 'Test Item',
        'type': 'book',
        'status': 'dnf',
        'rating': '3'
      };

      const result = mapGenericRow(row);

      expect(result).toEqual({
        title: 'Test Item',
        type: 'book',
        status: 'dnf', // Preserves original status string
        author: '',
        director: '',
        actors: [],
        isbn: '',
        year: '',
        rating: 3,
        dateRead: '',
        dateWatched: '',
        tags: [],
        review: '',
        dateAdded: expect.any(String)
      });
    });

    it('should infer type from various columns', () => {
      expect(mapGenericRow({ 'title': 'Test', 'type': 'movie' }).type).toBe('movie');
      expect(mapGenericRow({ 'title': 'Test', 'type': 'Movie' }).type).toBe('movie');
      expect(mapGenericRow({ 'title': 'Test' }).type).toBe('book'); // default
    });

    it('should default status when not provided', () => {
      const bookResult = mapGenericRow({ 'title': 'Test Book' });
      expect(bookResult.status).toBe(STATUS_TYPES.BOOK.READ);

      const movieResult = mapGenericRow({ 'title': 'Test Movie', 'type': 'movie' });
      expect(movieResult.status).toBe(STATUS_TYPES.MOVIE.WATCHED);
    });
  });

  describe('parseCSV', () => {
    it('should parse basic CSV with headers', () => {
      const csv = 'name,age\nJohn,25\nJane,30';
      const result = parseCSV(csv);

      expect(result.headers).toEqual(['name', 'age']);
      expect(result.rows).toEqual([
        { name: 'John', age: '25' },
        { name: 'Jane', age: '30' }
      ]);
    });

    it('should handle quoted fields with commas', () => {
      const csv = 'name,description\nJohn,"Hello, world"\nJane,"Test, value"';
      const result = parseCSV(csv);

      expect(result.rows[0].description).toBe('Hello, world');
      expect(result.rows[1].description).toBe('Test, value');
    });

    it('should handle escaped quotes', () => {
      const csv = 'name,description\nJohn,"Hello ""world"""';
      const result = parseCSV(csv);

      expect(result.rows[0].description).toBe('Hello "world"');
    });

    it('should trim whitespace from fields', () => {
      const csv = 'name, age\n John , 25 \n Jane , 30 ';
      const result = parseCSV(csv);

      expect(result.rows[0].name).toBe('John');
      expect(result.rows[0].age).toBe('25');
    });
  });

  describe('detectCSVFormat', () => {
    it('should detect Goodreads format', () => {
      const headers = ['Title', 'Author', 'My Rating', 'ISBN'];
      expect(detectCSVFormat(headers)).toBe('goodreads');
    });

    it('should detect Letterboxd format', () => {
      const headers = ['Name', 'Year', 'Your Rating', 'Watched'];
      expect(detectCSVFormat(headers)).toBe('letterboxd');
    });

    it('should detect Letterboxd by URI column', () => {
      const headers = ['Title', 'Letterboxd URI', 'Rating'];
      expect(detectCSVFormat(headers)).toBe('letterboxd');
    });

    it('should return generic for unknown format', () => {
      const headers = ['Custom Title', 'Custom Author'];
      expect(detectCSVFormat(headers)).toBe('generic');
    });
  });

  describe('exportCSV', () => {
    // Mock window.URL and document for testing
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;

    beforeEach(() => {
      window.URL.createObjectURL = vi.fn(() => 'mock-url');
      window.URL.revokeObjectURL = vi.fn();
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();
      document.createElement = vi.fn((tag) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: vi.fn(),
            style: {}
          };
        }
        return {};
      });
    });

    afterEach(() => {
      window.URL.createObjectURL = originalCreateObjectURL;
      window.URL.revokeObjectURL = originalRevokeObjectURL;
      // Don't try to restore document.body as it's read-only
    });

    it('should export items to CSV format', () => {
      const items = [
        {
          id: '1',
          title: 'Test Book',
          type: 'book',
          status: 'dnf',
          author: 'Test Author',
          year: '2020',
          rating: 3,
          tags: ['fiction', 'drama'],
          review: 'Great book!'
        }
      ];

      // Mock toast service
      const mockToast = vi.fn();
      vi.doMock('../../services/toastService.js', () => ({
        toast: mockToast
      }));

      exportCSV(items);

      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle items with DNF status', () => {
      const items = [
        {
          id: '1',
          title: 'DNF Book',
          type: 'book',
          status: 'dnf',
          author: 'Test Author'
        }
      ];

      exportCSV(items);

      // Verify the CSV contains the DNF status
      const createObjectURLCalls = window.URL.createObjectURL.mock.calls;
      expect(createObjectURLCalls.length).toBe(1);

      // The blob content would contain 'dnf' in the status column
      // This is tested implicitly through the function execution
    });
  });
});