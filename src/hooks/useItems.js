import { useState, useEffect } from 'react';
import { loadItemsFromDirectory, saveItemToFile, moveItemToTrash, restoreItemFromTrash, selectDirectory } from '../utils/fileUtils.js';

/**
 * Custom hook for managing items (books/movies)
 * @returns {object} Items state and actions
 */
export const useItems = () => {
  const [items, setItems] = useState([]);
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [undoStack, setUndoStack] = useState([]);

  /**
   * Load items from directory
   */
  const loadItems = async (handle = directoryHandle) => {
    if (!handle) return;
    
    try {
      const loadedItems = await loadItemsFromDirectory(handle);
      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading items:', error);
      alert(`Error loading items: ${error.message}`);
    }
  };

  /**
   * Save an item
   */
  const saveItem = async (item) => {
    if (!directoryHandle) {
      throw new Error('Please select a directory first');
    }

    try {
      await saveItemToFile(item, directoryHandle);
      await loadItems();
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  };

  /**
   * Delete an item (move to trash)
   */
  const deleteItem = async (item) => {
    if (!directoryHandle) {
      throw new Error('Please select a directory first');
    }

    try {
      const undoInfo = await moveItemToTrash(item, directoryHandle);
      setUndoStack(prev => [...prev, undoInfo]);
      await loadItems();
      return undoInfo;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  };

  /**
   * Delete multiple items
   */
  const deleteItems = async (itemsToDelete) => {
    if (!directoryHandle) {
      throw new Error('Please select a directory first');
    }

    const undoInfos = [];
    for (const item of itemsToDelete) {
      try {
        const undoInfo = await moveItemToTrash(item, directoryHandle);
        undoInfos.push(undoInfo);
      } catch (error) {
        console.error('Error deleting item:', item.title, error);
      }
    }

    if (undoInfos.length > 0) {
      setUndoStack(prev => [...prev, ...undoInfos]);
      await loadItems();
    }

    return undoInfos;
  };

  /**
   * Undo last delete operation
   */
  const undoLastDelete = async () => {
    if (!directoryHandle || undoStack.length === 0) {
      return null;
    }

    const lastUndo = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    try {
      const restoredFilename = await restoreItemFromTrash(lastUndo, directoryHandle);
      await loadItems();
      return restoredFilename;
    } catch (error) {
      console.error('Error undoing delete:', error);
      // Put the undo back on the stack if restore failed
      setUndoStack(prev => [...prev, lastUndo]);
      throw error;
    }
  };

  /**
   * Select a new directory
   */
  const selectNewDirectory = async () => {
    try {
      const handle = await selectDirectory();
      setDirectoryHandle(handle);
      await loadItems(handle);
      return handle;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error selecting directory:', error);
        throw error;
      }
    }
  };

  /**
   * Apply batch edits to multiple items
   */
  const applyBatchEdit = async (selectedIds, changes) => {
    if (!directoryHandle) {
      throw new Error('Please select a directory first');
    }

    const updated = [];
    for (const id of selectedIds) {
      const item = items.find(i => i.id === id);
      if (!item) continue;

      const newItem = { ...item };

      // Apply only fields present in changes (non-empty)
      if (changes.type) newItem.type = changes.type;
      if (changes.author) newItem.author = changes.author;
      if (changes.director) newItem.director = changes.director;
      if (changes.year) newItem.year = changes.year;
      if (changes.rating !== null && changes.rating !== undefined) newItem.rating = changes.rating;
      if (changes.addTags && changes.addTags.length) {
        newItem.tags = Array.from(new Set([...(newItem.tags || []), ...changes.addTags]));
      }
      if (changes.removeTags && changes.removeTags.length) {
        newItem.tags = (newItem.tags || []).filter(t => !changes.removeTags.includes(t));
      }
      if (changes.dateRead) newItem.dateRead = changes.dateRead;
      if (changes.dateWatched) newItem.dateWatched = changes.dateWatched;

      try {
        await saveItemToFile(newItem, directoryHandle);
        updated.push(newItem.id);
      } catch (error) {
        console.error('Error updating item:', item.title, error);
      }
    }

    if (updated.length > 0) {
      await loadItems();
    }

    return updated;
  };

  return {
    items,
    directoryHandle,
    undoStack: undoStack.length,
    loadItems,
    saveItem,
    deleteItem,
    deleteItems,
    undoLastDelete,
    selectNewDirectory,
    applyBatchEdit
  };
};