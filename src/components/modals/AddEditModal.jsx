import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import EditForm from '../forms/EditForm.jsx';

/**
 * Modal for adding new items
 */
const AddEditModal = ({ onClose, onSave, initialItem = null }) => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if this is from search results
  const fromSearch = initialItem && (initialItem.dateAdded && initialItem.dateAdded !== '');

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
    // Only set appropriate date based on type, not both
    ...(initialItem?.type === 'movie' 
      ? { dateWatched: getTodayDate() } 
      : { dateRead: getTodayDate() }
    ),
    dateAdded: new Date().toISOString(),
    review: ''
  });

  // Update item when initialItem changes
  useEffect(() => {
    if (initialItem) {
      setItem(initialItem);
    }
  }, [initialItem]);

  const handleSave = () => {
    if (!item.title) {
      alert('Title is required');
      return;
    }
    onSave(item);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [item]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full h-full sm:max-w-2xl sm:w-full sm:max-h-[90vh] sm:h-auto overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold">Add New Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 pb-6">
          <EditForm item={item} onChange={setItem} fromSearch={fromSearch} />
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg transition min-h-[44px] order-2 sm:order-1"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'white' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg transition flex items-center justify-center gap-2 min-h-[44px] order-1 sm:order-2"
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

export default AddEditModal;