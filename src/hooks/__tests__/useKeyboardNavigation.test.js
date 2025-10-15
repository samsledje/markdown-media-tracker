import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation.js';
import { sampleBook, sampleMovie, sampleBookUnrated, sampleMovieWatchlist } from '../../test/fixtures/sampleItems.js';
import { KEYBOARD_SHORTCUTS } from '../../constants/index.js';

// Mock commonUtils
vi.mock('../../utils/commonUtils.js', () => ({
  isTyping: vi.fn(() => false)
}));

import { isTyping } from '../../utils/commonUtils.js';

describe('useKeyboardNavigation', () => {
  const sampleItems = [sampleBook, sampleMovie, sampleBookUnrated, sampleMovieWatchlist];
  let mockStorageAdapter;
  let defaultConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStorageAdapter = {
      isConnected: vi.fn(() => true)
    };

    defaultConfig = {
      items: sampleItems,
      cardSize: 'medium',
      storageAdapter: mockStorageAdapter,
      onOpenHelp: vi.fn(),
      onFocusSearch: vi.fn(),
      onAddItem: vi.fn(),
      onSearchOnline: vi.fn(),
      onToggleFilters: vi.fn(),
      onToggleCustomize: vi.fn(),
      onSwitchStorage: vi.fn(),
      onFilterAll: vi.fn(),
      onFilterBooks: vi.fn(),
      onFilterMovies: vi.fn(),
      onToggleSelectionMode: vi.fn(),
      onSelectAll: vi.fn(),
      onDeleteSelected: vi.fn(),
      onToggleItemSelection: vi.fn(),
      onOpenItem: vi.fn(),
      onCloseModals: vi.fn(),
      onCloseBatchDeleteModal: vi.fn(),
      onConfirmBatchDelete: vi.fn(),
      selectionMode: false,
      selectedCount: 0,
      hasOpenModal: false,
      showHelp: false,
      customizeOpen: false,
      showBatchDeleteConfirm: false
    };
  });

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('keydown', () => {});
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      expect(result.current.focusedIndex).toBe(-1);
      expect(result.current.focusedId).toBeNull();
    });

    it('should provide card ref registration', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      expect(typeof result.current.registerCardRef).toBe('function');
    });

    it('should provide focus checking function', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      expect(typeof result.current.isItemFocused).toBe('function');
      expect(result.current.isItemFocused('test-id')).toBe(false);
    });

    it('should provide reset focus function', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      expect(typeof result.current.resetFocus).toBe('function');
    });
  });

  describe('escape key', () => {
    it('should close batch delete modal specifically when open', () => {
      const config = { ...defaultConfig, showBatchDeleteConfirm: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ESCAPE }));
      });
      
      expect(config.onCloseBatchDeleteModal).toHaveBeenCalled();
      expect(config.onCloseModals).not.toHaveBeenCalled();
    });

    it('should close all modals when batch delete modal not open', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ESCAPE }));
      });
      
      expect(defaultConfig.onCloseModals).toHaveBeenCalled();
      expect(defaultConfig.onCloseBatchDeleteModal).not.toHaveBeenCalled();
    });
  });

  describe('enter key in batch delete modal', () => {
    it('should confirm batch delete when modal is open', () => {
      const config = { ...defaultConfig, showBatchDeleteConfirm: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ENTER }));
      });
      
      expect(config.onConfirmBatchDelete).toHaveBeenCalled();
    });

    it('should not confirm batch delete when modal not open', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ENTER }));
      });
      
      expect(defaultConfig.onConfirmBatchDelete).not.toHaveBeenCalled();
    });
  });

  describe('typing detection', () => {
    it('should not trigger shortcuts when typing', () => {
      isTyping.mockReturnValueOnce(true);
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
      });
      
      expect(defaultConfig.onAddItem).not.toHaveBeenCalled();
    });
  });

  describe('help shortcut', () => {
    it('should open help with ? key', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.HELP }));
      });
      
      expect(defaultConfig.onOpenHelp).toHaveBeenCalled();
    });

    it('should work even when modal is open', () => {
      const config = { ...defaultConfig, hasOpenModal: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.HELP }));
      });
      
      expect(config.onOpenHelp).toHaveBeenCalled();
    });
  });

  describe('customize shortcut', () => {
    it('should toggle customize with C key', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      });
      
      expect(defaultConfig.onToggleCustomize).toHaveBeenCalled();
    });

    it('should work with uppercase C', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'C' }));
      });
      
      expect(defaultConfig.onToggleCustomize).toHaveBeenCalled();
    });

    it('should work even when modal is open', () => {
      const config = { ...defaultConfig, hasOpenModal: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      });
      
      expect(config.onToggleCustomize).toHaveBeenCalled();
    });
  });

  describe('switch storage shortcut', () => {
    it('should switch storage with T key', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
      });
      
      expect(defaultConfig.onSwitchStorage).toHaveBeenCalled();
    });

    it('should work even when modal is open', () => {
      const config = { ...defaultConfig, hasOpenModal: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
      });
      
      expect(config.onSwitchStorage).toHaveBeenCalled();
    });
  });

  describe('search shortcuts', () => {
    it('should focus search with / key', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.SEARCH }));
      });
      
      expect(defaultConfig.onFocusSearch).toHaveBeenCalled();
    });

    it('should focus search with Ctrl+K', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
      });
      
      expect(defaultConfig.onFocusSearch).toHaveBeenCalled();
    });

    it('should focus search with Cmd+K', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      });
      
      expect(defaultConfig.onFocusSearch).toHaveBeenCalled();
    });

    it('should not work when modal is open', () => {
      const config = { ...defaultConfig, hasOpenModal: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.SEARCH }));
      });
      
      expect(config.onFocusSearch).not.toHaveBeenCalled();
    });
  });

  describe('filter shortcuts', () => {
    it('should filter all with A key when storage connected', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      });
      
      expect(defaultConfig.onFilterAll).toHaveBeenCalled();
    });

    it('should not filter all when in selection mode', () => {
      const config = { ...defaultConfig, selectionMode: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      });
      
      expect(config.onFilterAll).not.toHaveBeenCalled();
    });

    it('should filter books with B key', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      });
      
      expect(defaultConfig.onFilterBooks).toHaveBeenCalled();
    });

    it('should filter movies with M key', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
      });
      
      expect(defaultConfig.onFilterMovies).toHaveBeenCalled();
    });

    it('should not work when storage not connected', () => {
      mockStorageAdapter.isConnected = vi.fn(() => false);
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      });
      
      expect(defaultConfig.onFilterBooks).not.toHaveBeenCalled();
    });

    it('should not work when no storage adapter', () => {
      const config = { ...defaultConfig, storageAdapter: null };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      });
      
      expect(config.onFilterBooks).not.toHaveBeenCalled();
    });
  });

  describe('add item shortcut', () => {
    it('should add item with N key when storage connected', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
      });
      
      expect(defaultConfig.onAddItem).toHaveBeenCalled();
    });

    it('should not work when storage not connected', () => {
      mockStorageAdapter.isConnected = vi.fn(() => false);
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
      });
      
      expect(defaultConfig.onAddItem).not.toHaveBeenCalled();
    });
  });

  describe('online search shortcut', () => {
    it('should search online with S key when storage connected', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
      });
      
      expect(defaultConfig.onSearchOnline).toHaveBeenCalled();
    });

    it('should not work when storage not connected', () => {
      mockStorageAdapter.isConnected = vi.fn(() => false);
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
      });
      
      expect(defaultConfig.onSearchOnline).not.toHaveBeenCalled();
    });
  });

  describe('toggle filters shortcut', () => {
    it('should toggle filters with F key', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
      });
      
      expect(defaultConfig.onToggleFilters).toHaveBeenCalled();
    });
  });

  describe('selection mode', () => {
    it('should toggle selection mode with V key', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
      });
      
      expect(defaultConfig.onToggleSelectionMode).toHaveBeenCalled();
    });

    it('should select all with Ctrl+A in selection mode', () => {
      const config = { ...defaultConfig, selectionMode: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }));
      });
      
      expect(config.onSelectAll).toHaveBeenCalled();
    });

    it('should select all with Cmd+A in selection mode', () => {
      const config = { ...defaultConfig, selectionMode: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true }));
      });
      
      expect(config.onSelectAll).toHaveBeenCalled();
    });

    it('should not select all when not in selection mode', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }));
      });
      
      expect(defaultConfig.onSelectAll).not.toHaveBeenCalled();
    });

    it('should delete selected with Delete key', () => {
      const config = { ...defaultConfig, selectionMode: true, selectedCount: 2 };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.DELETE }));
      });
      
      expect(config.onDeleteSelected).toHaveBeenCalled();
    });

    it('should delete selected with Backspace key', () => {
      const config = { ...defaultConfig, selectionMode: true, selectedCount: 2 };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.BACKSPACE }));
      });
      
      expect(config.onDeleteSelected).toHaveBeenCalled();
    });

    it('should not delete when selectedCount is 0', () => {
      const config = { ...defaultConfig, selectionMode: true, selectedCount: 0 };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.DELETE }));
      });
      
      expect(config.onDeleteSelected).not.toHaveBeenCalled();
    });
  });

  describe('arrow key navigation', () => {
    it('should navigate right with ArrowRight', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      // First navigation from -1 goes to index 0, then +1 = index 1
      expect(result.current.focusedIndex).toBe(1);
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      expect(result.current.focusedIndex).toBe(2);
    });

    it('should navigate left with ArrowLeft', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      // Navigate right once (goes to index 1)
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      expect(result.current.focusedIndex).toBe(1);
      
      // Then navigate left
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_LEFT }));
      });
      
      expect(result.current.focusedIndex).toBe(0);
    });

    it('should not go below index 0 with ArrowLeft', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_LEFT }));
      });
      
      expect(result.current.focusedIndex).toBe(0);
    });

    it('should not exceed items length with ArrowRight', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      // Navigate right to the last item (sampleItems has 4 items, so indices 0-3)
      // From -1: first right goes to 1, then 2, then 3 (last item)
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      expect(result.current.focusedIndex).toBe(sampleItems.length - 1);
      
      // Try to go further - should stay at last item
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      expect(result.current.focusedIndex).toBe(sampleItems.length - 1);
    });
  });

  describe('vim-style navigation', () => {
    it('should navigate right with L key', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
      });
      
      expect(result.current.focusedIndex).toBe(1); // -1 -> 0 -> 1
    });

    it('should navigate left with H key', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
      });
      
      expect(result.current.focusedIndex).toBe(0); // -1 -> 1 -> 0
    });

    it('should work with uppercase letters', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'L' }));
      });
      
      expect(result.current.focusedIndex).toBe(1); // -1 -> 0 -> 1
    });
  });

  describe('enter and space keys', () => {
    it('should open item with Enter key in normal mode', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      // Focus an item (first arrow right goes to index 1)
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      // Press Enter
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ENTER }));
      });
      
      expect(defaultConfig.onOpenItem).toHaveBeenCalledWith(sampleItems[1]);
    });

    it('should toggle item selection with Enter in selection mode', () => {
      const config = { ...defaultConfig, selectionMode: true };
      const { result } = renderHook(() => useKeyboardNavigation(config));
      
      // Focus an item
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      // Press Enter
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ENTER }));
      });
      
      expect(config.onToggleItemSelection).toHaveBeenCalledWith(sampleItems[1].id);
      expect(config.onOpenItem).not.toHaveBeenCalled();
    });

    it('should open item with Space key in normal mode', () => {
      renderHook(() => useKeyboardNavigation(defaultConfig));
      
      // Focus an item
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      // Press Space
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.SPACE }));
      });
      
      expect(defaultConfig.onOpenItem).toHaveBeenCalledWith(sampleItems[1]);
    });

    it('should toggle selection with Space in selection mode', () => {
      const config = { ...defaultConfig, selectionMode: true };
      renderHook(() => useKeyboardNavigation(config));
      
      // Focus an item
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      // Press Space
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.SPACE }));
      });
      
      expect(config.onToggleItemSelection).toHaveBeenCalledWith(sampleItems[1].id);
    });
  });

  describe('focused state management', () => {
    it('should update focusedId when navigating', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      expect(result.current.focusedId).toBe(sampleItems[1].id); // First navigation goes to index 1
    });

    it('should check if item is focused', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      expect(result.current.isItemFocused(sampleItems[1].id)).toBe(true); // Index 1
      expect(result.current.isItemFocused(sampleItems[0].id)).toBe(false);
    });

    it('should reset focus', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      expect(result.current.focusedIndex).toBe(1); // First navigation goes to index 1
      
      act(() => {
        result.current.resetFocus();
      });
      
      expect(result.current.focusedIndex).toBe(-1);
      expect(result.current.focusedId).toBeNull();
    });
  });

  describe('card ref registration', () => {
    it('should register card refs', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      const mockElement = document.createElement('div');
      
      act(() => {
        result.current.registerCardRef('test-id', mockElement);
      });
      
      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should unregister card refs when element is null', () => {
      const { result } = renderHook(() => useKeyboardNavigation(defaultConfig));
      const mockElement = document.createElement('div');
      
      act(() => {
        result.current.registerCardRef('test-id', mockElement);
        result.current.registerCardRef('test-id', null);
      });
      
      // No error should be thrown
      expect(true).toBe(true);
    });
  });

  describe('empty items', () => {
    it('should handle empty items array', () => {
      const config = { ...defaultConfig, items: [] };
      const { result } = renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: KEYBOARD_SHORTCUTS.ARROW_RIGHT }));
      });
      
      // Should not crash
      expect(result.current.focusedIndex).toBe(-1);
    });
  });

  describe('modal blocking', () => {
    it('should block main shortcuts when modal is open', () => {
      const config = { ...defaultConfig, hasOpenModal: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
      });
      
      expect(config.onAddItem).not.toHaveBeenCalled();
    });

    it('should not block toggle shortcuts when modal is open', () => {
      const config = { ...defaultConfig, hasOpenModal: true };
      renderHook(() => useKeyboardNavigation(config));
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
      });
      
      expect(config.onOpenHelp).toHaveBeenCalled();
    });
  });
});
