import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Book, Film } from 'lucide-react';
import { searchBooks } from '../../services/openLibraryService.js';
import { searchMovies, isServiceAvailable } from '../../services/omdbService.js';
import { KEYBOARD_SHORTCUTS } from '../../constants/index.js';

/**
 * Modal for searching books and movies online
 */
const SearchModal = ({ onClose, onSelect }) => {
  const [searchType, setSearchType] = useState('book');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);
  const searchInputRef = useRef(null);

  const handleSearchBooks = async (searchQuery) => {
    setLoading(true);
    try {
      const books = await searchBooks(searchQuery);
      setResults(books);
    } catch (error) {
      console.error('Error searching books:', error);
      alert(error.message);
    }
    setLoading(false);
  };

  const handleSearchMovies = async (searchQuery) => {
    if (!isServiceAvailable()) {
      setShowApiKeyWarning(true);
      return;
    }

    setLoading(true);
    try {
      const movies = await searchMovies(searchQuery);
      setResults(movies);
      setShowApiKeyWarning(false);
    } catch (error) {
      console.error('Error searching movies:', error);
      if (error.message === 'API_KEY_MISSING' || error.message.includes('Invalid OMDb API key')) {
        setShowApiKeyWarning(true);
      }
      alert(error.message === 'API_KEY_MISSING' ? 'Please configure your OMDb API key first.' : error.message);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    if (searchType === 'book') {
      handleSearchBooks(query);
    } else {
      handleSearchMovies(query);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (query.trim()) handleSearch({ preventDefault: () => {} });
      }
      
      // Focus search input with / key or Ctrl/Cmd+K (like main app)
      if ((e.key === '/' && !e.ctrlKey && !e.metaKey) || 
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        if (document.activeElement !== searchInputRef.current) {
          e.preventDefault();
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }
      }
      
      // Don't handle shortcuts while typing
      if (e.target.tagName === 'INPUT') return;
      
      // Switch to books: B
      if (e.key.toLowerCase() === KEYBOARD_SHORTCUTS.FILTER_BOOKS) {
        e.preventDefault();
        setSearchType('book');
        return;
      }
      
      // Switch to movies: M  
      if (e.key.toLowerCase() === KEYBOARD_SHORTCUTS.FILTER_MOVIES) {
        e.preventDefault();
        setSearchType('movie');
        return;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [query, searchType]);

  const handleSelect = (result) => {
    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    };

    // Only set the appropriate date field based on the item type
    const dateFields = result.type === 'movie' 
      ? { dateWatched: getTodayDate() }
      : { dateRead: getTodayDate() };

    onSelect({
      ...result,
      rating: 0,
      tags: [],
      ...dateFields,
      dateAdded: new Date().toISOString(),
      review: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full h-full sm:max-w-4xl sm:w-full sm:max-h-[90vh] sm:h-auto overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold">Search Books & Movies</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {searchType === 'movie' && showApiKeyWarning && (
            <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
              <p className="text-sm text-yellow-200 leading-mobile">
                ⚠️ OMDb API key required for movie searches. Please configure your API key in the main interface first.
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            {['book', 'movie'].map(type => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-lg transition capitalize flex items-center justify-center gap-2 min-h-[44px] ${
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

          <form onSubmit={handleSearch} className="space-y-3 sm:space-y-0 sm:flex sm:gap-2">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search for ${searchType}s...`}
              className="w-full px-4 py-3 sm:py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-base"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
              style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </form>
        </div>

        <div className="p-4 pb-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-slate-400">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(result)}
                  className="bg-slate-700/30 border border-slate-600 rounded-lg p-3 hover:border-blue-500 transition cursor-pointer touch-manipulation"
                >
                  {result.coverUrl && (
                    <img
                      src={result.coverUrl}
                      alt={result.title}
                      className="w-full h-40 sm:h-48 object-cover rounded mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2 leading-mobile">{result.title}</h3>
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

export default SearchModal;