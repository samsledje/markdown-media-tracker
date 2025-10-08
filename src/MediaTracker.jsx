import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Book, Film, Search, Plus, Star, Tag, Calendar, User, Hash, X, FolderOpen, Save, ChevronDown, ChevronUp, Palette, CheckSquare, SlidersHorizontal, ArrowUpDown, Download, Upload, Key, Cloud, Wifi, WifiOff, ArrowLeft, Bookmark, BookOpen, CheckCircle, PlayCircle, Layers } from 'lucide-react';

// Hooks
import { useItems } from './hooks/useItems.js';
import { useFilters } from './hooks/useFilters.js';
import { useSelection } from './hooks/useSelection.js';
import { useTheme } from './hooks/useTheme.js';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation.js';
import { useOmdbApi } from './hooks/useOmdbApi.js';

// Components
import SearchModal from './components/modals/SearchModal.jsx';
import HelpModal from './components/modals/HelpModal.jsx';
import BatchEditModal from './components/modals/BatchEditModal.jsx';
import ItemDetailModal from './components/modals/ItemDetailModal.jsx';
import AddEditModal from './components/modals/AddEditModal.jsx';
import ApiKeyModal from './components/modals/ApiKeyModal.jsx';
import StorageSelector from './components/StorageSelector.jsx';
import StorageIndicator from './components/StorageIndicator.jsx';

// Utils
import { hexToRgba } from './utils/colorUtils.js';
import { exportCSV } from './utils/csvUtils.js';
import { processCSVImport } from './utils/importUtils.js';
import { hasApiKey } from './config.js';

// Constants
import { PRIMARY_COLOR_PRESETS, HIGHLIGHT_COLOR_PRESETS } from './constants/colors.js';
import { STATUS_LABELS, STATUS_ICONS, STATUS_COLORS } from './constants/index.js';

/**
 * Get the icon component for a given status
 */
const getStatusIcon = (status, className = '') => {
  const iconType = STATUS_ICONS[status];
  switch (iconType) {
    case 'bookmark':
      return <Bookmark className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'book-open':
      return <BookOpen className={className} />;
    case 'check-circle':
      return <CheckCircle className={className} />;
    case 'play-circle':
      return <PlayCircle className={className} />;
    default:
      return <Bookmark className={className} />;
  }
};

/**
 * Get color class for status badge
 */
const getStatusColorClass = (status) => {
  const colorType = STATUS_COLORS[status];
  switch (colorType) {
    case 'blue':
      return 'bg-blue-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'green':
      return 'bg-green-500';
    default:
      return 'bg-blue-500';
  }
};

const MediaTracker = () => {
  // Modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchResultItem, setSearchResultItem] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const [availableStorageOptions, setAvailableStorageOptions] = useState([]);
  const [showStorageSelector, setShowStorageSelector] = useState(true);

  // Refs
  const searchInputRef = useRef(null);
  const filtersRef = useRef(null);
  const filterButtonRef = useRef(null);
  const menuRef = useRef(null);

  // Menu positioning
  const [menuPos, setMenuPos] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Custom hooks
  const {
    items,
    storageAdapter,
    storageInfo,
    isLoading,
    undoStack,
    initializeStorage,
    loadItems,
    saveItem,
    deleteItem,
    deleteItems,
    undoLastDelete,
    selectStorage,
    disconnectStorage,
    getAvailableStorageOptions,
    applyBatchEdit
  } = useItems();

  const {
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
    filteredAndSortedItems,
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
  } = useFilters(items);

  const {
    selectionMode,
    selectedIds,
    selectedCount,
    toggleSelectionMode,
    toggleItemSelection,
    selectAll,
    clearSelection,
    isItemSelected,
    getSelectedItems
  } = useSelection();

  const {
    primaryColor,
    highlightColor,
    cardSize,
    updatePrimaryColor,
    updateHighlightColor,
    updateCardSize
  } = useTheme();

  const { omdbApiKey, updateApiKey } = useOmdbApi();

  // Close modals and clear states
  const closeModals = () => {
    setMenuOpen(false);
    setCustomizeOpen(false);
    setShowHelp(false);
    setIsAdding(false);
    setIsSearching(false);
    setSelectedItem(null);
    setShowBatchEdit(false);
    setShowApiKeyManager(false);
    if (searchTerm) setSearchTerm('');
    if (selectionMode) clearSelection();
  };

  // Focus search input
  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      const val = searchInputRef.current.value || '';
      searchInputRef.current.setSelectionRange(val.length, val.length);
    }
  };

  // Handle item selection on card click
  const handleItemClick = (item, e) => {
    if (selectionMode) {
      toggleItemSelection(item.id);
    } else if (e.shiftKey) {
      if (!selectionMode) toggleSelectionMode();
      toggleItemSelection(item.id);
    } else {
      setSelectedItem(item);
    }
  };

  // Handle CSV import
  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    if (!storageAdapter || !storageAdapter.isConnected()) {
      alert('Please connect to a storage location first');
      e.target.value = '';
      return;
    }

    try {
      const { added, format } = await processCSVImport(file, items, saveItem);
      alert(`Imported ${added} items (detected format: ${format})`);
    } catch (error) {
      alert(error.message);
    }

    e.target.value = '';
  };

  // Handle batch operations
  const handleDeleteSelected = async () => {
    if (selectedCount === 0) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedCount} selected item(s)? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const selectedItems = getSelectedItems(filteredAndSortedItems);
      await deleteItems(selectedItems);
      clearSelection();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleBatchEdit = async (changes) => {
    try {
      const updated = await applyBatchEdit(selectedIds, changes);
      setShowBatchEdit(false);
      clearSelection();
      alert(`Updated ${updated.length} items`);
    } catch (error) {
      alert(error.message);
    }
  };

  // Keyboard navigation setup
  const { focusedIndex, focusedId, registerCardRef, isItemFocused, resetFocus } = useKeyboardNavigation({
    items: filteredAndSortedItems,
    cardSize,
    storageAdapter,
    onOpenHelp: () => setShowHelp(true),
    onFocusSearch: focusSearch,
    onAddItem: () => setIsAdding(true),
    onSearchOnline: () => setIsSearching(true),
    onToggleFilters: () => setShowFilters(s => !s),
    onToggleCustomize: () => setCustomizeOpen(s => !s),
    onCycleFilterType: cycleFilterType,
    onToggleSelectionMode: toggleSelectionMode,
    onSelectAll: () => selectAll(filteredAndSortedItems),
    onDeleteSelected: handleDeleteSelected,
    onOpenItem: setSelectedItem,
    onCloseModals: closeModals,
    selectionMode,
    selectedCount
  });

  // Initialize storage options on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const options = await getAvailableStorageOptions();
        setAvailableStorageOptions(options);
        
        // Check if user was previously connected to Google Drive
        const wasConnected = localStorage.getItem('googleDriveConnected');
        if (wasConnected === 'true') {
          try {
            await initializeStorage('googledrive');
            setShowStorageSelector(false);
          } catch (error) {
            console.error('Failed to reconnect to Google Drive:', error);
            localStorage.removeItem('googleDriveConnected');
            localStorage.removeItem('googleDriveFolderId');
          }
        } else if (options.find(opt => opt.type === 'filesystem' && opt.supported)) {
          // If filesystem is supported but no previous connection, still show selector
          setShowStorageSelector(true);
        }
      } catch (error) {
        setStorageError(error.message);
      }
    };

    initializeApp();
  }, []);

  // Handle storage selection
  const handleStorageSelect = async (storageType) => {
    try {
      setStorageError(null);
      await selectStorage(storageType);
      setShowStorageSelector(false);
    } catch (error) {
      setStorageError(error.message);
    }
  };

  // Handle storage disconnection
  const handleDisconnectStorage = async () => {
    try {
      await disconnectStorage();
      setShowStorageSelector(true);
      closeModals();
    } catch (error) {
      setStorageError(error.message);
    }
  };
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuOpen) return;

      // If click is inside the menu button, ignore
      if (menuRef.current && menuRef.current.contains(e.target)) return;

      // If click is inside the portal menu, ignore
      let el = e.target;
      while (el) {
        if (el.getAttribute && el.getAttribute('data-menu-portal') === '1') return;
        el = el.parentElement;
      }

      setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Compute portal menu position when opened
  useEffect(() => {
    if (!menuOpen || !menuRef.current) {
      setMenuPos(null);
      return;
    }
    const btnRect = menuRef.current.getBoundingClientRect();
    const width = 192; // w-48
    const left = Math.max(8, btnRect.right - width);
    const top = btnRect.bottom + 8;
    setMenuPos({ left, top, width });
  }, [menuOpen]);

  // Auto-show API key modal when storage is connected and no API key is configured
  useEffect(() => {
    if (storageAdapter && storageAdapter.isConnected() && !hasApiKey()) {
      // Small delay to ensure the storage connection UI has settled
      const timer = setTimeout(() => {
        setShowApiKeyManager(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [storageAdapter, storageInfo]);

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: 'linear-gradient(135deg, var(--mt-primary), rgba(15,23,42,1))' }}>
      <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
              <img src="./logo_white.svg" alt="logo" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
              <span className="hidden xs:inline">Markdown Media Tracker</span>
              <span className="xs:hidden">MMT</span>
            </h1>
            <div className="flex gap-2">
              {!storageAdapter || !storageAdapter.isConnected() ? null : (
                <>
                  <button
                    onClick={() => setIsSearching(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition min-h-[44px]"
                    style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                    title="Search"
                  >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Add new media</span>
                  </button>

                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      aria-expanded={menuOpen}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition bg-slate-700/50 hover:bg-slate-700 min-h-[44px]"
                      title="More actions"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span className="hidden sm:inline">Menu</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {menuOpen && menuPos && createPortal(
        <div data-menu-portal="1" style={{ position: 'fixed', left: `${menuPos.left}px`, top: `${menuPos.top}px`, width: `${menuPos.width}px`, zIndex: 99999 }}>
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-2 text-white">
            <button
              onClick={() => { setIsAdding(true); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 text-white"
            >
              <Plus className="w-4 h-4" />
              Add Manually
            </button>

            <label className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 cursor-pointer text-white">
              <input id="import-csv-input" type="file" accept=".csv,text/csv" onChange={(e) => { handleImportFile(e); setMenuOpen(false); }} className="hidden" />
              <Upload className="w-4 h-4" />
              Import CSV
            </label>

            <button
              onClick={() => { exportCSV(items); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 text-white"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <button
              onClick={() => { setShowApiKeyManager(true); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 text-white"
            >
              <Key className="w-4 h-4" />
              Manage API Keys
            </button>

            {undoStack > 0 && (
              <button
                onClick={() => { undoLastDelete(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Undo Delete ({undoStack})
              </button>
            )}

            <button
              onClick={() => { handleDisconnectStorage(); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Switch Storage
            </button>

          </div>
        </div>,
        document.body
      )}

      {showStorageSelector ? (
        <div className="flex-1">
          <StorageSelector
            onStorageSelect={handleStorageSelect}
            availableOptions={availableStorageOptions}
            error={storageError}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto px-4 py-4 sm:py-6">
          {/* Search and Type Filters */}
          <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-0 sm:flex sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search your library by title, author, director..."
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 sm:py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-base"
              />
            </div>
            <div className="flex gap-2 justify-center sm:justify-start">
              {['all', 'book', 'movie'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-lg transition capitalize min-h-[44px] ${
                    filterType === type
                      ? ''
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                  style={filterType === type ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Sort, Selection, and Filter Controls */}
          <div className="mb-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            {/* Mobile: First row - Sort controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              <label className="text-sm text-slate-300 flex items-center gap-2 flex-shrink-0">
                <ArrowUpDown className="w-4 h-4"/>
                <span className="hidden sm:inline">Sort:</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none text-sm min-h-[44px]"
              >
                <option value="dateAdded">Date Added</option>
                <option value="dateConsumed">Date Read/Watched</option>
                <option value="title">Title</option>
                <option value="author">Author / Director</option>
                <option value="year">Year</option>
                <option value="rating">Rating</option>
              </select>

              <button
                onClick={toggleSortOrder}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg transition min-h-[44px]"
                title="Toggle sort order"
              >
                {sortOrder === 'asc' ? (
                  <div className="flex items-center gap-1 text-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M12 8l-4 6h8l-4-6z" fill="currentColor" />
                    </svg>
                    <span className="hidden sm:inline">Asc</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M12 16l4-6H8l4 6z" fill="currentColor" />
                    </svg>
                    <span className="hidden sm:inline">Desc</span>
                  </div>
                )}
              </button>
            </div>
            
            {/* Mobile: Second row - Action controls */}
            <div className="flex items-center gap-2 sm:ml-auto">
              {selectionMode && (
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <span className="text-sm text-slate-400 flex-shrink-0">
                    {selectedCount} selected
                  </span>
                  {selectedCount > 0 && (
                    <>
                      <button
                        onClick={() => setShowBatchEdit(true)}
                        className="px-3 py-2 rounded text-sm min-h-[44px]"
                        style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                      >
                        <span className="hidden sm:inline">Batch Edit</span>
                        <span className="sm:hidden">Edit</span>
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        className="px-3 py-2 rounded text-sm min-h-[44px]"
                        style={{ backgroundColor: 'rgba(255,0,0,0.16)', color: 'white' }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
              
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition min-h-[44px] ${
                  selectionMode ? '' : 'bg-slate-700/50 hover:bg-slate-700'
                }`}
                style={selectionMode ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                title="Toggle selection mode"
              >
                <CheckSquare className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">{selectionMode ? 'Selecting' : 'Select'}</span>
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 sm:px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition flex items-center gap-2 min-h-[44px]"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <button
                onClick={clearFilters}
                className="px-3 sm:px-4 py-2 rounded-lg transition text-sm min-h-[44px]"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }}
              >
                <span className="hidden sm:inline">Clear</span>
                <X className="w-4 h-4 sm:hidden" />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Rating Filter */}
                <div>
                  <div className="text-sm text-slate-300 mb-2">Minimum rating</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterRating(0)}
                      className={`px-3 py-1 rounded-lg ${filterRating === 0 ? '' : 'bg-slate-700/50'}`}
                      style={filterRating === 0 ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                    >
                      Any
                    </button>
                    {[1, 2, 3, 4, 5].map(r => (
                      <button
                        key={r}
                        onClick={() => setFilterRating(r)}
                        className={`px-2 py-1 rounded-lg ${filterRating === r ? '' : 'bg-slate-700/50'}`}
                        style={filterRating === r ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        title={`Minimum ${r} star${r > 1 ? 's' : ''}`}
                      >
                        <Star className={`w-4 h-4 ${r <= (filterRating || 0) ? 'text-yellow-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Filter */}
                <div>
                  <div className="text-sm text-slate-300 mb-2">Recently read / watched</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'any', label: 'Any' },
                      { value: 'last7', label: 'Last 7 days' },
                      { value: 'last30', label: 'Last 30 days' },
                      { value: 'last90', label: 'Last 90 days' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFilterRecent(option.value)}
                        className={`px-3 py-1 rounded-lg text-sm ${filterRecent === option.value ? '' : 'bg-slate-700/50'}`}
                        style={filterRecent === option.value ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                <div>
                  <div className="text-sm text-slate-300 mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {allTags.length === 0 ? (
                      <div className="text-sm text-slate-400">No tags available</div>
                    ) : (
                      allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTagFilter(tag)}
                          className={`px-3 py-1 rounded-full text-sm transition ${
                            filterTags.includes(tag) ? '' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                          style={filterTags.includes(tag) ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        >
                          {tag}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <div className="text-sm text-slate-300 mb-2">Status</div>
                  <div className="flex flex-wrap gap-2">
                    {allStatuses.length === 0 ? (
                      <div className="text-sm text-slate-400">No status data available</div>
                    ) : (
                      allStatuses.map(status => (
                        <button
                          key={status}
                          onClick={() => toggleStatusFilter(status)}
                          className={`px-3 py-1 rounded-lg text-sm transition flex items-center gap-2 ${
                            filterStatuses.includes(status) ? '' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                          style={filterStatuses.includes(status) ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        >
                          {getStatusIcon(status, 'w-4 h-4')}
                          {STATUS_LABELS[status]}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Items Grid */}
          <div className="mb-6">
            {filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                  {hasActiveFilters ? (
                    <Search className="w-16 h-16 text-slate-600" />
                  ) : (
                    <Book className="w-16 h-16 text-slate-600" />
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-300">
                  {hasActiveFilters ? 'No matches found' : 'No items yet'}
                </h3>
                <p className="text-slate-400 mb-6">
                  {hasActiveFilters 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Add some books or movies to get started.'
                  }
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="px-6 py-3 rounded-lg transition"
                    style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add First Item
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid gap-3 sm:gap-4 ${
                cardSize === 'tiny' ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10' :
                cardSize === 'small' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
                cardSize === 'large' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                cardSize === 'xlarge' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' :
                'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}>
                {filteredAndSortedItems.map((item, index) => (
                  <div
                    key={item.id}
                    ref={(el) => registerCardRef(item.id, el)}
                    onClick={(e) => handleItemClick(item, e)}
                    className={`bg-slate-800/30 border rounded-lg overflow-hidden cursor-pointer transition-all relative ${
                      isItemFocused(item.id) ? 'ring-2 ring-blue-500' :
                      isItemSelected(item.id) ? 'ring-2 ring-yellow-500' :
                      'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {/* Selection checkbox */}
                    {selectionMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isItemSelected(item.id) ? 'bg-yellow-500 border-yellow-500' : 'bg-slate-800 border-slate-400'
                        }`}>
                          {isItemSelected(item.id) && (
                            <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cover image */}
                    {item.coverUrl && (
                      <div className={`${cardSize === 'tiny' ? 'h-24' : cardSize === 'small' ? 'h-32' : cardSize === 'large' ? 'h-48' : cardSize === 'xlarge' ? 'h-64' : 'h-40'} overflow-hidden`}>
                        <img
                          src={item.coverUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold leading-tight mb-1 ${
                            cardSize === 'tiny' ? 'text-xs' : cardSize === 'small' ? 'text-sm' : 'text-base'
                          }`}>
                            <span className="line-clamp-2">{item.title}</span>
                          </h3>
                          {(item.author || item.director) && (
                            <p className={`text-slate-400 truncate ${
                              cardSize === 'tiny' ? 'text-xs' : 'text-sm'
                            }`}>
                              {item.author || item.director}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 ml-2 flex items-center gap-2">
                          {/* Type icon */}
                          {item.type === 'book' ? (
                            <Book className={`text-blue-400 ${cardSize === 'tiny' ? 'w-6 h-6' : 'w-7 h-7'}`} />
                          ) : (
                            <Film className={`text-purple-400 ${cardSize === 'tiny' ? 'w-6 h-6' : 'w-7 h-7'}`} />
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      {item.rating > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`${cardSize === 'tiny' ? 'w-2 h-2' : 'w-3 h-3'} ${
                                i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Year */}
                      {item.year && (
                        <div className={`text-slate-500 ${cardSize === 'tiny' ? 'text-xs' : 'text-sm'}`}>
                          {item.year}
                        </div>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && cardSize !== 'tiny' && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className={`px-2 py-1 rounded-full ${cardSize === 'small' ? 'text-xs' : 'text-xs'}`}
                              style={{ backgroundColor: hexToRgba(highlightColor, 0.12), color: 'white' }}
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-xs text-slate-500">+{item.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom-right status badge (moved from top-right) */}
                    {item.status && (
                      <div
                        className={`absolute top-2 right-2 z-20 flex items-center justify-center rounded-full ${getStatusColorClass(item.status)} bg-opacity-80 shadow-md ${
                          cardSize === 'tiny' ? 'w-5 h-5' : 'w-7 h-7'
                        }`}
                        title={STATUS_LABELS[item.status]}
                        style={{ backdropFilter: 'blur(4px)' }}
                      >
                        {getStatusIcon(item.status, `text-white ${cardSize === 'tiny' ? 'w-3 h-3' : 'w-4 h-4'}`)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customize Panel */}
      {customizeOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Customize Appearance</h2>
              <button onClick={() => setCustomizeOpen(false)} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Card Size */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Card Size: {cardSize.charAt(0).toUpperCase() + cardSize.slice(1)}
                </label>
                <div className="px-3">
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={['tiny', 'small', 'medium', 'large', 'xlarge'].indexOf(cardSize)}
                    onChange={(e) => {
                      const sizes = ['tiny', 'small', 'medium', 'large', 'xlarge'];
                      updateCardSize(sizes[parseInt(e.target.value)]);
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, var(--mt-highlight) 0%, var(--mt-highlight) ${(['tiny', 'small', 'medium', 'large', 'xlarge'].indexOf(cardSize) / 4) * 100}%, #475569 ${(['tiny', 'small', 'medium', 'large', 'xlarge'].indexOf(cardSize) / 4) * 100}%, #475569 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Tiny</span>
                    <span>Small</span>
                    <span>Medium</span>
                    <span>Large</span>
                    <span>X-Large</span>
                  </div>
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Primary Color Presets */}
                  {PRIMARY_COLOR_PRESETS.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => updatePrimaryColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        primaryColor === color ? 'border-white shadow-lg' : 'border-slate-600 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Primary preset ${index + 1}`}
                    />
                  ))}
                  {/* Primary Color Picker */}
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => updatePrimaryColor(e.target.value)}
                    className="w-12 h-8 rounded border border-slate-600 hover:border-slate-400 cursor-pointer bg-transparent"
                    title="Custom primary color"
                  />
                </div>
              </div>

              {/* Highlight Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Highlight Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Highlight Color Presets */}
                  {HIGHLIGHT_COLOR_PRESETS.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => updateHighlightColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        highlightColor === color ? 'border-white shadow-lg' : 'border-slate-600 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Highlight preset ${index + 1}`}
                    />
                  ))}
                  {/* Highlight Color Picker */}
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => updateHighlightColor(e.target.value)}
                    className="w-12 h-8 rounded border border-slate-600 hover:border-slate-400 cursor-pointer bg-transparent"
                    title="Custom highlight color"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isSearching && (
        <SearchModal
          onClose={() => setIsSearching(false)}
          onSelect={(result) => {
            setSearchResultItem(result);
            setIsSearching(false);
            setIsAdding(true);
          }}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showApiKeyManager && <ApiKeyModal onClose={() => setShowApiKeyManager(false)} />}

      {showBatchEdit && (
        <BatchEditModal
          onClose={() => setShowBatchEdit(false)}
          onApply={handleBatchEdit}
          selectedItems={getSelectedItems(filteredAndSortedItems)}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={(item) => {
            saveItem(item);
            setSelectedItem(null);
          }}
          onQuickSave={(item) => {
            // persist change but keep modal open
            saveItem(item);
          }}
          onDelete={(item) => {
            deleteItem(item);
            setSelectedItem(null);
          }}
          hexToRgba={hexToRgba}
          highlightColor={highlightColor}
        />
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-40">
        {/* Storage Indicator */}
        {!showStorageSelector && (
          <StorageIndicator
            storageAdapter={storageAdapter}
            storageInfo={storageInfo}
            onSwitchStorage={handleDisconnectStorage}
          />
        )}
        
        {/* Customize Button */}
        <button
          onClick={() => setCustomizeOpen(true)}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
          style={{ backgroundColor: 'var(--mt-highlight)' }}
          title="Customize Appearance"
        >
          <Palette className="w-5 h-5 text-white" />
        </button>
        
        {/* Help Button */}
        <button
          onClick={() => setShowHelp(true)}
          className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
          title="Help & Shortcuts"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {isAdding && (
        <AddEditModal
          onClose={() => {
            setIsAdding(false);
            setSearchResultItem(null);
          }}
          onSave={(item) => {
            saveItem(item);
            setIsAdding(false);
            setSearchResultItem(null);
          }}
          initialItem={searchResultItem}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto py-4 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <a
              href="https://github.com/samsledje/markdown-media-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              title="View on GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <span className="text-slate-500">|</span>
            <a
              href="https://github.com/samsledje/markdown-media-tracker/blob/main/PRIVACY_POLICY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              title="Privacy Policy"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
              </svg>
            </a>
            <span className="text-slate-500">|</span>
            <a
              href="https://samsl.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              title="Visit samsl.io"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MediaTracker;