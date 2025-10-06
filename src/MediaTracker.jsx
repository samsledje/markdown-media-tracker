import React, { useState, useEffect, useRef } from 'react';
import { Book, Film, Search, Plus, Star, Tag, Calendar, User, Hash, X, FolderOpen, Save, ChevronDown, ChevronUp, Maximize, CheckSquare, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const MediaTracker = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterRating, setFilterRating] = useState(0);
  const [filterTags, setFilterTags] = useState([]);
  const [filterRecent, setFilterRecent] = useState('any');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [omdbApiKey, setOmdbApiKey] = useState('');
  const filtersRef = useRef(null);
  const filterButtonRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [cardSize, setCardSize] = useState(() => {
    return localStorage.getItem('cardSize') || 'medium';
  });
  // Theme (primary + highlight) with persistence
  // sensible darker defaults for good contrast with white text
  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem('themePrimary') || '#0b1220'; // dark navy
  });
  // default highlight: medium purple for a pleasant accent on dark backgrounds
  const [highlightColor, setHighlightColor] = useState(() => {
    return localStorage.getItem('themeHighlight') || '#7c3aed'; // purple-600
  });
  const [customizeOpen, setCustomizeOpen] = useState(false);
  
  // (No slider presets — using fixed card sizes)

  // Load API key on mount
  useEffect(() => {
    // Try to load from localStorage first
    const storedKey = localStorage.getItem('omdbApiKey');
    if (storedKey) {
      setOmdbApiKey(storedKey);
    }
  }, []);

  // Get all unique tags from items
  const allTags = [...new Set(items.flatMap(item => item.tags || []))].sort();

  // Filters pane is toggled only by the Filters button; removing outside-click and Escape-to-close behavior

  // Compute dropdown position so it appears under the Filters button
  useEffect(() => {
    if (!showFilters || !filterButtonRef.current) return;

    const btnRect = filterButtonRef.current.getBoundingClientRect();
    const spaceRight = window.innerWidth - btnRect.right;
    const width = 320; // w-80 ~ 320px
    // Prefer aligning right edge with button's right, but fall back to left if not enough space
    const left = Math.max(8, Math.min(btnRect.right - width + btnRect.width, btnRect.left));
    const top = btnRect.bottom + 8; // small gap

    setDropdownStyle({ position: 'fixed', top: `${top}px`, left: `${Math.max(8, btnRect.right - width)}px`, width: `${width}px` });
  }, [showFilters]);

  const toggleTagFilter = (tag) => {
    if (filterTags.includes(tag)) {
      setFilterTags(filterTags.filter(t => t !== tag));
    } else {
      setFilterTags([...filterTags, tag]);
    }
  };

  const clearFilters = () => {
    setFilterTags([]);
    setFilterRating(0);
    setFilterType('all');
    setSearchTerm('');
    setFilterRecent('any');
  };

  useEffect(() => {
    try {
      localStorage.setItem('cardSize', cardSize);
    } catch (e) {
      // ignore
    }
  }, [cardSize]);

  // Persist and apply theme colors as CSS variables
  useEffect(() => {
    try {
      localStorage.setItem('themePrimary', primaryColor);
      localStorage.setItem('themeHighlight', highlightColor);
    } catch (e) {
      // ignore
    }

    try {
      document.documentElement.style.setProperty('--mt-primary', primaryColor);
      document.documentElement.style.setProperty('--mt-highlight', highlightColor);
    } catch (e) {
      // ignore (server-side or non-browser)
    }
  }, [primaryColor, highlightColor]);

  // small helper to convert hex to rgba for inline styles
  const hexToRgba = (hex, alpha = 1) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const parseMarkdown = (content) => {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) return { metadata: {}, body: content };
    
    const metadata = {};
    const yamlLines = match[1].split('\n');
    
    yamlLines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
        } else {
          value = value.replace(/['"]/g, '');
        }
        
        metadata[key] = value;
      }
    });
    
    return { metadata, body: match[2].trim() };
  };

  const generateMarkdown = (item) => {
    let yaml = '---\n';
    yaml += `title: "${item.title}"\n`;
    yaml += `type: ${item.type}\n`;
    
    if (item.author) yaml += `author: "${item.author}"\n`;
    if (item.director) yaml += `director: "${item.director}"\n`;
    if (item.actors) yaml += `actors: [${item.actors.map(a => `"${a}"`).join(', ')}]\n`;
    if (item.isbn) yaml += `isbn: "${item.isbn}"\n`;
    if (item.year) yaml += `year: ${item.year}\n`;
    if (item.rating) yaml += `rating: ${item.rating}\n`;
    if (item.tags && item.tags.length > 0) yaml += `tags: [${item.tags.map(t => `"${t}"`).join(', ')}]\n`;
    if (item.coverUrl) yaml += `coverUrl: "${item.coverUrl}"\n`;
    
  if (item.dateRead) yaml += `dateRead: "${item.dateRead}"\n`;
  if (item.dateWatched) yaml += `dateWatched: "${item.dateWatched}"\n`;
  yaml += `dateAdded: "${item.dateAdded}"\n`;
    yaml += '---\n\n';
    
    return yaml + (item.review || '');
  };

  const selectDirectory = async () => {
    try {
      console.log('Opening directory picker...');
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      console.log('Directory selected:', handle.name);
      setDirectoryHandle(handle);
      await loadItemsFromDirectory(handle);
      console.log('Items loaded successfully');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error selecting directory:', err);
        alert(`Error: ${err.message}. Make sure you're using Chrome, Edge, or Opera.`);
      }
    }
  };

  const loadItemsFromDirectory = async (handle) => {
    console.log('Loading items from directory...');
    const loadedItems = [];
    
    try {
      for await (const entry of handle.values()) {
        console.log('Found entry:', entry.name, entry.kind);
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          try {
            const file = await entry.getFile();
            const content = await file.text();
            console.log('Loaded file:', entry.name);
            const { metadata, body } = parseMarkdown(content);
            
            loadedItems.push({
              id: entry.name.replace('.md', ''),
              filename: entry.name,
              title: metadata.title || 'Untitled',
              type: metadata.type || 'book',
              author: metadata.author,
              director: metadata.director,
              actors: metadata.actors || [],
              isbn: metadata.isbn,
              year: metadata.year,
              rating: metadata.rating,
              tags: metadata.tags || [],
              coverUrl: metadata.coverUrl,
              dateRead: metadata.dateRead,
              dateWatched: metadata.dateWatched,
              dateAdded: metadata.dateAdded,
              review: body
            });
          } catch (err) {
            console.error(`Error loading ${entry.name}:`, err);
          }
        }
      }
      
      console.log(`Loaded ${loadedItems.length} items`);
      setItems(loadedItems.sort((a, b) => 
        new Date(b.dateAdded) - new Date(a.dateAdded)
      ));
    } catch (err) {
      console.error('Error reading directory:', err);
      alert(`Error reading directory: ${err.message}`);
    }
  };

  const saveItem = async (item) => {
    if (!directoryHandle) {
      alert('Please select a directory first');
      return;
    }

    try {
      const filename = item.filename || `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
      const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(generateMarkdown(item));
      await writable.close();
      
      await loadItemsFromDirectory(directoryHandle);
      setIsAdding(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error saving file:', err);
      alert('Error saving file. Please try again.');
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const deleteSelected = async () => {
    if (!directoryHandle) {
      alert('Please select a directory first');
      return;
    }

    if (selectedIds.size === 0) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedIds.size} selected item(s)? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const trashDir = await getOrCreateTrashDir(directoryHandle);
      for (const id of selectedIds) {
        const it = items.find(it => it.id === id);
        if (!it) continue;
        const filename = it.filename;
        try {
          const srcHandle = await directoryHandle.getFileHandle(filename);
          const file = await srcHandle.getFile();
          let trashName = filename;
          try { await trashDir.getFileHandle(trashName); trashName = `${filename.replace(/\.md$/, '')}-${Date.now()}.md`; } catch(e){}
          const dest = await trashDir.getFileHandle(trashName, { create: true });
          const writable = await dest.createWritable();
          await writable.write(await file.text());
          await writable.close();
          await directoryHandle.removeEntry(filename);
          pushUndo({ from: filename, to: `.trash/${trashName}` });
        } catch (err) {
          console.error('Error moving', filename, 'to trash', err);
        }
      }
      await loadItemsFromDirectory(directoryHandle);
      clearSelection();
    } catch (err) {
      console.error('Error deleting selected items', err);
      alert('Error deleting selected items. Check console for details.');
    }
  };

  const [showBatchEdit, setShowBatchEdit] = useState(false);

  const applyBatchEdit = async (changes) => {
    if (!directoryHandle) {
      alert('Please select a directory first');
      return;
    }

    try {
      const updated = [];
      for (const id of selectedIds) {
        const it = items.find(i => i.id === id);
        if (!it) continue;
        const newItem = { ...it };

        // apply only fields present in changes (non-empty)
        if (changes.type) newItem.type = changes.type;
        if (changes.author) newItem.author = changes.author;
        if (changes.director) newItem.director = changes.director;
        if (changes.year) newItem.year = changes.year;
        if (changes.rating !== null && changes.rating !== undefined) newItem.rating = changes.rating;
        if (changes.addTags && changes.addTags.length) newItem.tags = Array.from(new Set([...(newItem.tags||[]), ...changes.addTags]));
        if (changes.removeTags && changes.removeTags.length) newItem.tags = (newItem.tags||[]).filter(t => !changes.removeTags.includes(t));
        if (changes.dateRead) newItem.dateRead = changes.dateRead;
        if (changes.dateWatched) newItem.dateWatched = changes.dateWatched;

        // write file
        const filename = newItem.filename || `${newItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
        const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(generateMarkdown(newItem));
        await writable.close();

        updated.push(newItem.id);
      }

      await loadItemsFromDirectory(directoryHandle);
      setShowBatchEdit(false);
      clearSelection();
      alert(`Updated ${updated.length} items`);
    } catch (err) {
      console.error('Error applying batch edit', err);
      alert('Error applying batch edit. Check console for details.');
    }
  };

  const deleteItem = async (item) => {
    if (!directoryHandle) {
      alert('Please select a directory first');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`);
    if (!confirmDelete) return;

    // Move to .trash instead of outright deleting
    try {
      const trashDir = await getOrCreateTrashDir(directoryHandle);
      // copy file contents into trash with same filename (add timestamp if exists)
      const srcHandle = await directoryHandle.getFileHandle(item.filename);
      const file = await srcHandle.getFile();
      let trashName = item.filename;
      // if file exists in trash, append timestamp
      try {
        await trashDir.getFileHandle(trashName);
        trashName = `${item.filename.replace(/\.md$/, '')}-${Date.now()}.md`;
      } catch (e) {
        // not found -> ok
      }

      const dest = await trashDir.getFileHandle(trashName, { create: true });
      const writable = await dest.createWritable();
      await writable.write(await file.text());
      await writable.close();

      // remove original
      await directoryHandle.removeEntry(item.filename);

      // push to undo stack
      pushUndo({ from: item.filename, to: `.trash/${trashName}` });

      await loadItemsFromDirectory(directoryHandle);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error moving file to trash:', err);
      alert('Error deleting file. Please try again.');
    }
  };

  // ---------- Trash helpers & undo ----------
  const [undoStack, setUndoStack] = useState([]);

  const pushUndo = (entry) => {
    setUndoStack(prev => [...prev, entry]);
  };

  const popUndo = () => {
    let last;
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      last = prev[prev.length - 1];
      return prev.slice(0, prev.length - 1);
    });
    return last;
  };

  const getOrCreateTrashDir = async (dirHandle) => {
    try {
      return await dirHandle.getDirectoryHandle('.trash', { create: true });
    } catch (err) {
      console.error('Error creating/reading .trash dir', err);
      throw err;
    }
  };

  const undoLastTrash = async () => {
    if (!directoryHandle) {
      alert('Please select a directory first');
      return;
    }
    const last = popUndo();
    if (!last) {
      alert('Nothing to undo');
      return;
    }

    try {
      const trashDir = await getOrCreateTrashDir(directoryHandle);
      const trashPath = last.to.replace(/^\.trash\//, '');
      const trashFile = await trashDir.getFileHandle(trashPath);
      const file = await trashFile.getFile();

      // restore to original name; if it exists, append timestamp
      let restoreName = last.from;
      try {
        await directoryHandle.getFileHandle(restoreName);
        restoreName = `${restoreName.replace(/\.md$/, '')}-restored-${Date.now()}.md`;
      } catch (e) {
        // not found -> ok
      }

      const dest = await directoryHandle.getFileHandle(restoreName, { create: true });
      const writable = await dest.createWritable();
      await writable.write(await file.text());
      await writable.close();

      // remove from trash
      await trashDir.removeEntry(trashPath);

      await loadItemsFromDirectory(directoryHandle);
      alert(`Restored ${restoreName}`);
    } catch (err) {
      console.error('Error undoing trash', err);
      alert('Error restoring file. See console for details.');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.author && item.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.director && item.director.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.actors && item.actors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (item.isbn && item.isbn.includes(searchTerm)) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesRating = filterRating === 0 || (item.rating && item.rating >= filterRating);
    const matchesTags = filterTags.length === 0 || 
      (item.tags && filterTags.every(tag => item.tags.includes(tag)));
    // Recent filter: 'any' | 'last7' | 'last30' | 'last90'
    const consumedDateStr = item.dateRead || item.dateWatched || null;
    const matchesRecent = (() => {
      if (!filterRecent || filterRecent === 'any') return true;
      if (!consumedDateStr) return false;
      const consumed = new Date(consumedDateStr);
      if (isNaN(consumed)) return false;
      const now = new Date();
      let days = 0;
      if (filterRecent === 'last7') days = 7;
      else if (filterRecent === 'last30') days = 30;
      else if (filterRecent === 'last90') days = 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return consumed >= cutoff;
    })();
    
    return matchesSearch && matchesType && matchesRating && matchesTags && matchesRecent;
  });

  // Sort filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'title':
        aVal = (a.title || '').toLowerCase();
        bVal = (b.title || '').toLowerCase();
        break;
      case 'author':
        aVal = (a.author || a.director || '').toLowerCase();
        bVal = (b.author || b.director || '').toLowerCase();
        break;
      case 'year':
        aVal = parseInt(a.year) || 0;
        bVal = parseInt(b.year) || 0;
        break;
      case 'dateConsumed':
        aVal = new Date(a.dateRead || a.dateWatched || 0);
        bVal = new Date(b.dateRead || b.dateWatched || 0);
        break;
      case 'rating':
        aVal = a.rating || 0;
        bVal = b.rating || 0;
        break;
      case 'dateAdded':
      default:
        aVal = new Date(a.dateAdded || 0);
        bVal = new Date(b.dateAdded || 0);
        break;
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, var(--mt-primary), rgba(15,23,42,1))' }}>
      <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Book className="w-7 h-7" />
              Media Tracker
            </h1>
            <div className="flex gap-2">
              {!directoryHandle ? (
                <button
                  onClick={selectDirectory}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
                  style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                >
                  <FolderOpen className="w-4 h-4" />
                  Select Directory
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsSearching(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
                    style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                  >
                    <Search className="w-4 h-4" />
                    Search Online
                  </button>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
                    style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Manually
                  </button>
                    {/* select toggle moved to the sort/filter area */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {!directoryHandle ? (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <FolderOpen className="w-20 h-20 mx-auto mb-6 text-slate-500" />
          <h2 className="text-2xl font-bold mb-4">Welcome to Media Tracker</h2>
          <p className="text-slate-400 mb-8">
            Select a directory to store your book and movie markdown files. Each item will be saved as a separate .md file with YAML frontmatter.
          </p>
          <button
            onClick={selectDirectory}
            className="px-6 py-3 rounded-lg transition text-lg"
            style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
          >
            Select Directory
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, author, director, actors, ISBN, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'book', 'movie'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg transition capitalize ${
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

          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300 flex items-center gap-2"> <ArrowUpDown className="w-4 h-4"/> Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none"
              >
                <option value="dateAdded">Date Added</option>
                <option value="dateConsumed">Date Read/Watched</option>
                <option value="title">Title</option>
                <option value="author">Author / Director</option>
                <option value="year">Year</option>
                <option value="rating">Rating</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg ml-2"
                title="Toggle sort order"
                aria-label={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8l-4 6h8l-4-6z" fill="currentColor" />
                    </svg>
                    <span>Asc</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16l4-6H8l4 6z" fill="currentColor" />
                    </svg>
                    <span>Desc</span>
                  </div>
                )}
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2 relative">
              {/* Select toggle moved here */}
              <button
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  if (!selectionMode) setSelectedIds(new Set());
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${selectionMode ? '' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                style={selectionMode ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                title="Toggle selection mode"
              >
                <CheckSquare className="w-4 h-4" />
                <span className="text-sm">{selectionMode ? 'Selecting' : 'Select'}</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-lg transition text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }}
              >
                Clear
              </button>

              {false && (
                <div ref={filtersRef} className="mb-6 p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
                    <div className="mb-3">
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

                    <div>
                      <div className="text-sm text-slate-300 mb-2">Recently read / watched</div>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => setFilterRecent('any')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'any' ? '' : 'bg-slate-700/50'}`}
                          style={filterRecent === 'any' ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        >
                          Any
                        </button>
                        <button
                          onClick={() => setFilterRecent('last7')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'last7' ? '' : 'bg-slate-700/50'}`}
                          style={filterRecent === 'last7' ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        >
                          Last 7 days
                        </button>
                        <button
                          onClick={() => setFilterRecent('last30')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'last30' ? '' : 'bg-slate-700/50'}`}
                          style={filterRecent === 'last30' ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        >
                          Last 30 days
                        </button>
                        <button
                          onClick={() => setFilterRecent('last90')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'last90' ? '' : 'bg-slate-700/50'}`}
                          style={filterRecent === 'last90' ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        >
                          Last 90 days
                        </button>
                      </div>
                      <div className="text-sm text-slate-300 mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {allTags.length === 0 ? (
                          <div className="text-sm text-slate-400">No tags available</div>
                        ) : (
                          allTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTagFilter(tag)}
                              className={`px-3 py-1 rounded-full text-sm transition ${filterTags.includes(tag) ? '' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                              style={filterTags.includes(tag) ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                            >
                              {tag}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>

          {showFilters && (
            <div ref={filtersRef} className="mb-6 p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
              <div className="mb-3">
                <div className="text-sm text-slate-300 mb-2">Minimum rating</div>
                <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFilterRating(r)}
                          className={`px-2 py-1 rounded-lg ${filterRating === r ? '' : 'bg-slate-700/50'}`}
                          style={filterRating === r ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                          title={`Minimum ${r} star${r > 1 ? 's' : ''}`}
                        >
                  </button>
                  {[1, 2, 3, 4, 5].map(r => (
                    <button
                      key={r}
                      onClick={() => setFilterRating(r)}
                      className={`px-2 py-1 rounded-lg ${filterRating === r ? 'bg-yellow-500' : 'bg-slate-700/50'}`}
                      title={`Minimum ${r} star${r > 1 ? 's' : ''}`}
                    >
                      <Star className={`w-4 h-4 ${r <= (filterRating || 0) ? 'text-yellow-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-300 mb-2">Recently read / watched</div>
                <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => setFilterRecent('any')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'any' ? '' : 'bg-slate-700/50'}`}
                          style={filterRecent === 'any' ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        >
                          Any
                        </button>
                        <button
                          onClick={() => setFilterRecent('last7')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'last7' ? '' : 'bg-slate-700/50'}`}
                          style={filterRecent === 'last7' ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        >
                          Last 7 days
                        </button>
                        <button
                          onClick={() => setFilterRecent('last30')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'last30' ? '' : 'bg-slate-700/50'}`}
                          style={filterRecent === 'last30' ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        >
                          Last 30 days
                        </button>
                        <button
                          onClick={() => setFilterRecent('last90')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'last90' ? '' : 'bg-slate-700/50'}`}
                          style={filterRecent === 'last90' ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                        >
                          Last 90 days
                        </button>
                </div>
                <div className="text-sm text-slate-300 mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                        {allTags.length === 0 ? (
                          <div className="text-sm text-slate-400">No tags available</div>
                        ) : (
                          allTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTagFilter(tag)}
                              className={`px-3 py-1 rounded-full text-sm transition ${filterTags.includes(tag) ? '' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                              style={filterTags.includes(tag) ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                            >
                              {tag}
                            </button>
                          ))
                        )}
                </div>
              </div>
            </div>
          )}

          {selectedIds.size > 0 && (
            <div className="mb-4 p-3 bg-slate-800/40 border border-slate-700 rounded-lg flex items-center gap-3">
              <div className="text-sm text-slate-200">{selectedIds.size} selected</div>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setShowBatchEdit(true)}
                  className="px-3 py-1 rounded-lg transition text-sm"
                  style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                >
                  Batch Edit
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-3 py-1 rounded-lg transition text-sm"
                  style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                >
                  Delete Selected
                </button>
                {undoStack.length > 0 && (
                  <button
                    onClick={undoLastTrash}
                    className="px-3 py-1 rounded-lg transition text-sm"
                    style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                  >
                    Undo Last
                  </button>
                )}
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 rounded-lg transition text-sm"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 ${
            cardSize === 'tiny' ? 'md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' :
            cardSize === 'small' ? 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
            cardSize === 'large' ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
            cardSize === 'xlarge' ? 'md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' :
            'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          } gap-4`}>
            {sortedItems.map(item => {
              const isSelected = selectedIds.has(item.id);
              return (
              <div
                key={item.id}
                onClick={() => {
                  if (selectionMode) {
                    const next = new Set(selectedIds);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    setSelectedIds(next);
                  } else {
                    setSelectedItem(item);
                  }
                }}
                className={`relative bg-slate-700/30 border border-slate-600 rounded-lg overflow-hidden hover:border-blue-500 transition ${isSelected ? 'ring-2 ring-blue-400' : ''} cursor-pointer ${
                  cardSize === 'tiny' ? 'text-xs' : cardSize === 'small' ? '' : cardSize === 'large' ? 'text-base' : cardSize === 'xlarge' ? 'text-lg' : ''
                }`}
              >
                {selectionMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const next = new Set(selectedIds);
                      if (e.target.checked) next.add(item.id);
                      else next.delete(item.id);
                      setSelectedIds(next);
                    }}
                    className="absolute top-2 left-2 w-4 h-4 z-10"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${item.title}`}
                  />
                )}
                {item.coverUrl && (
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className={`w-full object-cover ${
                        cardSize === 'tiny' ? 'h-32' : cardSize === 'small' ? 'h-44' : cardSize === 'large' ? 'h-72' : cardSize === 'xlarge' ? 'h-80' : 'h-64'
                      }`}
                  />
                )}
                <div className={`${cardSize === 'tiny' ? 'p-2' : cardSize === 'small' ? 'p-3' : cardSize === 'large' ? 'p-5' : cardSize === 'xlarge' ? 'p-6' : 'p-4'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    {item.type === 'book' ? (
                      <Book className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                    ) : (
                      <Film className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                      {item.author && (
                        <p className="text-sm text-slate-400 truncate">{item.author}</p>
                      )}
                      {item.director && (
                        <p className="text-sm text-slate-400 truncate">{item.director}</p>
                      )}
                      {item.year && (
                        <p className="text-sm text-slate-500 truncate">{item.year}</p>
                      )}
                    </div>
                  </div>
                  {item.rating && (
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                            >
                              {tag}
                            </span>
                          ))}
                      {item.tags.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-slate-600/50 rounded">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>

          
          {sortedItems.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <p className="text-lg">No items found</p>
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      {selectedItem && !isAdding && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={saveItem}
          onDelete={deleteItem}
        />
      )}

      {isAdding && (
        <AddEditModal
          onClose={() => {
            setIsAdding(false);
            setSelectedItem(null);
          }}
          onSave={saveItem}
          initialItem={selectedItem}
        />
      )}

      {isSearching && (
        <SearchModal
          onClose={() => setIsSearching(false)}
          onSelect={(item) => {
            setIsAdding(true);
            setIsSearching(false);
            setSelectedItem(item);
          }}
          omdbApiKey={omdbApiKey}
          setOmdbApiKey={(key) => {
            setOmdbApiKey(key);
            localStorage.setItem('omdbApiKey', key);
          }}
        />
      )}

      {showBatchEdit && (
        <BatchEditModal
          onClose={() => setShowBatchEdit(false)}
          onApply={applyBatchEdit}
          sampleItem={items[0]}
          selectedItems={items.filter(it => selectedIds.has(it.id))}
        />
      )}
      {/* Floating Customize Style panel pinned to bottom-right */}
      <div className="fixed z-50 bottom-6 right-6">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-lg flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomizeOpen(!customizeOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-full transition"
              style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
              aria-expanded={customizeOpen}
              title="Customize style"
            >
              <Maximize className="w-5 h-5" />
              <span className="hidden sm:inline">Customize Style</span>
            </button>
          </div>

          {customizeOpen && (
            <div className="mt-2 w-72 p-3 bg-slate-800/80 border border-slate-700 rounded-lg">
              <div className="mb-2 text-sm text-slate-300">Card size</div>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={['tiny','small','medium','large','xlarge'].indexOf(cardSize)}
                  onChange={(e) => {
                    const mapping = ['tiny','small','medium','large','xlarge'];
                    const val = parseInt(e.target.value, 10);
                    setCardSize(mapping[val] || 'medium');
                  }}
                  className="h-2 w-full accent-current"
                  aria-label="Card size"
                />
                <div className="px-2 py-1 rounded text-sm bg-slate-700/40 text-slate-200">
                  {cardSize === 'tiny' ? 'Tiny' : cardSize === 'small' ? 'Small' : cardSize === 'medium' ? 'Medium' : cardSize === 'large' ? 'Large' : 'XLarge'}
                </div>
              </div>

              <div className="mb-2 text-sm text-slate-300">Primary color</div>
              <div className="flex gap-2 mb-3">
                {['#0b1220','#2563eb','#10b981','#ef4444','#7c3aed','#f59e0b'].map(c => (
                  <button
                    key={c}
                    onClick={() => setPrimaryColor(c)}
                    title={c}
                    className={`w-8 h-8 rounded-full border-2 ${primaryColor === c ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 p-0"
                  style={{ border: '2px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer' }}
                  aria-label="Custom primary color"
                />
              </div>

              <div className="mb-2 text-sm text-slate-300">Highlight color</div>
              <div className="flex gap-2">
                {['#7c3aed','#f59e0b','#fde68a','#60a5fa','#fb7185','#34d399'].map(c => (
                  <button
                    key={c}
                    onClick={() => setHighlightColor(c)}
                    title={c}
                    className={`w-8 h-8 rounded-full border-2 ${highlightColor === c ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="w-8 h-8 p-0"
                  style={{ border: '2px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer' }}
                  aria-label="Custom highlight color"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SearchModal = ({ onClose, onSelect, omdbApiKey, setOmdbApiKey }) => {
  const [searchType, setSearchType] = useState('book');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const searchBooks = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=12`
      );
      const data = await response.json();
      
      const books = data.docs.slice(0, 12).map(book => ({
        title: book.title,
        author: book.author_name?.[0] || 'Unknown Author',
        year: book.first_publish_year,
        isbn: book.isbn?.[0],
        coverUrl: book.cover_i 
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : null,
        type: 'book'
      }));
      
      setResults(books);
    } catch (error) {
      console.error('Error searching books:', error);
      alert('Error searching for books. Please try again.');
    }
    setLoading(false);
  };

  const searchMovies = async (searchQuery) => {
    if (!omdbApiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?s=${encodeURIComponent(searchQuery)}&apikey=${omdbApiKey}`
      );
      const data = await response.json();
      
      if (data.Response === 'False') {
        if (data.Error === 'Invalid API key!') {
          alert('Invalid OMDb API key. Please check your key.');
          setShowApiKeyInput(true);
        } else {
          setResults([]);
        }
        setLoading(false);
        return;
      }

      const detailedMovies = await Promise.all(
        data.Search.slice(0, 12).map(async (movie) => {
          const detailResponse = await fetch(
            `https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${omdbApiKey}`
          );
          const details = await detailResponse.json();
          
          return {
            title: details.Title,
            director: details.Director !== 'N/A' ? details.Director : '',
            actors: details.Actors !== 'N/A' ? details.Actors.split(', ') : [],
            year: details.Year,
            coverUrl: details.Poster !== 'N/A' ? details.Poster : null,
            type: 'movie',
            rating: details.imdbRating !== 'N/A' ? Math.round(parseFloat(details.imdbRating) / 2) : 0
          };
        })
      );
      
      setResults(detailedMovies);
    } catch (error) {
      console.error('Error searching movies:', error);
      alert('Error searching for movies. Please try again.');
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    if (searchType === 'book') {
      searchBooks(query);
    } else {
      searchMovies(query);
    }
  };

  const handleSelect = (result) => {
    onSelect({
      ...result,
      tags: [],
      dateAdded: new Date().toISOString(),
      review: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Search Books & Movies</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {searchType === 'movie' && showApiKeyInput && (
            <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
              <p className="text-sm mb-2">
                To search for movies, you need a free OMDb API key. Get one at:{' '}
                <a 
                  href="http://www.omdbapi.com/apikey.aspx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 underline"
                >
                  omdbapi.com
                </a>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={omdbApiKey}
                  onChange={(e) => setOmdbApiKey(e.target.value)}
                  placeholder="Enter your OMDb API key"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="px-4 py-2 rounded-lg transition"
                  style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            {['book', 'movie'].map(type => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`px-4 py-2 rounded-lg transition capitalize flex items-center gap-2 ${
                  searchType === type
                    ? ''
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                style={searchType === type ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
              >
                {type === 'book' ? <Book className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                {type}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search for ${searchType}s...`}
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </form>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-slate-400">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(result)}
                  className="bg-slate-700/30 border border-slate-600 rounded-lg p-3 hover:border-blue-500 transition cursor-pointer"
                >
                  {result.coverUrl && (
                    <img
                      src={result.coverUrl}
                      alt={result.title}
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{result.title}</h3>
                  {result.author && (
                    <p className="text-xs text-slate-400 truncate">{result.author}</p>
                  )}
                  {result.director && (
                    <p className="text-xs text-slate-400 truncate">{result.director}</p>
                  )}
                  {result.year && (
                    <p className="text-xs text-slate-500 mt-1">{result.year}</p>
                  )}
                </div>
              ))}
            </div>
          ) : query && !loading ? (
            <div className="text-center py-12 text-slate-400">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p>Search for {searchType}s to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BatchEditModal = ({ onClose, onApply, sampleItem, selectedItems = [] }) => {
  // per-field values and apply toggles
  const [type, setType] = useState(''); const [applyType, setApplyType] = useState(false);
  const [author, setAuthor] = useState(''); const [applyAuthor, setApplyAuthor] = useState(false);
  const [director, setDirector] = useState(''); const [applyDirector, setApplyDirector] = useState(false);
  const [year, setYear] = useState(''); const [applyYear, setApplyYear] = useState(false);
  const [rating, setRating] = useState(null); const [applyRating, setApplyRating] = useState(false);
  const [addTagsStr, setAddTagsStr] = useState(''); const [applyAddTags, setApplyAddTags] = useState(false);
  const [removeTagsStr, setRemoveTagsStr] = useState(''); const [applyRemoveTags, setApplyRemoveTags] = useState(false);
  const [dateRead, setDateRead] = useState(''); const [applyDateRead, setApplyDateRead] = useState(false);
  const [dateWatched, setDateWatched] = useState(''); const [applyDateWatched, setApplyDateWatched] = useState(false);

  // compute preview
  const preview = selectedItems.map(it => {
    const out = { before: it, after: { ...it } };
    if (applyType && type) out.after.type = type;
    if (applyAuthor && author) out.after.author = author;
    if (applyDirector && director) out.after.director = director;
    if (applyYear && year) out.after.year = year;
    if (applyRating && (rating !== null && rating !== undefined)) out.after.rating = rating;
    if (applyAddTags && addTagsStr) out.after.tags = Array.from(new Set([...(out.after.tags||[]), ...addTagsStr.split(',').map(s=>s.trim()).filter(Boolean)]));
    if (applyRemoveTags && removeTagsStr) out.after.tags = (out.after.tags||[]).filter(t => !removeTagsStr.split(',').map(s=>s.trim()).filter(Boolean).includes(t));
    if (applyDateRead && dateRead) out.after.dateRead = dateRead;
    if (applyDateWatched && dateWatched) out.after.dateWatched = dateWatched;
    return out;
  });

  const handleApply = () => {
    const changes = {};
    if (applyType) changes.type = type;
    if (applyAuthor) changes.author = author;
    if (applyDirector) changes.director = director;
    if (applyYear) changes.year = year;
    if (applyRating) changes.rating = rating;
    if (applyAddTags) changes.addTags = addTagsStr ? addTagsStr.split(',').map(s=>s.trim()).filter(Boolean) : [];
    if (applyRemoveTags) changes.removeTags = removeTagsStr ? removeTagsStr.split(',').map(s=>s.trim()).filter(Boolean) : [];
    if (applyDateRead) changes.dateRead = dateRead;
    if (applyDateWatched) changes.dateWatched = dateWatched;

    if (Object.keys(changes).length === 0) {
      alert('No fields selected to apply');
      return;
    }

    onApply(changes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Batch Edit Preview</h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'white' }}>Close</button>
            <button onClick={handleApply} className="px-3 py-1 rounded" style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}>Apply to {selectedItems.length} items</button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="text-sm text-slate-300">Select fields to apply</div>
            <div className="bg-slate-800 border border-slate-700 rounded p-3 space-y-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={applyType} onChange={(e)=>setApplyType(e.target.checked)} /> Type
                <select value={type} onChange={(e)=>setType(e.target.value)} className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded">
                  <option value="">(select)</option>
                  <option value="book">book</option>
                  <option value="movie">movie</option>
                </select>
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={applyAuthor} onChange={(e)=>setApplyAuthor(e.target.checked)} /> Author
                <input value={author} onChange={(e)=>setAuthor(e.target.value)} className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" placeholder="Author" />
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={applyDirector} onChange={(e)=>setApplyDirector(e.target.checked)} /> Director
                <input value={director} onChange={(e)=>setDirector(e.target.value)} className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" placeholder="Director" />
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={applyYear} onChange={(e)=>setApplyYear(e.target.checked)} /> Year
                <input value={year} onChange={(e)=>setYear(e.target.value)} className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" placeholder="Year" />
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={applyRating} onChange={(e)=>setApplyRating(e.target.checked)} /> Rating
                <select value={rating ?? ''} onChange={(e)=>setRating(e.target.value === '' ? null : parseInt(e.target.value,10))} className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded">
                  <option value="">(select)</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={applyAddTags} onChange={(e)=>setApplyAddTags(e.target.checked)} /> Add tags
                <input value={addTagsStr} onChange={(e)=>setAddTagsStr(e.target.value)} className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" placeholder="tag1, tag2" />
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={applyRemoveTags} onChange={(e)=>setApplyRemoveTags(e.target.checked)} /> Remove tags
                <input value={removeTagsStr} onChange={(e)=>setRemoveTagsStr(e.target.value)} className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" placeholder="tag1, tag2" />
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={applyDateRead} onChange={(e)=>setApplyDateRead(e.target.checked)} /> Date read
                <input type="date" value={dateRead} onChange={(e)=>setDateRead(e.target.value)} className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" />
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={applyDateWatched} onChange={(e)=>setApplyDateWatched(e.target.checked)} /> Date watched
                <input type="date" value={dateWatched} onChange={(e)=>setDateWatched(e.target.value)} className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-slate-300">Preview (before → after)</div>
            <div className="bg-slate-800 border border-slate-700 rounded p-3 max-h-[60vh] overflow-y-auto space-y-2">
              {preview.map((p, idx) => (
                <div key={idx} className="p-2 border-b border-slate-700 last:border-b-0">
                  <div className="text-sm font-medium">{p.before.title}</div>
                  <div className="text-xs text-slate-400">Before: {p.before.author || p.before.director || '-'} • {p.before.year || '-' } • {p.before.rating ? `${p.before.rating}★` : '-'}</div>
                  <div className="text-xs text-slate-200 mt-1">After: {p.after.author || p.after.director || '-'} • {p.after.year || '-'} • {p.after.rating ? `${p.after.rating}★` : '-'}</div>
                  {JSON.stringify(p.before) !== JSON.stringify(p.after) && (
                    <div className="text-xs text-yellow-300 mt-1">Will change</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ItemDetailModal = ({ item, onClose, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState({ ...item });

  const handleSave = () => {
    onSave(editedItem);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(item);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{item.title}</h2>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 rounded transition text-sm"
                  style={{ backgroundColor: 'rgba(255,0,0,0.16)', color: 'white' }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 rounded transition text-sm"
                  style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                >
                  Edit
                </button>
              </>
            ) : (
              <button
                onClick={handleSave}
                className="px-3 py-1 rounded transition text-sm flex items-center gap-1"
                style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {isEditing ? (
            <EditForm item={editedItem} onChange={setEditedItem} />
          ) : (
            <ViewDetails item={item} />
          )}
        </div>
      </div>
    </div>
  );
};

const AddEditModal = ({ onClose, onSave, initialItem = null }) => {
  const [item, setItem] = useState(initialItem || {
    title: '',
    type: 'book',
    author: '',
    director: '',
    actors: [],
    isbn: '',
    year: '',
    rating: 0,
    tags: [],
    coverUrl: '',
    dateRead: '',
    dateWatched: '',
    dateAdded: new Date().toISOString(),
    review: ''
  });

  const handleSave = () => {
    if (!item.title) {
      alert('Title is required');
      return;
    }
    onSave(item);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Add New Item</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <EditForm item={item} onChange={setItem} />
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg transition"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'white' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg transition flex items-center gap-2"
              style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
            >
              <Save className="w-4 h-4" />
              Save Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditForm = ({ item, onChange }) => {
  const [tagInput, setTagInput] = useState('');
  const [actorInput, setActorInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !item.tags.includes(tagInput.trim())) {
      onChange({ ...item, tags: [...item.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    onChange({ ...item, tags: item.tags.filter(t => t !== tag) });
  };

  const addActor = () => {
    if (actorInput.trim() && !item.actors.includes(actorInput.trim())) {
      onChange({ ...item, actors: [...item.actors, actorInput.trim()] });
      setActorInput('');
    }
  };

  const removeActor = (actor) => {
    onChange({ ...item, actors: item.actors.filter(a => a !== actor) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Type</label>
        <div className="flex gap-2">
          {['book', 'movie'].map(type => (
            <button
              key={type}
              onClick={() => onChange({ ...item, type })}
              className={`px-4 py-2 rounded-lg transition capitalize ${
                item.type === type
                  ? ''
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              style={item.type === type ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Title *</label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Enter title"
        />
      </div>

      {item.type === 'book' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Author</label>
            <input
              type="text"
              value={item.author || ''}
              onChange={(e) => onChange({ ...item, author: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter author name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">ISBN</label>
            <input
              type="text"
              value={item.isbn || ''}
              onChange={(e) => onChange({ ...item, isbn: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter ISBN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date read</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={item.dateRead || ''}
                onChange={(e) => onChange({ ...item, dateRead: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => onChange({ ...item, dateRead: '' })}
                className="px-3 py-2 rounded-lg transition text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }}
                title="Clear date"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}

      {item.type === 'movie' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Director</label>
            <input
              type="text"
              value={item.director || ''}
              onChange={(e) => onChange({ ...item, director: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter director name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Actors</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={actorInput}
                onChange={(e) => setActorInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (addActor(), e.preventDefault())}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Add actor"
              />
              <button
                onClick={addActor}
                className="px-4 py-2 rounded-lg transition"
                style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.actors.map((actor, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-600 rounded-full text-sm flex items-center gap-2"
                >
                  {actor}
                  <button onClick={() => removeActor(actor)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date watched</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={item.dateWatched || ''}
                onChange={(e) => onChange({ ...item, dateWatched: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => onChange({ ...item, dateWatched: '' })}
                className="px-3 py-2 rounded-lg transition text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }}
                title="Clear date"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Year</label>
        <input
          type="number"
          value={item.year || ''}
          onChange={(e) => onChange({ ...item, year: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Enter year"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              onClick={() => onChange({ ...item, rating })}
              className="transition"
            >
              <Star
                className={`w-8 h-8 ${
                  rating <= (item.rating || 0)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (addTag(), e.preventDefault())}
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Add tag"
          />
          <button
            onClick={addTag}
            className="px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-slate-600 rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button onClick={() => removeTag(tag)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Cover URL</label>
        <input
          type="text"
          value={item.coverUrl || ''}
          onChange={(e) => onChange({ ...item, coverUrl: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Enter cover image URL"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Review / Notes</label>
        <textarea
          value={item.review || ''}
          onChange={(e) => onChange({ ...item, review: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Write your review or notes here..."
        />
      </div>
    </div>
  );
};

const ViewDetails = ({ item }) => {
  return (
    <div className="space-y-4">
      {item.coverUrl && (
        <div className="flex justify-center mb-6">
          <img
            src={item.coverUrl}
            alt={item.title}
            className="max-w-xs rounded-lg shadow-lg"
          />
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {item.type === 'book' ? (
            <Book className="w-12 h-12 text-blue-400" />
          ) : (
            <Film className="w-12 h-12 text-purple-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm text-slate-400 uppercase tracking-wide mb-1">
            {item.type}
          </div>
          <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
          {item.author && (
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4" />
              <span>{item.author}</span>
            </div>
          )}
          {item.director && (
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4" />
              <span>Directed by {item.director}</span>
            </div>
          )}
        </div>
      </div>

      {item.actors && item.actors.length > 0 && (
        <div>
          <div className="text-sm font-medium text-slate-400 mb-2">Cast</div>
          <div className="flex flex-wrap gap-2">
            {item.actors.map((actor, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-slate-700 rounded-full text-sm"
              >
                {actor}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.isbn && (
        <div className="flex items-center gap-2 text-slate-300">
          <Hash className="w-4 h-4" />
          <span className="text-sm">ISBN: {item.isbn}</span>
        </div>
      )}

      {item.year && (
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Year: {item.year}</span>
        </div>
      )}

      {item.dateRead && (
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Read on {new Date(item.dateRead).toLocaleDateString()}</span>
        </div>
      )}

      {item.dateWatched && (
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Watched on {new Date(item.dateWatched).toLocaleDateString()}</span>
        </div>
      )}

      {item.rating && (
        <div>
          <div className="text-sm font-medium text-slate-400 mb-2">Rating</div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < item.rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div>
          <div className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-sm"
              style={{ backgroundColor: hexToRgba(highlightColor, 0.12), color: 'white', border: `1px solid ${hexToRgba(highlightColor, 0.12)}` }}
            >
              {tag}
            </span>
          ))}
          </div>
        </div>
      )}

      {item.review && (
        <div>
          <div className="text-sm font-medium text-slate-400 mb-2">Review / Notes</div>
          <div className="bg-slate-700/30 rounded-lg p-4 text-slate-300 whitespace-pre-wrap">
            {item.review}
          </div>
        </div>
      )}

      {item.dateAdded && (
        <div className="text-xs text-slate-500 mt-4">
          Added on {new Date(item.dateAdded).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default MediaTracker;