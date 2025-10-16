import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MediaTracker from '../MediaTracker';
import React from 'react';

// Mock all the custom hooks
vi.mock('../hooks/useItems', () => ({
  useItems: vi.fn()
}));

vi.mock('../hooks/useFilters', () => ({
  useFilters: vi.fn()
}));

vi.mock('../hooks/useSelection', () => ({
  useSelection: vi.fn()
}));

vi.mock('../hooks/useTheme', () => ({
  useTheme: vi.fn()
}));

vi.mock('../hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: vi.fn()
}));

vi.mock('../hooks/useOmdbApi', () => ({
  useOmdbApi: vi.fn()
}));

// Mock toast service
vi.mock('../services/toastService', () => ({
  toast: vi.fn()
}));

// Mock config
vi.mock('../config', () => ({
  hasApiKey: vi.fn(() => true)
}));

// Mock utils
vi.mock('../utils/csvUtils', () => ({
  exportCSV: vi.fn()
}));

vi.mock('../utils/importUtils', () => ({
  processImportFile: vi.fn()
}));

// Mock constants
vi.mock('../constants/index.js', () => ({
  STATUS_LABELS: {
    'reading': 'Reading',
    'read': 'Read',
    'watching': 'Watching',
    'watched': 'Watched',
    'want-to-read': 'Want to Read',
    'want-to-watch': 'Want to Watch',
    'dnf': 'Did Not Finish'
  },
  STATUS_ICONS: {
    'reading': 'book-open',
    'read': 'check-circle',
    'watching': 'play-circle',
    'watched': 'check-circle',
    'want-to-read': 'bookmark',
    'want-to-watch': 'bookmark',
    'dnf': 'x-circle'
  },
  STATUS_COLORS: {
    'reading': 'blue',
    'read': 'green',
    'watching': 'blue',
    'watched': 'green',
    'want-to-read': 'yellow',
    'want-to-watch': 'yellow',
    'dnf': 'red'
  }
}));

// Import mocked hooks
import { useItems } from '../hooks/useItems';
import { useFilters } from '../hooks/useFilters';
import { useSelection } from '../hooks/useSelection';
import { useTheme } from '../hooks/useTheme';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useOmdbApi } from '../hooks/useOmdbApi';

// These tests focus on improving function coverage for MediaTracker.jsx
// The component is heavily tested through integration tests in itemManagement.test.jsx
// Here we focus on isolated function behavior and edge cases

describe('MediaTracker', () => {
  // Default mock implementations
  const mockUseItems = {
    items: [],
    storageAdapter: {
      isConnected: () => true,
      getStorageType: () => 'filesystem'
    },
    storageInfo: 'Local Storage',
    isLoading: false,
    loadProgress: { current: 0, total: 0 },
    undoStack: [],
    initializeStorage: vi.fn(),
    loadItems: vi.fn(),
    saveItem: vi.fn(),
    deleteItem: vi.fn(),
    deleteItems: vi.fn(),
    undoLastDelete: vi.fn(),
    selectStorage: vi.fn(),
    disconnectStorage: vi.fn(),
    getAvailableStorageOptions: vi.fn(() => ['filesystem', 'googledrive']),
    applyBatchEdit: vi.fn()
  };

  const mockUseFilters = {
    searchTerm: '',
    filterType: 'all',
    sortBy: 'dateAdded',
    sortOrder: 'desc',
    filterRating: 0,
    filterTags: [],
    filterStatuses: [],
    filterRecent: 'any',
    showFilters: false,
    allTags: ['fiction', 'classic'],
    allStatuses: ['read', 'reading'],
    hasActiveFilters: false,
    filteredAndSortedItems: [],
    setSearchTerm: vi.fn(),
    setFilterType: vi.fn(),
    setSortBy: vi.fn(),
    setSortOrder: vi.fn(),
    setFilterRating: vi.fn(),
    setFilterTags: vi.fn(),
    setFilterStatuses: vi.fn(),
    setFilterRecent: vi.fn(),
    setShowFilters: vi.fn(),
    toggleTagFilter: vi.fn(),
    toggleStatusFilter: vi.fn(),
    clearFilters: vi.fn(),
    cycleFilterType: vi.fn(),
    toggleSortOrder: vi.fn()
  };

  const mockUseSelection = {
    selectionMode: false,
    selectedIds: new Set(),
    selectedCount: 0,
    toggleSelectionMode: vi.fn(),
    toggleItemSelection: vi.fn(),
    selectAll: vi.fn(),
    clearSelection: vi.fn(),
    isItemSelected: vi.fn(),
    getSelectedItems: vi.fn(() => [])
  };

  const mockUseTheme = {
    primaryColor: '#6366f1',
    highlightColor: '#3b82f6',
    cardSize: 'medium',
    updatePrimaryColor: vi.fn(),
    updateHighlightColor: vi.fn(),
    updateCardSize: vi.fn()
  };

  const mockUseKeyboardNavigation = {
    focusedIndex: -1,
    focusedId: null,
    registerCardRef: vi.fn(),
    isItemFocused: vi.fn(),
    resetFocus: vi.fn()
  };

  const mockUseOmdbApi = {
    omdbApiKey: 'test-key',
    updateApiKey: vi.fn()
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock returns
    useItems.mockReturnValue(mockUseItems);
    useFilters.mockReturnValue(mockUseFilters);
    useSelection.mockReturnValue(mockUseSelection);
    useTheme.mockReturnValue(mockUseTheme);
    useKeyboardNavigation.mockReturnValue(mockUseKeyboardNavigation);
    useOmdbApi.mockReturnValue(mockUseOmdbApi);
  });

  describe('Basic Rendering', () => {
    it('should render without crashing when storage not connected', () => {
      useItems.mockReturnValue({
        ...mockUseItems,
        storageAdapter: null
      });

      const { container } = render(<MediaTracker />);
      expect(container).toBeDefined();
    });

    it('should render without crashing when storage is connected', () => {
      const { container } = render(<MediaTracker />);
      expect(container).toBeDefined();
    });
  });

  describe('Component Interactions', () => {
    it('should handle rendering with items', () => {
      const items = [
        { id: '1', title: 'Book 1', type: 'book' },
        { id: '2', title: 'Movie 1', type: 'movie' }
      ];
      
      useFilters.mockReturnValue({
        ...mockUseFilters,
        filteredAndSortedItems: items
      });

      const { container } = render(<MediaTracker />);
      expect(container).toBeDefined();
    });

    it('should handle empty item state', () => {
      useFilters.mockReturnValue({
        ...mockUseFilters,
        filteredAndSortedItems: []
      });

      const { container } = render(<MediaTracker />);
      expect(container).toBeDefined();
    });

    it('should handle selection mode', () => {
      useSelection.mockReturnValue({
        ...mockUseSelection,
        selectionMode: true,
        selectedCount: 3
      });

      const { container } = render(<MediaTracker />);
      expect(container).toBeDefined();
    });
  });

  describe('Different States', () => {
    it('should render with various theme sizes', () => {
      const cardSizes = ['tiny', 'small', 'medium', 'large', 'xlarge'];
      
      cardSizes.forEach(size => {
        useTheme.mockReturnValue({
          ...mockUseTheme,
          cardSize: size
        });

        const { container } = render(<MediaTracker />);
        expect(container).toBeDefined();
      });
    });

    it('should render with filters showing', () => {
      useFilters.mockReturnValue({
        ...mockUseFilters,
        showFilters: true
      });

      const { container } = render(<MediaTracker />);
      expect(container).toBeDefined();
    });

    it('should render with active filters', () => {
      useFilters.mockReturnValue({
        ...mockUseFilters,
        hasActiveFilters: true,
        filterRating: 4,
        filterTags: ['fiction'],
        filterStatuses: ['read']
      });

      const { container } = render(<MediaTracker />);
      expect(container).toBeDefined();
    });

    it('should render with loading state', () => {
      useItems.mockReturnValue({
        ...mockUseItems,
        isLoading: true,
        loadProgress: { current: 50, total: 100 }
      });

      const { container } = render(<MediaTracker />);
      expect(container).toBeDefined();
    });

    it('should render with Google Drive storage', () => {
      useItems.mockReturnValue({
        ...mockUseItems,
        storageAdapter: {
          isConnected: () => true,
          getStorageType: () => 'googledrive'
        },
        storageInfo: 'Google Drive'
      });

      const { container } = render(<MediaTracker />);
      expect(container).toBeDefined();
    });
  });

  describe('Footer', () => {
    it('should render footer with links', () => {
      render(<MediaTracker />);
      
      // Find GitHub link
      const githubLink = screen.getByTitle('View on GitHub');
      expect(githubLink).toBeInTheDocument();
      expect(githubLink).toHaveAttribute('href', 'https://github.com/samsledje/markdown-media-tracker');
      
      // Find Privacy Policy link
      const privacyLink = screen.getByTitle('Privacy Policy');
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', './privacy-policy.html');
      
      // Find samsl.io link
      const websiteLink = screen.getByTitle('Visit samsl.io');
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink).toHaveAttribute('href', 'https://samsl.io');
    });
  });
});
