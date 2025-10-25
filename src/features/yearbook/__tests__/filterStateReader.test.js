import { describe, it, expect, vi } from 'vitest';
import { getCurrentFilteredItems } from '../filterStateReader.js';

// Mock the useFilters hook
vi.mock('../../hooks/useFilters.js', () => ({
    useFilters: vi.fn()
}));

describe('Filter State Reader', () => {
    it('reads active filters from filter store/state', () => {
        // Given: mock filter hook returns filtered items
        const mockFilteredItems = [
            { id: '1', title: 'Book 1', type: 'book', rating: 5 },
            { id: '2', title: 'Movie 1', type: 'movie', rating: 4 }
        ];

        const mockUseFilters = {
            filteredAndSortedItems: mockFilteredItems,
            hasActiveFilters: true,
            filterType: 'all',
            sortBy: 'dateConsumed',
            sortOrder: 'desc'
        };

        // When: filter state reader accesses filter state
        const result = getCurrentFilteredItems(mockUseFilters);

        // Then: correct filter values retrieved
        expect(result.items).toEqual(mockFilteredItems);
        expect(result.hasFilters).toBe(true);
        expect(result.filterType).toBe('all');
        expect(result.sortBy).toBe('dateConsumed');
        expect(result.sortOrder).toBe('desc');
    });

    it('generates yearbook with filtered items', () => {
        // Given: user has filtered to "last year + 5 stars"
        const mockFilteredItems = [
            { id: '1', title: 'Great Book', type: 'book', rating: 5, dateRead: '2024-06-15' },
            { id: '2', title: 'Great Movie', type: 'movie', rating: 5, dateWatched: '2024-07-20' }
        ];

        const mockUseFilters = {
            filteredAndSortedItems: mockFilteredItems,
            hasActiveFilters: true
        };

        // When: get current filtered items
        const result = getCurrentFilteredItems(mockUseFilters);

        // Then: returns exactly those 2 items
        expect(result.items).toHaveLength(2);
        expect(result.items[0].title).toBe('Great Book');
        expect(result.items[1].title).toBe('Great Movie');
    });

    it('maintains current sort order in yearbook', () => {
        // Given: user has sorted by "rating descending"
        const mockFilteredItems = [
            { id: '1', title: '5 Star Book', rating: 5 },
            { id: '2', title: '4 Star Book', rating: 4 },
            { id: '3', title: '3 Star Book', rating: 3 }
        ];

        const mockUseFilters = {
            filteredAndSortedItems: mockFilteredItems,
            hasActiveFilters: true,
            sortBy: 'rating',
            sortOrder: 'desc'
        };

        // When: get current filtered items
        const result = getCurrentFilteredItems(mockUseFilters);

        // Then: items appear in same order (rating desc)
        expect(result.items[0].rating).toBe(5);
        expect(result.items[1].rating).toBe(4);
        expect(result.items[2].rating).toBe(3);
        expect(result.sortBy).toBe('rating');
        expect(result.sortOrder).toBe('desc');
    });

    it('uses all items when no filters active', () => {
        // Given: no filters applied (showing all items)
        const mockAllItems = [
            { id: '1', title: 'Book 1', type: 'book' },
            { id: '2', title: 'Book 2', type: 'book' },
            { id: '3', title: 'Movie 1', type: 'movie' }
        ];

        const mockUseFilters = {
            filteredAndSortedItems: mockAllItems,
            hasActiveFilters: false
        };

        // When: get current filtered items
        const result = getCurrentFilteredItems(mockUseFilters);

        // Then: returns entire collection
        expect(result.items).toEqual(mockAllItems);
        expect(result.hasFilters).toBe(false);
    });

    it('handles when filters result in zero items', () => {
        // Given: filters applied that match nothing
        const mockUseFilters = {
            filteredAndSortedItems: [],
            hasActiveFilters: true,
            filterRating: 5,
            filterType: 'book'
        };

        // When: attempt to get filtered items
        const result = getCurrentFilteredItems(mockUseFilters);

        // Then: returns empty array with filter info
        expect(result.items).toEqual([]);
        expect(result.hasFilters).toBe(true);
        expect(result.filterRating).toBe(5);
        expect(result.filterType).toBe('book');
    });
});
