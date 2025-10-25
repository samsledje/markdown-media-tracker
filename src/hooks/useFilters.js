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
  const [filterMaxRating, setFilterMaxRating] = useState(0);
  const [filterHasReview, setFilterHasReview] = useState({ withReview: true, withoutReview: true });
  const [filterHasCover, setFilterHasCover] = useState({ withCover: true, withoutCover: true });
  const [filterTags, setFilterTags] = useState([]);
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterRecent, setFilterRecent] = useState(RECENT_FILTER_OPTIONS.ANY);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
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
      filterMaxRating,
      filterHasReview,
      filterHasCover,
      filterTags,
      filterStatuses,
      filterRecent,
      filterStartDate,
      filterEndDate
    };

    const filtered = filterItems(items, filters);
    return sortItems(filtered, sortBy, sortOrder);
  }, [items, searchTerm, filterType, filterRating, filterMaxRating, filterHasReview, filterHasCover, filterTags, filterStatuses, filterRecent, filterStartDate, filterEndDate, sortBy, sortOrder]);

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
    setFilterMaxRating(0);
    setFilterHasReview({ withReview: true, withoutReview: true });
    setFilterHasCover({ withCover: true, withoutCover: true });
    setFilterTags([]);
    setFilterStatuses([]);
    setFilterRecent(RECENT_FILTER_OPTIONS.ANY);
    setFilterStartDate('');
    setFilterEndDate('');
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
    const isReviewFilterActive = !(filterHasReview.withReview && filterHasReview.withoutReview);
    const isCoverFilterActive = !(filterHasCover.withCover && filterHasCover.withoutCover);

    return searchTerm !== '' ||
      filterType !== FILTER_TYPES.ALL ||
      filterRating !== 0 ||
      filterMaxRating !== 0 ||
      isReviewFilterActive ||
      isCoverFilterActive ||
      filterTags.length > 0 ||
      filterStatuses.length > 0 ||
      filterRecent !== RECENT_FILTER_OPTIONS.ANY ||
      filterStartDate !== '' ||
      filterEndDate !== '';
  }, [searchTerm, filterType, filterRating, filterMaxRating, filterHasReview, filterHasCover, filterTags, filterStatuses, filterRecent, filterStartDate, filterEndDate]);

  return {
    // Filter state
    searchTerm,
    filterType,
    sortBy,
    sortOrder,
    filterRating,
    filterMaxRating,
    filterHasReview,
    filterHasCover,
    filterTags,
    filterStatuses,
    filterRecent,
    filterStartDate,
    filterEndDate,
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
    setFilterMaxRating,
    setFilterHasReview,
    setFilterHasCover,
    setFilterTags,
    setFilterStatuses,
    setFilterRecent,
    setFilterStartDate,
    setFilterEndDate,
    setShowFilters,
    toggleTagFilter,
    toggleStatusFilter,
    clearFilters,
    cycleFilterType,
    toggleSortOrder
  };
};
