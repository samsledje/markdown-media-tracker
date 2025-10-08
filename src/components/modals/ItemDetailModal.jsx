import React, { useState, useEffect, useRef } from 'react';
import { X, Save, ChevronDown, Edit, Trash2 } from 'lucide-react';
import EditForm from '../forms/EditForm.jsx';
import ViewDetails from '../cards/ViewDetails.jsx';
import { STATUS_TYPES } from '../../constants/index.js';
import { STATUS_LABELS, STATUS_ICONS, STATUS_COLORS } from '../../constants/index.js';
import { Bookmark, BookOpen, CheckCircle, PlayCircle, Layers } from 'lucide-react';

/**
 * Modal for viewing and editing item details
 */
const ItemDetailModal = ({ item, onClose, onSave, onDelete, onQuickSave, hexToRgba, highlightColor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
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
    onDelete(item);
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
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (isEditing) {
          e.preventDefault();
          handleSave();
        }
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
                className="px-3 py-2 sm:py-1 rounded transition text-sm flex items-center gap-1 min-h-[44px] sm:min-h-auto"
                style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
              >
                <Save className="w-4 h-4" />
                Save
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
                item={item} 
                hexToRgba={hexToRgba} 
                highlightColor={highlightColor} 
              />
            </div>
          )}
          
          {/* Status switcher in bottom right corner */}
          {editedItem && editedItem.status && (
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
      </div>
    </div>
  );
};

export default ItemDetailModal;