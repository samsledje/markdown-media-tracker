import React, { useState, useEffect, useRef } from 'react';
import { Book, Film, Search, Plus, Star, Tag, Calendar, User, Hash, X, FolderOpen, Save, ChevronDown, ChevronUp, Maximize } from 'lucide-react';

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
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [omdbApiKey, setOmdbApiKey] = useState('');
  const filtersRef = useRef(null);
  const filterButtonRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [cardSize, setCardSize] = useState(() => {
    return localStorage.getItem('cardSize') || 'medium';
  });
  
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

  const deleteItem = async (item) => {
    if (!directoryHandle) {
      alert('Please select a directory first');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      await directoryHandle.removeEntry(item.filename);
      await loadItemsFromDirectory(directoryHandle);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Error deleting file. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  <FolderOpen className="w-4 h-4" />
                  Select Directory
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsSearching(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
                  >
                    <Search className="w-4 h-4" />
                    Search Online
                  </button>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Manually
                  </button>
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
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-lg"
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">Sort:</label>
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
              <button
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition flex items-center gap-2"
              >
                Filters
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm"
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
                          className={`px-3 py-1 rounded-lg ${filterRating === 0 ? 'bg-blue-600' : 'bg-slate-700/50'}`}
                        >
                          Any
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
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'any' ? 'bg-blue-600' : 'bg-slate-700/50'}`}
                        >
                          Any
                        </button>
                        <button
                          onClick={() => setFilterRecent('last7')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'last7' ? 'bg-blue-600' : 'bg-slate-700/50'}`}
                        >
                          Last 7 days
                        </button>
                        <button
                          onClick={() => setFilterRecent('last30')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'last30' ? 'bg-blue-600' : 'bg-slate-700/50'}`}
                        >
                          Last 30 days
                        </button>
                        <button
                          onClick={() => setFilterRecent('last90')}
                          className={`px-3 py-1 rounded-lg ${filterRecent === 'last90' ? 'bg-blue-600' : 'bg-slate-700/50'}`}
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
                              className={`px-3 py-1 rounded-full text-sm transition ${filterTags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
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
                    onClick={() => setFilterRating(0)}
                    className={`px-3 py-1 rounded-lg ${filterRating === 0 ? 'bg-blue-600' : 'bg-slate-700/50'}`}
                  >
                    Any
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
                    className={`px-3 py-1 rounded-lg ${filterRecent === 'any' ? 'bg-blue-600' : 'bg-slate-700/50'}`}
                  >
                    Any
                  </button>
                  <button
                    onClick={() => setFilterRecent('last7')}
                    className={`px-3 py-1 rounded-lg ${filterRecent === 'last7' ? 'bg-blue-600' : 'bg-slate-700/50'}`}
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => setFilterRecent('last30')}
                    className={`px-3 py-1 rounded-lg ${filterRecent === 'last30' ? 'bg-blue-600' : 'bg-slate-700/50'}`}
                  >
                    Last 30 days
                  </button>
                  <button
                    onClick={() => setFilterRecent('last90')}
                    className={`px-3 py-1 rounded-lg ${filterRecent === 'last90' ? 'bg-blue-600' : 'bg-slate-700/50'}`}
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
                        className={`px-3 py-1 rounded-full text-sm transition ${filterTags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                      >
                        {tag}
                      </button>
                    ))
                  )}
                </div>
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
            {sortedItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`bg-slate-700/30 border border-slate-600 rounded-lg overflow-hidden hover:border-blue-500 transition cursor-pointer ${
                  cardSize === 'tiny' ? 'text-xs' : cardSize === 'small' ? '' : cardSize === 'large' ? 'text-base' : cardSize === 'xlarge' ? 'text-lg' : ''
                }`}
              >
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
                          className="text-xs px-2 py-1 bg-slate-600/50 rounded"
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
            ))}
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
      {/* Floating card size control pinned to bottom-right */}
      <div className="fixed z-50 bottom-6 right-6">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-full p-3 shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Maximize className="w-5 h-5 text-slate-300" />
          </div>
          {/* Slider mapping 0..4 to size presets */}
          <div className="flex items-center gap-3">
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
              className="h-2 w-40 accent-blue-600"
              aria-label="Card size"
            />
            <div className="px-2 py-1 rounded text-sm bg-slate-700/40 text-slate-200">
              {cardSize === 'tiny' ? 'Tiny' : cardSize === 'small' ? 'Small' : cardSize === 'medium' ? 'Medium' : cardSize === 'large' ? 'Large' : 'XLarge'}
            </div>
          </div>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
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
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
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
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition text-sm"
                >
                  Edit
                </button>
              </>
            ) : (
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded transition text-sm flex items-center gap-1"
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
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center gap-2"
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
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
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
                className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm"
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
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
                className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm"
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
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
                className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-sm text-blue-300"
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