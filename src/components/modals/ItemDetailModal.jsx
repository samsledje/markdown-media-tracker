import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import EditForm from '../forms/EditForm.jsx';
import ViewDetails from '../cards/ViewDetails.jsx';

/**
 * Modal for viewing and editing item details
 */
const ItemDetailModal = ({ item, onClose, onSave, onDelete, hexToRgba, highlightColor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState({ ...item });

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
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isEditing, editedItem]);

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