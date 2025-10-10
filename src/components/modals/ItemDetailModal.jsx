import React, { useState, useEffect, useRef } from 'react';
import { X, Save, ChevronDown, Edit, Trash2, Star } from 'lucide-react';
import EditForm from '../forms/EditForm.jsx';
import ViewDetails from '../cards/ViewDetails.jsx';
import { STATUS_TYPES, KEYBOARD_SHORTCUTS } from '../../constants/index.js';
import { STATUS_LABELS, STATUS_ICONS, STATUS_COLORS } from '../../constants/index.js';
import { Bookmark, BookOpen, CheckCircle, PlayCircle, Layers } from 'lucide-react';
import { fetchCoverForItem } from '../../utils/coverUtils.js';
import { toast } from '../../services/toastService.js';

/**
 * Modal for viewing and editing item details
 */
const ItemDetailModal = ({ item, onClose, onSave, onDelete, onQuickSave, hexToRgba, highlightColor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isFetchingCover, setIsFetchingCover] = useState(false);
  
  // Ensure item has a status when creating editedItem
  const [editedItem, setEditedItem] = useState(() => {
    const defaultStatus = item.type === 'book' ? STATUS_TYPES.BOOK.READ : STATUS_TYPES.MOVIE.WATCHED;
    return {
      ...item,
      status: item.status || defaultStatus
    };
  });
  
  const modalRef = useRef(null);

  // Update editedItem when item prop changes
  useEffect(() => {
    const defaultStatus = item.type === 'book' ? STATUS_TYPES.BOOK.READ : STATUS_TYPES.MOVIE.WATCHED;
    const finalStatus = item.status || defaultStatus;
    
    setEditedItem({
      ...item,
      status: finalStatus
    });
  }, [item]);

  const handleSave = () => {
    onSave(editedItem);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(item);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleQuickStatusChange = (newStatus) => {
    // Save immediately and update local editedItem so UI updates
    const updated = { ...editedItem, status: newStatus };
    setEditedItem(updated);
    // Persist change via onQuickSave if provided, otherwise use onSave
    if (typeof onQuickSave === 'function') {
      onQuickSave(updated);
    } else {
      onSave(updated);
    }
    setShowStatusMenu(false);
  };

  const handleQuickRatingChange = (newRating) => {
    // If clicking on the same star that's currently the rating, toggle to unrated (0)
    const finalRating = editedItem.rating === newRating ? 0 : newRating;
    const updated = { ...editedItem, rating: finalRating };
    setEditedItem(updated);
    // Persist change via onQuickSave if provided, otherwise use onSave
    if (typeof onQuickSave === 'function') {
      onQuickSave(updated);
    } else {
      onSave(updated);
    }
  };

  const handleFetchCover = async () => {
    setIsFetchingCover(true);
    try {
      const coverUrl = await fetchCoverForItem(editedItem);
      
      if (coverUrl) {
        const updated = { ...editedItem, coverUrl };
        setEditedItem(updated);
        
        // Persist the change
        if (typeof onQuickSave === 'function') {
          onQuickSave(updated);
        } else {
          onSave(updated);
        }
        
        toast('Cover image found and added!', { type: 'success' });
      } else {
        toast('No cover image found. Try adding one manually.', { type: 'info' });
      }
    } catch (error) {
      console.error('Error fetching cover:', error);
      
      // Handle specific error types
      if (error.message === 'API_KEY_MISSING') {
        toast('OMDb API key required for movie covers. Please configure in settings.', { type: 'error' });
      } else if (error.name === 'OpenLibraryError' || error.name === 'OMDBError') {
        toast(`Unable to fetch cover: ${error.message}`, { type: 'error' });
      } else {
        toast('Error fetching cover image. Please try again.', { type: 'error' });
      }
    } finally {
      setIsFetchingCover(false);
    }
  };

  const getIconForStatus = (status, className = '') => {
    const iconType = STATUS_ICONS[status];
    switch (iconType) {
      case 'bookmark':
        return <Bookmark className={className} />;
      case 'book-open':
        return <BookOpen className={className} />;
      case 'check-circle':
        return <CheckCircle className={className} />;
      case 'play-circle':
        return <PlayCircle className={className} />;
      case 'layers':
        return <Layers className={className} />;
      default:
        return <Bookmark className={className} />;
    }
  };

  const getColorForStatus = (status) => {
    const color = STATUS_COLORS[status];
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-slate-700';
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (isEditing) {
          e.preventDefault();
          handleSave();
        }
        return;
      }

      // Don't run shortcuts while typing in inputs/textareas
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // Quick status changes (U/I/O)
      if (!isEditing) {
        const statusOptions = editedItem.type === 'book' ? Object.values(STATUS_TYPES.BOOK) : Object.values(STATUS_TYPES.MOVIE);
        
        if (e.key.toLowerCase() === KEYBOARD_SHORTCUTS.STATUS_TO_READ_WATCH) {
          e.preventDefault();
          handleQuickStatusChange(statusOptions[0]); // To Read/Watch
          return;
        }
        if (e.key.toLowerCase() === KEYBOARD_SHORTCUTS.STATUS_IN_PROGRESS) {
          e.preventDefault();
          handleQuickStatusChange(statusOptions[1]); // Reading/Watching
          return;
        }
        if (e.key.toLowerCase() === KEYBOARD_SHORTCUTS.STATUS_COMPLETED) {
          e.preventDefault();
          handleQuickStatusChange(statusOptions[2]); // Read/Watched
          return;
        }
      }

      // Quick rating changes (0-5)
      if (!isEditing && [KEYBOARD_SHORTCUTS.RATING_CLEAR, KEYBOARD_SHORTCUTS.RATING_1, KEYBOARD_SHORTCUTS.RATING_2, 
                         KEYBOARD_SHORTCUTS.RATING_3, KEYBOARD_SHORTCUTS.RATING_4, KEYBOARD_SHORTCUTS.RATING_5].includes(e.key)) {
        e.preventDefault();
        const rating = parseInt(e.key);
        handleQuickRatingChange(rating);
        return;
      }

      // Toggle edit mode (E)
      if (e.key.toLowerCase() === KEYBOARD_SHORTCUTS.EDIT_MODE) {
        e.preventDefault();
        if (isEditing) {
          handleSave();
        } else {
          setIsEditing(true);
        }
        return;
      }

      // Delete item (D)
      if (!isEditing && e.key.toLowerCase() === KEYBOARD_SHORTCUTS.DELETE_ITEM) {
        e.preventDefault();
        handleDelete();
        return;
      }
    };

    const onClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [isEditing, editedItem, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div 
        ref={modalRef}
        className="bg-slate-800 border border-slate-700 rounded-lg w-full h-full sm:max-w-2xl sm:w-full sm:max-h-[90vh] sm:h-auto overflow-y-auto"
      >
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold truncate flex-1">{item.title}</h2>
          </div>
          {/* Right-side controls: action buttons only */}
          <div className="flex gap-2 flex-shrink-0">
            {!isEditing ? (
              <>
                <button
                  onClick={handleDelete}
                  className="p-2 sm:p-1 rounded transition min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,0,0,0.16)', color: 'white' }}
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 sm:p-1 rounded transition min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
                  style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                  title="Edit"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={handleSave}
                className="p-2 sm:p-1 rounded transition min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
                style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                title="Save"
              >
                <Save className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 sm:p-1 hover:bg-slate-700 rounded transition min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 pb-6 relative">
          {isEditing ? (
            <EditForm item={editedItem} onChange={setEditedItem} />
          ) : (
            <div className="relative">
              <ViewDetails 
                item={editedItem} 
                hexToRgba={hexToRgba} 
                highlightColor={highlightColor} 
                hideRating={true}
                onFetchCover={handleFetchCover}
                isFetchingCover={isFetchingCover}
              />
            </div>
          )}

          {/* Quick rating at bottom - only show when not editing */}
          {!isEditing && (
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => handleQuickRatingChange(rating)}
                    className="transition"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating <= (editedItem.rating || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Status switcher in bottom right corner - only show when not editing */}
          {!isEditing && editedItem && editedItem.status && (
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
              <div className="relative flex items-center gap-2">
                <div className={`flex items-center justify-center rounded-full p-2 text-white ${getColorForStatus(editedItem.status)} shadow-lg w-10 h-10`} title={STATUS_LABELS[editedItem.status]}>
                  {getIconForStatus(editedItem.status, 'w-5 h-5')}
                </div>
                <div className="relative z-[100]">
                  <button
                    onClick={() => setShowStatusMenu(v => !v)}
                    className="p-2 rounded bg-slate-700/40 hover:bg-slate-700/60 shadow-lg"
                    title="Quick change status"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showStatusMenu && (
                    <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 z-[200] pointer-events-auto">
                      {(editedItem.type === 'book' ? Object.values(STATUS_TYPES.BOOK) : Object.values(STATUS_TYPES.MOVIE)).map(status => (
                        <button
                          key={status}
                          onClick={() => handleQuickStatusChange(status)}
                          className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-slate-700/50 ${editedItem.status === status ? 'bg-slate-700/60' : ''}`}
                        >
                          <div className={`flex items-center justify-center rounded-full p-2 text-white ${getColorForStatus(status)}`}>
                            {getIconForStatus(status, 'w-4 h-4')}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{STATUS_LABELS[status]}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[300]">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4">Delete Item</h3>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete "{item.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded transition text-sm text-white"
                  style={{ backgroundColor: 'rgba(255,0,0,0.8)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetailModal;