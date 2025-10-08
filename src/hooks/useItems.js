import { useState, useEffect } from 'react';
import { StorageFactory } from '../services/storageAdapter.js';
import { toast } from '../services/toastService.js';

/**
 * Custom hook for managing items (books/movies) with storage adapter pattern
 * @returns {object} Items state and actions
 */
export const useItems = () => {
  const [items, setItems] = useState([]);
  const [storageAdapter, setStorageAdapter] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Initialize storage adapter
   */
  const initializeStorage = async (preferredType = null) => {
    try {
      setIsLoading(true);
      const adapter = await StorageFactory.createAdapter(preferredType);
      await adapter.initialize();
      setStorageAdapter(adapter);
      return adapter;
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load items from storage
   */
  const loadItems = async (adapter = storageAdapter) => {
    if (!adapter || !adapter.isConnected()) return;
    
    try {
      setIsLoading(true);
      const loadedItems = await adapter.loadItems();
      setItems(loadedItems);
      setStorageInfo(adapter.getStorageInfo());
    } catch (error) {
      console.error('Error loading items:', error);
      toast(`Error loading items: ${error.message}`, { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save an item
   */
  const saveItem = async (item) => {
    if (!storageAdapter || !storageAdapter.isConnected()) {
      throw new Error('Please connect to a storage location first');
    }

    try {
      setIsLoading(true);
      await storageAdapter.saveItem(item);
      await loadItems();
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete an item (move to trash)
   */
  const deleteItem = async (item) => {
    if (!storageAdapter || !storageAdapter.isConnected()) {
      throw new Error('Please connect to a storage location first');
    }

    try {
      setIsLoading(true);
      const undoInfo = await storageAdapter.deleteItem(item);
      setUndoStack(prev => [...prev, undoInfo]);
      await loadItems();
      return undoInfo;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete multiple items
   */
  const deleteItems = async (itemsToDelete) => {
    if (!storageAdapter || !storageAdapter.isConnected()) {
      throw new Error('Please connect to a storage location first');
    }

    setIsLoading(true);
    const undoInfos = [];
    for (const item of itemsToDelete) {
      try {
        const undoInfo = await storageAdapter.deleteItem(item);
        undoInfos.push(undoInfo);
      } catch (error) {
        console.error('Error deleting item:', item.title, error);
      }
    }

    if (undoInfos.length > 0) {
      setUndoStack(prev => [...prev, ...undoInfos]);
      await loadItems();
    }
    
    setIsLoading(false);
    return undoInfos;
  };

  /**
   * Undo last delete operation
   */
  const undoLastDelete = async () => {
    if (!storageAdapter || !storageAdapter.isConnected() || undoStack.length === 0) {
      return null;
    }

    const lastUndo = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    try {
      setIsLoading(true);
      const restoredIdentifier = await storageAdapter.restoreItem(lastUndo);
      await loadItems();
      return restoredIdentifier;
    } catch (error) {
      console.error('Error undoing delete:', error);
      // Put the undo back on the stack if restore failed
      setUndoStack(prev => [...prev, lastUndo]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Select a new storage location
   */
  const selectStorage = async (storageType = null) => {
    try {
      setIsLoading(true);
      let adapter = storageAdapter;
      
      if (!adapter || (storageType && adapter.getStorageType() !== storageType)) {
        adapter = await StorageFactory.createAdapter(storageType);
        await adapter.initialize();
        setStorageAdapter(adapter);
      }
      
      const storageHandle = await adapter.selectStorage();
      await loadItems(adapter);
      return storageHandle;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error selecting storage:', error);
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disconnect from current storage
   */
  const disconnectStorage = async () => {
    if (storageAdapter) {
      await storageAdapter.disconnect();
      setStorageAdapter(null);
      setStorageInfo(null);
      setItems([]);
      setUndoStack([]);
    }
  };

  /**
   * Get available storage options
   */
  const getAvailableStorageOptions = async () => {
    return await StorageFactory.getAvailableAdapters();
  };

  /**
   * Apply batch edits to multiple items
   */
  const applyBatchEdit = async (selectedIds, changes) => {
    if (!storageAdapter || !storageAdapter.isConnected()) {
      throw new Error('Please connect to a storage location first');
    }

    setIsLoading(true);
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
        await storageAdapter.saveItem(newItem);
        updated.push(newItem.id);
      } catch (error) {
        console.error('Error updating item:', item.title, error);
      }
    }

    if (updated.length > 0) {
      await loadItems();
    }
    
    setIsLoading(false);
    return updated;
  };

  return {
    items,
    storageAdapter,
    storageInfo,
    isLoading,
    undoStack: undoStack.length,
    initializeStorage,
    loadItems,
    saveItem,
    deleteItem,
    deleteItems,
    undoLastDelete,
    selectStorage,
    disconnectStorage,
    getAvailableStorageOptions,
    applyBatchEdit
  };
};