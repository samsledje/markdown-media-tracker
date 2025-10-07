import React, { useState, useEffect } from 'react';
import { X, Search, Book, Film } from 'lucide-react';
import { searchBooks } from '../../services/openLibraryService.js';
import { searchMovies } from '../../services/omdbService.js';

/**
 * Modal for searching books and movies online
 */
const SearchModal = ({ onClose, onSelect, omdbApiKey, setOmdbApiKey }) => {
  const [searchType, setSearchType] = useState('book');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

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
    if (!omdbApiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setLoading(true);
    try {
      const movies = await searchMovies(searchQuery, omdbApiKey);
      setResults(movies);
    } catch (error) {
      console.error('Error searching movies:', error);
      if (error.message.includes('Invalid OMDb API key')) {
        setShowApiKeyInput(true);
      }
      alert(error.message);
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
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [query, searchType, omdbApiKey]);

  const handleSelect = (result) => {
    onSelect({
      ...result,
      tags: [],
      dateAdded: new Date().toISOString(),
      review: ''
    });
  };

  const handleSaveApiKey = () => {
    if (setOmdbApiKey) {
      setOmdbApiKey(omdbApiKey);
    }
    setShowApiKeyInput(false);
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
                  onChange={(e) => setOmdbApiKey && setOmdbApiKey(e.target.value)}
                  placeholder="Enter your OMDb API key"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSaveApiKey}
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

export default SearchModal;