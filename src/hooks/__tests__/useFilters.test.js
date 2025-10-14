import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilters } from '../useFilters';
import { sampleBook, sampleMovie, sampleBookUnrated, sampleMovieWatchlist } from '../../test/fixtures/sampleItems.js';
import { FILTER_TYPES, SORT_OPTIONS, SORT_ORDERS, RECENT_FILTER_OPTIONS } from '../../constants/index.js';

describe('useFilters', () => {
  const sampleItems = [sampleBook, sampleMovie, sampleBookUnrated, sampleMovieWatchlist];

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      expect(result.current.searchTerm).toBe('');
      expect(result.current.filterType).toBe(FILTER_TYPES.ALL);
      expect(result.current.sortBy).toBe(SORT_OPTIONS.DATE_CONSUMED);
      expect(result.current.sortOrder).toBe(SORT_ORDERS.DESC);
      expect(result.current.filterRating).toBe(0);
      expect(result.current.filterTags).toEqual([]);
      expect(result.current.filterStatuses).toEqual([]);
      expect(result.current.filterRecent).toBe(RECENT_FILTER_OPTIONS.ANY);
      expect(result.current.showFilters).toBe(false);
    });

    it('should compute filtered and sorted items on init', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      expect(result.current.filteredAndSortedItems).toHaveLength(4);
    });

    it('should compute all tags from items', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      expect(result.current.allTags).toContain('classic');
      expect(result.current.allTags).toContain('sci-fi');
      expect(result.current.allTags).toContain('action');
    });

    it('should compute all statuses from items', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      expect(result.current.allStatuses).toContain('read');
      expect(result.current.allStatuses).toContain('watched');
      expect(result.current.allStatuses).toContain('reading');
      expect(result.current.allStatuses).toContain('to-watch');
    });
  });

  describe('search filter', () => {
    it('should filter items by search term', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setSearchTerm('gatsby');
      });

      expect(result.current.filteredAndSortedItems).toHaveLength(1);
      expect(result.current.filteredAndSortedItems[0].title).toBe('The Great Gatsby');
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setSearchTerm('MATRIX');
      });

      expect(result.current.filteredAndSortedItems).toHaveLength(1);
      expect(result.current.filteredAndSortedItems[0].title).toBe('The Matrix');
    });
  });

  describe('type filter', () => {
    it('should filter by book type', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setFilterType(FILTER_TYPES.BOOK);
      });

      expect(result.current.filteredAndSortedItems).toHaveLength(2);
      expect(result.current.filteredAndSortedItems.every(item => item.type === 'book')).toBe(true);
    });

    it('should filter by movie type', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setFilterType(FILTER_TYPES.MOVIE);
      });

      expect(result.current.filteredAndSortedItems).toHaveLength(2);
      expect(result.current.filteredAndSortedItems.every(item => item.type === 'movie')).toBe(true);
    });

    it('should cycle through filter types', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.cycleFilterType();
      });
      expect(result.current.filterType).toBe(FILTER_TYPES.BOOK);

      act(() => {
        result.current.cycleFilterType();
      });
      expect(result.current.filterType).toBe(FILTER_TYPES.MOVIE);

      act(() => {
        result.current.cycleFilterType();
      });
      expect(result.current.filterType).toBe(FILTER_TYPES.ALL);
    });
  });

  describe('rating filter', () => {
    it('should filter by minimum rating', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setFilterRating(5);
      });

      expect(result.current.filteredAndSortedItems).toHaveLength(2);
      expect(result.current.filteredAndSortedItems.every(item => item.rating === 5)).toBe(true);
    });

    it('should exclude unrated items', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setFilterRating(1);
      });

      expect(result.current.filteredAndSortedItems).toHaveLength(2);
      expect(result.current.filteredAndSortedItems.every(item => item.rating > 0)).toBe(true);
    });
  });

  describe('tag filter', () => {
    it('should filter by single tag', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.toggleTagFilter('classic');
      });

      expect(result.current.filterTags).toContain('classic');
      expect(result.current.filteredAndSortedItems).toHaveLength(2);
    });

    it('should filter by multiple tags (AND logic)', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.toggleTagFilter('sci-fi');
        result.current.toggleTagFilter('action');
      });

      // Only The Matrix has both sci-fi and action tags
      expect(result.current.filteredAndSortedItems).toHaveLength(1);
      expect(result.current.filteredAndSortedItems[0].title).toBe('The Matrix');
    });

    it('should toggle tag off', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.toggleTagFilter('classic');
      });
      expect(result.current.filterTags).toContain('classic');

      act(() => {
        result.current.toggleTagFilter('classic');
      });
      expect(result.current.filterTags).not.toContain('classic');
    });
  });

  describe('status filter', () => {
    it('should filter by status', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.toggleStatusFilter('read');
      });

      expect(result.current.filteredAndSortedItems).toHaveLength(1);
      expect(result.current.filteredAndSortedItems[0].status).toBe('read');
    });

    it('should toggle status off', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.toggleStatusFilter('read');
      });
      expect(result.current.filterStatuses).toContain('read');

      act(() => {
        result.current.toggleStatusFilter('read');
      });
      expect(result.current.filterStatuses).not.toContain('read');
    });
  });

  describe('sorting', () => {
    it('should sort by date consumed descending by default', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      const items = result.current.filteredAndSortedItems;
      // Matrix (2024-02-20) is most recent, Gatsby (2024-01-15) is second
      // The other two have no date_watched/date_read so they come last
      expect(items[0].title).toBe('The Matrix'); // Most recent with date
      expect(items[1].title).toBe('The Great Gatsby'); // Second most recent
    });

    it('should toggle sort order', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.toggleSortOrder();
      });

      expect(result.current.sortOrder).toBe(SORT_ORDERS.ASC);
      const items = result.current.filteredAndSortedItems;
      // ASC means oldest first. Items without dates (converted to Date(0) = 1970) come first
      // Then items with actual dates in ascending order
      expect(items[items.length - 1].title).toBe('The Matrix'); // Most recent last in ASC

      act(() => {
        result.current.toggleSortOrder();
      });
      expect(result.current.sortOrder).toBe(SORT_ORDERS.DESC);
    });

    it('should sort by title', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setSortBy(SORT_OPTIONS.TITLE);
        result.current.setSortOrder(SORT_ORDERS.ASC);
      });

      const items = result.current.filteredAndSortedItems;
      expect(items[0].title).toBe('Inception');
      expect(items[items.length - 1].title).toBe('To Kill a Mockingbird');
    });

    it('should sort by rating', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setSortBy(SORT_OPTIONS.RATING);
        result.current.setSortOrder(SORT_ORDERS.DESC);
      });

      const items = result.current.filteredAndSortedItems;
      expect(items[0].rating).toBe(5);
      expect(items[items.length - 1].rating).toBe(0);
    });
  });

  describe('clear filters', () => {
    it('should clear all filters', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setSearchTerm('test');
        result.current.setFilterType(FILTER_TYPES.BOOK);
        result.current.setFilterRating(3);
        result.current.toggleTagFilter('classic');
        result.current.toggleStatusFilter('read');
        result.current.setFilterRecent(RECENT_FILTER_OPTIONS.LAST_30);
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.searchTerm).toBe('');
      expect(result.current.filterType).toBe(FILTER_TYPES.ALL);
      expect(result.current.filterRating).toBe(0);
      expect(result.current.filterTags).toEqual([]);
      expect(result.current.filterStatuses).toEqual([]);
      expect(result.current.filterRecent).toBe(RECENT_FILTER_OPTIONS.ANY);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters are active', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('should return true when search term is set', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setSearchTerm('test');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should return true when type filter is set', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setFilterType(FILTER_TYPES.BOOK);
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should return true when rating filter is set', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.setFilterRating(3);
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should return true when tags are filtered', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.toggleTagFilter('classic');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should return true when statuses are filtered', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      act(() => {
        result.current.toggleStatusFilter('read');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe('show filters toggle', () => {
    it('should toggle show filters state', () => {
      const { result } = renderHook(() => useFilters(sampleItems));

      expect(result.current.showFilters).toBe(false);

      act(() => {
        result.current.setShowFilters(true);
      });

      expect(result.current.showFilters).toBe(true);
    });
  });
});
