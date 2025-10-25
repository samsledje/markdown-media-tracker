/**
 * Utility to read current filtered items from the filter state
 * @param {object} filterState - The result from useFilters hook
 * @returns {object} Object with items and filter metadata
 */
export const getCurrentFilteredItems = (filterState) => {
    const {
        filteredAndSortedItems,
        hasActiveFilters,
        filterType,
        sortBy,
        sortOrder,
        filterRating,
        filterStartDate,
        filterEndDate,
        searchTerm
    } = filterState;

    return {
        items: filteredAndSortedItems || [],
        hasFilters: hasActiveFilters || false,
        filterType,
        sortBy,
        sortOrder,
        filterRating,
        filterStartDate,
        filterEndDate,
        searchTerm
    };
};
