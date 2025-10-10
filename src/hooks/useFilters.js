import { useState, useMemo, useCallback } from 'react';
import { filterItems, sortItems, getAllTags, getAllStatuses } from '../utils/filterUtils.js';
import { FILTER_TYPES, SORT_OPTIONS, SORT_ORDERS, RECENT_FILTER_OPTIONS } from '../constants/index.js';

/**
 * Custom hook for managing filters and sorting
 * @param {object[]} items - Array of items to filter and sort
 * @returns {object} Filter state and actions
 */
export const useFilters = (items) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(FILTER_TYPES.ALL);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.DATE_CONSUMED);
  const [sortOrder, setSortOrder] = useState(SORT_ORDERS.DESC);
  const [filterRating, setFilterRating] = useState(0);
  const [filterTags, setFilterTags] = useState([]);
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterRecent, setFilterRecent] = useState(RECENT_FILTER_OPTIONS.ANY);
  const [showFilters, setShowFilters] = useState(false);

  // Get all available tags and statuses
  const allTags = useMemo(() => getAllTags(items), [items]);
  const allStatuses = useMemo(() => getAllStatuses(items), [items]);

  // Apply filters and sorting
  const filteredAndSortedItems = useMemo(() => {
    const filters = {
      searchTerm,
      filterType,
      filterRating,
      filterTags,
      filterStatuses,
      filterRecent
    };

    const filtered = filterItems(items, filters);
    return sortItems(filtered, sortBy, sortOrder);
  }, [items, searchTerm, filterType, filterRating, filterTags, filterStatuses, filterRecent, sortBy, sortOrder]);

  /**
   * Toggle a tag in the filter list
   */
  const toggleTagFilter = useCallback((tag) => {
    setFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  /**
   * Toggle a status in the filter list
   */
  const toggleStatusFilter = useCallback((status) => {
    setFilterStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterType(FILTER_TYPES.ALL);
    setFilterRating(0);
    setFilterTags([]);
    setFilterStatuses([]);
    setFilterRecent(RECENT_FILTER_OPTIONS.ANY);
  }, []);

  /**
   * Cycle through filter types
   */
  const cycleFilterType = useCallback(() => {
    const types = [FILTER_TYPES.ALL, FILTER_TYPES.BOOK, FILTER_TYPES.MOVIE];
    const currentIndex = types.indexOf(filterType);
    const nextIndex = (currentIndex + 1) % types.length;
    setFilterType(types[nextIndex]);
  }, [filterType]);

  /**
   * Toggle sort order
   */
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === SORT_ORDERS.ASC ? SORT_ORDERS.DESC : SORT_ORDERS.ASC);
  }, []);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' ||
           filterType !== FILTER_TYPES.ALL ||
           filterRating !== 0 ||
           filterTags.length > 0 ||
           filterStatuses.length > 0 ||
           filterRecent !== RECENT_FILTER_OPTIONS.ANY;
  }, [searchTerm, filterType, filterRating, filterTags, filterStatuses, filterRecent]);

  return {
    // Filter state
    searchTerm,
    filterType,
    sortBy,
    sortOrder,
    filterRating,
    filterTags,
    filterStatuses,
    filterRecent,
    showFilters,
    allTags,
    allStatuses,
    hasActiveFilters,

    // Filtered results
    filteredAndSortedItems,

    // Filter actions
    setSearchTerm,
    setFilterType,
    setSortBy,
    setSortOrder,
    setFilterRating,
    setFilterTags,
    setFilterStatuses,
    setFilterRecent,
    setShowFilters,
    toggleTagFilter,
    toggleStatusFilter,
    clearFilters,
    cycleFilterType,
    toggleSortOrder
  };
};