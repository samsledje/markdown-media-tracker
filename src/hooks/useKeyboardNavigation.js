import { useState, useEffect, useRef } from 'react';
import { isTyping } from '../utils/commonUtils.js';
import { KEYBOARD_SHORTCUTS, GRID_COLUMNS_BY_SIZE } from '../constants/index.js';

/**
 * Custom hook for managing keyboard navigation and shortcuts
 * @param {object} config - Configuration object
 * @returns {object} Navigation state and handlers
 */
export const useKeyboardNavigation = ({
  items = [],
  cardSize = 'medium',
  storageAdapter = null,
  onOpenHelp = () => {},
  onFocusSearch = () => {},
  onAddItem = () => {},
  onSearchOnline = () => {},
  onToggleFilters = () => {},
  onToggleCustomize = () => {},
  onCycleFilterType = () => {},
  onToggleSelectionMode = () => {},
  onSelectAll = () => {},
  onDeleteSelected = () => {},
  onOpenItem = () => {},
  onCloseModals = () => {},
  selectionMode = false,
  selectedCount = 0
} = {}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusedId, setFocusedId] = useState(null);
  const cardRefs = useRef({});

  /**
   * Handle keyboard events
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape: close modals, clear search/selection
      if (e.key === KEYBOARD_SHORTCUTS.ESCAPE) {
        onCloseModals();
        return;
      }

      // Don't run shortcuts while typing in inputs/textareas
      if (isTyping()) return;

      const key = e.key;

      // Show help: ?
      if (key === KEYBOARD_SHORTCUTS.HELP) {
        e.preventDefault();
        onOpenHelp();
        return;
      }

      // Focus search: / or Ctrl/Cmd+K
      if ((key === KEYBOARD_SHORTCUTS.SEARCH && !e.ctrlKey && !e.metaKey) || 
          ((e.ctrlKey || e.metaKey) && key.toLowerCase() === KEYBOARD_SHORTCUTS.SEARCH_ALT)) {
        e.preventDefault();
        onFocusSearch();
        return;
      }

      // Storage-dependent shortcuts
      if (storageAdapter && storageAdapter.isConnected()) {
        if (key.toLowerCase() === KEYBOARD_SHORTCUTS.ADD || key.toLowerCase() === KEYBOARD_SHORTCUTS.ADD_ALT) {
          e.preventDefault();
          onAddItem();
          return;
        }
        if (key.toLowerCase() === KEYBOARD_SHORTCUTS.ONLINE_SEARCH) {
          e.preventDefault();
          onSearchOnline();
          return;
        }
      }

      // Toggle filters: F
      if (key.toLowerCase() === KEYBOARD_SHORTCUTS.FILTERS) {
        e.preventDefault();
        onToggleFilters();
        return;
      }

      // Toggle customize: C
      if (key.toLowerCase() === KEYBOARD_SHORTCUTS.CUSTOMIZE) {
        e.preventDefault();
        onToggleCustomize();
        return;
      }

      // Cycle filter type: T
      if (key.toLowerCase() === KEYBOARD_SHORTCUTS.TOGGLE_TYPE) {
        e.preventDefault();
        onCycleFilterType();
        return;
      }

      // Toggle selection mode: V
      if (key.toLowerCase() === KEYBOARD_SHORTCUTS.SELECTION_MODE) {
        e.preventDefault();
        onToggleSelectionMode();
        return;
      }

      // Select all visible: Ctrl/Cmd+A
      if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === KEYBOARD_SHORTCUTS.SELECT_ALL) {
        if (selectionMode) {
          e.preventDefault();
          onSelectAll();
        }
        return;
      }

      // Delete selected: Delete / Backspace
      if ((key === KEYBOARD_SHORTCUTS.DELETE || key === KEYBOARD_SHORTCUTS.BACKSPACE) && 
          selectionMode && selectedCount > 0) {
        e.preventDefault();
        onDeleteSelected();
        return;
      }

      // Item navigation and activation
      if (items.length > 0 && [
        KEYBOARD_SHORTCUTS.ARROW_LEFT,
        KEYBOARD_SHORTCUTS.ARROW_RIGHT,
        KEYBOARD_SHORTCUTS.ARROW_UP,
        KEYBOARD_SHORTCUTS.ARROW_DOWN,
        KEYBOARD_SHORTCUTS.ENTER,
        KEYBOARD_SHORTCUTS.SPACE
      ].includes(key)) {
        e.preventDefault();
        
        let idx = focusedIndex;
        if (idx < 0) idx = 0;
        
        const cols = GRID_COLUMNS_BY_SIZE[cardSize] || 3;

        if (key === KEYBOARD_SHORTCUTS.ARROW_LEFT) {
          idx = Math.max(0, idx - 1);
        } else if (key === KEYBOARD_SHORTCUTS.ARROW_RIGHT) {
          idx = Math.min(items.length - 1, idx + 1);
        } else if (key === KEYBOARD_SHORTCUTS.ARROW_UP) {
          idx = Math.max(0, idx - cols);
        } else if (key === KEYBOARD_SHORTCUTS.ARROW_DOWN) {
          idx = Math.min(items.length - 1, idx + cols);
        } else if (key === KEYBOARD_SHORTCUTS.ENTER || key === KEYBOARD_SHORTCUTS.SPACE) {
          const item = items[focusedIndex >= 0 ? focusedIndex : 0];
          if (item) onOpenItem(item);
          return;
        }

        setFocusedIndex(idx);
        const id = items[idx]?.id;
        setFocusedId(id || null);
        
        // Scroll focused item into view
        requestAnimationFrame(() => {
          const node = id && cardRefs.current[id];
          if (node && node.scrollIntoView) {
            node.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    items,
    cardSize,
    storageAdapter,
    focusedIndex,
    selectionMode,
    selectedCount,
    onOpenHelp,
    onFocusSearch,
    onAddItem,
    onSearchOnline,
    onToggleFilters,
    onToggleCustomize,
    onCycleFilterType,
    onToggleSelectionMode,
    onSelectAll,
    onDeleteSelected,
    onOpenItem,
    onCloseModals
  ]);

  /**
   * Register a card ref
   */
  const registerCardRef = (id, element) => {
    if (element) {
      cardRefs.current[id] = element;
    } else {
      delete cardRefs.current[id];
    }
  };

  /**
   * Check if an item is focused
   */
  const isItemFocused = (id) => {
    return focusedId === id;
  };

  /**
   * Reset focus
   */
  const resetFocus = () => {
    setFocusedIndex(-1);
    setFocusedId(null);
  };

  return {
    focusedIndex,
    focusedId,
    registerCardRef,
    isItemFocused,
    resetFocus
  };
};