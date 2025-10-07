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
    dateRead: getTodayDate(),
    dateWatched: getTodayDate(),
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

export default AddEditModal;