import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Tag input component with auto-suggest functionality
 */
const TagInput = ({ value, onChange, onAdd, existingTags = [], allTags = [], placeholder = "Add tag" }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Filter suggestions based on input value
  const suggestions = value.trim() 
    ? allTags.filter(tag => 
        !existingTags.includes(tag) && 
        tag.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8) // Limit to 8 suggestions
    : [];

  // Show suggestions when there's input and matches
  useEffect(() => {
    setShowSuggestions(value.trim() !== '' && suggestions.length > 0);
  }, [value, suggestions.length]);

  // Reset focused index when suggestions change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [suggestions.length]);

  // Reset focused index when input value changes (user is typing)
  useEffect(() => {
    setFocusedIndex(-1);
  }, [value]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    // If there are no suggestions available, always add the typed text
    if (suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onAdd();
      }
      return;
    }

    // If suggestions are available, handle navigation
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          // User explicitly focused a suggestion, select it
          handleSelectSuggestion(suggestions[focusedIndex]);
        } else {
          // No suggestion focused, add what's currently typed
          onAdd();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSelectSuggestion = (tag) => {
    onChange({ target: { value: tag } });
    // Immediately add the tag
    onAdd(tag);
    setShowSuggestions(false);
    setFocusedIndex(-1);
  };

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.trim() !== '' && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
        placeholder={placeholder}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((tag, index) => (
            <button
              key={tag}
              onClick={() => handleSelectSuggestion(tag)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={`w-full px-3 py-2 text-left hover:bg-slate-600 transition ${
                index === focusedIndex ? 'bg-slate-600' : ''
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;
