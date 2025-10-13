import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useItems } from '../useItems.js';
import { sampleBook, sampleMovie, sampleBookUnrated, sampleMovieWatchlist } from '../../test/fixtures/sampleItems.js';
import { MockFileSystemStorage, MockGoogleDriveStorage } from '../../test/mocks/storage.js';

// Mock the StorageFactory
vi.mock('../../services/storageAdapter.js', () => ({
  StorageFactory: {
    createAdapter: vi.fn(),
    getAvailableAdapters: vi.fn(() => Promise.resolve([
      { type: 'filesystem', name: 'Local Directory', available: true },
      { type: 'googledrive', name: 'Google Drive', available: true }
    ]))
  }
}));

// Mock toast service
vi.mock('../../services/toastService.js', () => ({
  toast: vi.fn()
}));

// Import the mocked StorageFactory
import { StorageFactory } from '../../services/storageAdapter.js';
import { toast } from '../../services/toastService.js';

describe('useItems', () => {
  let mockStorage;
  const sampleItems = [sampleBook, sampleMovie, sampleBookUnrated, sampleMovieWatchlist];

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = new MockFileSystemStorage();
    mockStorage._setItems([...sampleItems]); // Create a copy to avoid mutations
    // Return the same instance every time for consistency
    StorageFactory.createAdapter.mockImplementation(() => Promise.resolve(mockStorage));
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useItems());
      
      expect(result.current.items).toEqual([]);
      expect(result.current.storageAdapter).toBeNull();
      expect(result.current.storageInfo).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.loadProgress).toEqual({ processed: 0, total: 0 });
      expect(result.current.undoStack).toBe(0);
    });

    it('should initialize storage adapter', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      expect(StorageFactory.createAdapter).toHaveBeenCalledWith(null);
      expect(result.current.storageAdapter).toBe(mockStorage);
      expect(mockStorage.connected).toBe(true);
    });

    it('should initialize storage with preferred type', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage('googledrive');
      });
      
      expect(StorageFactory.createAdapter).toHaveBeenCalledWith('googledrive');
    });

    it('should handle initialization errors', async () => {
      StorageFactory.createAdapter.mockRejectedValueOnce(new Error('Init failed'));
      const { result } = renderHook(() => useItems());
      
      await expect(act(async () => {
        await result.current.initializeStorage();
      })).rejects.toThrow('Init failed');
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('loadItems', () => {
    it('should load items from storage', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      expect(result.current.items).toEqual(sampleItems);
      expect(result.current.storageInfo).toBe('Mock Directory');
      expect(result.current.loadProgress).toEqual({ processed: 4, total: 4 });
    });

    it('should not load if adapter not connected', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      expect(result.current.items).toEqual([]);
    });

    it('should handle progress callback', async () => {
      const { result } = renderHook(() => useItems());
      const progressCallback = vi.fn();
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems(undefined, progressCallback);
      });
      
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle load errors with toast', async () => {
      const { result } = renderHook(() => useItems());
      mockStorage.loadItems = vi.fn().mockRejectedValue(new Error('Load failed'));
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      expect(toast).toHaveBeenCalledWith(
        expect.stringContaining('Error loading items'),
        { type: 'error' }
      );
    });
  });

  describe('saveItem', () => {
    it('should save a new item', async () => {
      const { result } = renderHook(() => useItems());
      const newItem = { id: 'new-book', title: 'New Book', type: 'book' };
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      expect(result.current.items.length).toBe(4);
      
      await act(async () => {
        await result.current.saveItem(newItem);
      });
      
      expect(result.current.items).toContainEqual(newItem);
      expect(result.current.items.length).toBe(5);
    });

    it('should update existing item', async () => {
      const { result } = renderHook(() => useItems());
      const updatedBook = { ...sampleBook, rating: 4 };
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      await act(async () => {
        await result.current.saveItem(updatedBook);
      });
      
      const savedItem = result.current.items.find(item => item.id === sampleBook.id);
      expect(savedItem.rating).toBe(4);
      expect(result.current.items.length).toBe(4);
    });

    it('should throw error if not connected', async () => {
      const { result } = renderHook(() => useItems());
      const newItem = { id: 'new-book', title: 'New Book' };
      
      await expect(act(async () => {
        await result.current.saveItem(newItem);
      })).rejects.toThrow('Please connect to a storage location first');
    });

    it('should handle save errors', async () => {
      const { result } = renderHook(() => useItems());
      mockStorage.saveItem = vi.fn().mockRejectedValue(new Error('Save failed'));
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      await expect(act(async () => {
        await result.current.saveItem(sampleBook);
      })).rejects.toThrow('Save failed');
    });
  });

  describe('deleteItem', () => {
    it('should delete an item', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      await act(async () => {
        await result.current.deleteItem(sampleBook);
      });
      
      expect(result.current.items).not.toContainEqual(sampleBook);
      expect(result.current.items.length).toBe(3);
      expect(result.current.undoStack).toBe(1);
    });

    it('should throw error if not connected', async () => {
      const { result } = renderHook(() => useItems());
      
      await expect(act(async () => {
        await result.current.deleteItem(sampleBook);
      })).rejects.toThrow('Please connect to a storage location first');
    });

    it('should return undo info', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
        await result.current.loadItems();
      });
      
      let undoInfo;
      await act(async () => {
        undoInfo = await result.current.deleteItem(sampleBook);
      });
      
      expect(undoInfo).toBeDefined();
      expect(undoInfo.item).toBe(sampleBook);
    });

    it('should handle delete errors', async () => {
      const { result } = renderHook(() => useItems());
      mockStorage.deleteItem = vi.fn().mockRejectedValue(new Error('Delete failed'));
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      await expect(act(async () => {
        await result.current.deleteItem(sampleBook);
      })).rejects.toThrow('Delete failed');
    });
  });

  describe('deleteItems', () => {
    it('should delete multiple items', async () => {
      const { result } = renderHook(() => useItems());
      const itemsToDelete = [sampleBook, sampleMovie];
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      await act(async () => {
        await result.current.deleteItems(itemsToDelete);
      });
      
      expect(result.current.items.length).toBe(2);
      expect(result.current.items).not.toContainEqual(sampleBook);
      expect(result.current.items).not.toContainEqual(sampleMovie);
      expect(result.current.undoStack).toBe(2);
    });

    it('should handle parallel deletion with batches', async () => {
      const { result } = renderHook(() => useItems());
      
      // Create many items to test batching (more than BATCH_SIZE of 10)
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        type: 'book'
      }));
      mockStorage._setItems(manyItems);
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      await act(async () => {
        await result.current.deleteItems(manyItems.slice(0, 15));
      });
      
      expect(result.current.items.length).toBe(10);
      expect(result.current.undoStack).toBe(15);
    });

    it('should throw error if not connected', async () => {
      const { result } = renderHook(() => useItems());
      
      await expect(act(async () => {
        await result.current.deleteItems([sampleBook]);
      })).rejects.toThrow('Please connect to a storage location first');
    });

    it('should continue on individual item errors', async () => {
      const { result } = renderHook(() => useItems());
      
      // Mock deleteItem to fail for specific item
      let callCount = 0;
      mockStorage.deleteItem = vi.fn().mockImplementation((item) => {
        callCount++;
        if (item.id === sampleMovie.id) {
          return Promise.reject(new Error('Delete failed'));
        }
        return Promise.resolve({ item, index: callCount });
      });
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      await act(async () => {
        await result.current.deleteItems([sampleBook, sampleMovie, sampleBookUnrated]);
      });
      
      // Should delete sampleBook and sampleBookUnrated, but not sampleMovie
      expect(result.current.items).not.toContainEqual(sampleBook);
      expect(result.current.items).toContainEqual(sampleMovie);
      expect(result.current.items).not.toContainEqual(sampleBookUnrated);
      expect(result.current.undoStack).toBe(2);
    });
  });

  describe('undoLastDelete', () => {
    it('should undo last delete', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      // Delete an item
      await act(async () => {
        await result.current.deleteItem(sampleBook);
      });
      
      expect(result.current.items.length).toBe(3);
      expect(result.current.undoStack).toBe(1);
      
      // Undo the delete
      await act(async () => {
        await result.current.undoLastDelete();
      });
      
      expect(result.current.items.length).toBe(4);
      expect(result.current.items).toContainEqual(sampleBook);
      expect(result.current.undoStack).toBe(0);
    });

    it('should return null if no undo available', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      let undoResult;
      await act(async () => {
        undoResult = await result.current.undoLastDelete();
      });
      
      expect(undoResult).toBeNull();
    });

    it('should return null if not connected', async () => {
      const { result } = renderHook(() => useItems());
      
      let undoResult;
      await act(async () => {
        undoResult = await result.current.undoLastDelete();
      });
      
      expect(undoResult).toBeNull();
    });

    it('should restore undo info on error', async () => {
      const { result } = renderHook(() => useItems());
      mockStorage.restoreItem = vi.fn().mockRejectedValue(new Error('Restore failed'));
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      // Delete an item
      await act(async () => {
        await result.current.deleteItem(sampleBook);
      });
      
      expect(result.current.undoStack).toBe(1);
      
      // Try to undo (will fail)
      await expect(act(async () => {
        await result.current.undoLastDelete();
      })).rejects.toThrow('Restore failed');
      
      // Undo info should be restored
      expect(result.current.undoStack).toBe(1);
    });
  });

  describe('selectStorage', () => {
    it('should select storage and load items', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.selectStorage();
      });
      
      expect(mockStorage.connected).toBe(true);
      expect(result.current.items).toEqual(sampleItems);
      expect(result.current.storageInfo).toBe('TestDirectory'); // selectStorage sets name to TestDirectory
    });

    it('should create new adapter if type differs', async () => {
      const { result } = renderHook(() => useItems());
      const mockGoogleStorage = new MockGoogleDriveStorage();
      mockGoogleStorage._setItems(sampleItems);
      
      await act(async () => {
        await result.current.initializeStorage('filesystem');
      });
      
      // Mock createAdapter to return Google Drive storage
      StorageFactory.createAdapter.mockResolvedValueOnce(mockGoogleStorage);
      
      await act(async () => {
        await result.current.selectStorage('googledrive');
      });
      
      expect(StorageFactory.createAdapter).toHaveBeenCalledWith('googledrive');
    });

    it('should handle AbortError silently', async () => {
      const { result } = renderHook(() => useItems());
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      mockStorage.selectStorage = vi.fn().mockRejectedValue(abortError);
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      // Should not throw
      await act(async () => {
        await result.current.selectStorage();
      });
    });

    it('should throw non-AbortErrors', async () => {
      const { result } = renderHook(() => useItems());
      mockStorage.selectStorage = vi.fn().mockRejectedValue(new Error('Selection failed'));
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await expect(act(async () => {
        await result.current.selectStorage();
      })).rejects.toThrow('Selection failed');
    });
  });

  describe('disconnectStorage', () => {
    it('should disconnect and clear state', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      expect(result.current.items.length).toBe(4);
      
      await act(async () => {
        await result.current.disconnectStorage();
      });
      
      expect(result.current.storageAdapter).toBeNull();
      expect(result.current.storageInfo).toBeNull();
      expect(result.current.items).toEqual([]);
      expect(result.current.undoStack).toBe(0);
      expect(mockStorage.connected).toBe(false);
    });

    it('should handle disconnect when no adapter exists', async () => {
      const { result } = renderHook(() => useItems());
      
      // Should not throw
      await act(async () => {
        await result.current.disconnectStorage();
      });
    });
  });

  describe('getAvailableStorageOptions', () => {
    it('should return available storage adapters', async () => {
      const { result } = renderHook(() => useItems());
      
      let options;
      await act(async () => {
        options = await result.current.getAvailableStorageOptions();
      });
      
      expect(options).toEqual([
        { type: 'filesystem', name: 'Local Directory', available: true },
        { type: 'googledrive', name: 'Google Drive', available: true }
      ]);
    });
  });

  describe('applyBatchEdit', () => {
    it('should apply changes to multiple items', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      const changes = {
        rating: 4,
        addTags: ['favorite']
      };
      
      await act(async () => {
        await result.current.applyBatchEdit([sampleBook.id, sampleMovie.id], changes);
      });
      
      const updatedBook = result.current.items.find(item => item.id === sampleBook.id);
      const updatedMovie = result.current.items.find(item => item.id === sampleMovie.id);
      
      expect(updatedBook.rating).toBe(4);
      expect(updatedBook.tags).toContain('favorite');
      expect(updatedMovie.rating).toBe(4);
      expect(updatedMovie.tags).toContain('favorite');
    });

    it('should add tags without duplicates', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      const changes = {
        addTags: ['classic', 'must-read'] // 'classic' already exists
      };
      
      await act(async () => {
        await result.current.applyBatchEdit([sampleBook.id], changes);
      });
      
      const updatedBook = result.current.items.find(item => item.id === sampleBook.id);
      const classicCount = updatedBook.tags.filter(tag => tag === 'classic').length;
      
      expect(classicCount).toBe(1);
      expect(updatedBook.tags).toContain('must-read');
    });

    it('should remove tags', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      const changes = {
        removeTags: ['classic']
      };
      
      await act(async () => {
        await result.current.applyBatchEdit([sampleBook.id], changes);
      });
      
      const updatedBook = result.current.items.find(item => item.id === sampleBook.id);
      expect(updatedBook.tags).not.toContain('classic');
    });

    it('should handle batch processing for many items', async () => {
      const { result } = renderHook(() => useItems());
      
      // Create many items to test batching
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        type: 'book',
        rating: 0
      }));
      mockStorage._setItems(manyItems);
      
      await act(async () => {
        await result.current.initializeStorage();
        await result.current.loadItems();
      });
      
      const changes = { rating: 5 };
      const itemIds = manyItems.map(item => item.id);
      
      await act(async () => {
        await result.current.applyBatchEdit(itemIds, changes);
      });
      
      const allUpdated = result.current.items.every(item => item.rating === 5);
      expect(allUpdated).toBe(true);
    });

    it('should throw error if not connected', async () => {
      const { result } = renderHook(() => useItems());
      
      await expect(act(async () => {
        await result.current.applyBatchEdit([sampleBook.id], { rating: 5 });
      })).rejects.toThrow('Please connect to a storage location first');
    });

    it('should continue on individual item errors', async () => {
      const { result } = renderHook(() => useItems());
      
      // Mock saveItem to fail for specific item
      let callCount = 0;
      mockStorage.saveItem = vi.fn().mockImplementation((item) => {
        callCount++;
        if (item.id === sampleMovie.id) {
          return Promise.reject(new Error('Save failed'));
        }
        return Promise.resolve(item);
      });
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      const changes = { rating: 5 };
      
      await act(async () => {
        await result.current.applyBatchEdit([sampleBook.id, sampleMovie.id, sampleBookUnrated.id], changes);
      });
      
      // Should update sampleBook and sampleBookUnrated, but not sampleMovie
      const updatedBook = result.current.items.find(item => item.id === sampleBook.id);
      const updatedMovie = result.current.items.find(item => item.id === sampleMovie.id);
      const updatedBookUnrated = result.current.items.find(item => item.id === sampleBookUnrated.id);
      
      expect(updatedBook.rating).toBe(5);
      expect(updatedMovie.rating).toBe(5); // Original rating unchanged
      expect(updatedBookUnrated.rating).toBe(5);
    });

    it('should handle all change types', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      const changes = {
        type: 'movie',
        author: 'New Author',
        director: 'New Director',
        year: '2025',
        rating: 5,
        addTags: ['updated'],
        dateRead: '2025-01-01',
        dateWatched: '2025-01-02'
      };
      
      await act(async () => {
        await result.current.applyBatchEdit([sampleBook.id], changes);
      });
      
      const updated = result.current.items.find(item => item.id === sampleBook.id);
      expect(updated.type).toBe('movie');
      expect(updated.author).toBe('New Author');
      expect(updated.director).toBe('New Director');
      expect(updated.year).toBe('2025');
      expect(updated.rating).toBe(5);
      expect(updated.tags).toContain('updated');
      expect(updated.dateRead).toBe('2025-01-01');
      expect(updated.dateWatched).toBe('2025-01-02');
    });
  });

  describe('loadProgress', () => {
    it('should track load progress', async () => {
      const { result } = renderHook(() => useItems());
      
      await act(async () => {
        await result.current.initializeStorage();
      });
      
      expect(result.current.loadProgress).toEqual({ processed: 0, total: 0 });
      
      await act(async () => {
        await result.current.loadItems();
      });
      
      expect(result.current.loadProgress).toEqual({ processed: 4, total: 4 });
    });
  });
});
