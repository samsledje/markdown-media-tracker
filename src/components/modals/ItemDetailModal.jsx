import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import EditForm from '../forms/EditForm.jsx';
import ViewDetails from '../cards/ViewDetails.jsx';

/**
 * Modal for viewing and editing item details
 */
const ItemDetailModal = ({ item, onClose, onSave, onDelete, hexToRgba, highlightColor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState({ ...item });
  const modalRef = useRef(null);

  const handleSave = () => {
    onSave(editedItem);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(item);
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
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold truncate mr-4">{item.title}</h2>
          <div className="flex gap-2 flex-shrink-0">
            {!isEditing ? (
              <>
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 sm:py-1 rounded transition text-sm min-h-[44px] sm:min-h-auto"
                  style={{ backgroundColor: 'rgba(255,0,0,0.16)', color: 'white' }}
                >
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Del</span>
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 sm:py-1 rounded transition text-sm min-h-[44px] sm:min-h-auto"
                  style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
                >
                  Edit
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
        
        <div className="p-4 sm:p-6 pb-6">
          {isEditing ? (
            <EditForm item={editedItem} onChange={setEditedItem} />
          ) : (
            <ViewDetails 
              item={item} 
              hexToRgba={hexToRgba} 
              highlightColor={highlightColor} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;