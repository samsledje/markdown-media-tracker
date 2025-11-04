import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { driveCache } from '../driveCache.js';

// Simplified IndexedDB mock for testing
function createMockIndexedDB() {
  const data = new Map();
  let dbInstance = null;
  
  const mockStore = {
    _data: data,
    put: vi.fn((value) => {
      const request = {
        onsuccess: null,
        onerror: null
      };
      setTimeout(() => {
        data.set(value.fileId || value.id || value, value);
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);
      return request;
    }),
    delete: vi.fn((key) => {
      const request = {
        onsuccess: null,
        onerror: null
      };
      setTimeout(() => {
        data.delete(key);
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);
      return request;
    }),
    clear: vi.fn(() => {
      const request = {
        onsuccess: null,
        onerror: null
      };
      setTimeout(() => {
        data.clear();
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);
      return request;
    }),
    count: vi.fn(() => {
      const request = {
        result: null,
        onsuccess: null,
        onerror: null
      };
      setTimeout(() => {
        request.result = data.size;
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);
      return request;
    }),
    index: vi.fn(() => ({
      openCursor: vi.fn((range) => {
        const request = {
          result: null,
          onsuccess: null,
          onerror: null
        };
        
        const items = Array.from(data.values()).filter(item => 
          !range || item.folderId === range
        );
        
        let cursorIndex = 0;
        const cursor = {
          value: null,
          key: null,
          continue: () => {
            setTimeout(() => {
              if (cursorIndex < items.length) {
                const item = items[cursorIndex++];
                cursor.value = item;
                cursor.key = item.fileId;
                request.result = cursor;
                if (request.onsuccess) {
                  request.onsuccess({ target: request });
                }
              } else {
                request.result = null;
                if (request.onsuccess) {
                  request.onsuccess({ target: request });
                }
              }
            }, 0);
          },
          delete: () => {
            if (cursor.key) {
              data.delete(cursor.key);
            }
          }
        };
        
        setTimeout(() => {
          if (items.length > 0) {
            cursor.continue();
          } else {
            request.result = null;
            if (request.onsuccess) {
              request.onsuccess({ target: request });
            }
          }
        }, 0);
        
        return request;
      })
    }))
  };
  
  const mockTransaction = {
    objectStore: vi.fn(() => mockStore),
    oncomplete: null,
    onerror: null,
    error: null
  };
  
  const mockDB = {
    transaction: vi.fn(() => mockTransaction),
    createObjectStore: vi.fn(() => mockStore),
    objectStoreNames: {
      contains: vi.fn(() => true)
    }
  };
  
  const mockIndexedDB = {
    open: vi.fn((dbName, version) => {
      const request = {
        result: null,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      };
      
      setTimeout(() => {
        if (!dbInstance) {
          dbInstance = mockDB;
          if (request.onupgradeneeded) {
            request.onupgradeneeded({ target: { result: dbInstance } });
          }
        }
        request.result = dbInstance;
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);
      
      return request;
    }),
    _data: data,
    _getStore: () => mockStore
  };
  
  return mockIndexedDB;
}

// Mock IDBKeyRange
global.IDBKeyRange = {
  only: (value) => value
};

describe('driveCache', () => {
  let mockIndexedDB;
  let originalIndexedDB;
  
  beforeEach(() => {
    originalIndexedDB = global.indexedDB;
    mockIndexedDB = createMockIndexedDB();
    global.indexedDB = mockIndexedDB;
    driveCache.db = null;
  });
  
  afterEach(() => {
    global.indexedDB = originalIndexedDB;
    driveCache.db = null;
    mockIndexedDB._data.clear();
  });
  
  describe('init', () => {
    it('should initialize database connection', async () => {
      await driveCache.init();
      expect(mockIndexedDB.open).toHaveBeenCalledWith('MediaTrackerCache', 1);
      expect(driveCache.db).toBeTruthy();
    });
    
    it('should return existing connection if already initialized', async () => {
      await driveCache.init();
      const firstDb = driveCache.db;
      await driveCache.init();
      expect(driveCache.db).toBe(firstDb);
      expect(mockIndexedDB.open).toHaveBeenCalledTimes(1);
    });
    
    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockIndexedDB.open = vi.fn((dbName, version) => {
        const request = {
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          error: error
        };
        setTimeout(() => {
          if (request.onerror) {
            request.onerror({ target: request });
          }
        }, 0);
        return request;
      });
      
      await expect(driveCache.init()).rejects.toEqual(error);
    });
  });
  
  describe('getCachedItems', () => {
    beforeEach(async () => {
      await driveCache.init();
    });
    
    it('should return empty map for empty cache', async () => {
      const items = await driveCache.getCachedItems('folder1');
      expect(items).toEqual({});
    });
    
    it('should return cached items for folder', async () => {
      const item1 = {
        fileId: 'file1',
        folderId: 'folder1',
        modifiedTime: '2024-01-01',
        filename: 'item1.md',
        data: { title: 'Test Item' }
      };
      const item2 = {
        fileId: 'file2',
        folderId: 'folder1',
        modifiedTime: '2024-01-02',
        filename: 'item2.md',
        data: { title: 'Test Item 2' }
      };
      
      mockIndexedDB._data.set('file1', item1);
      mockIndexedDB._data.set('file2', item2);
      
      const items = await driveCache.getCachedItems('folder1');
      expect(Object.keys(items)).toHaveLength(2);
      expect(items.file1).toEqual(item1);
      expect(items.file2).toEqual(item2);
    });
  });
  
  describe('cacheItems', () => {
    beforeEach(async () => {
      await driveCache.init();
    });
    
    it('should cache multiple items', async () => {
      const items = [
        {
          fileId: 'file1',
          modifiedTime: '2024-01-01',
          filename: 'item1.md',
          data: { title: 'Test Item' }
        },
        {
          fileId: 'file2',
          modifiedTime: '2024-01-02',
          filename: 'item2.md',
          data: { title: 'Test Item 2' }
        }
      ];
      
      await driveCache.cacheItems('folder1', items);
      
      expect(mockIndexedDB._data.has('file1')).toBe(true);
      expect(mockIndexedDB._data.has('file2')).toBe(true);
    });
  });
  
  describe('updateCachedItem', () => {
    beforeEach(async () => {
      await driveCache.init();
    });
    
    it('should update a single cached item', async () => {
      await driveCache.updateCachedItem('folder1', 'file1', '2024-01-01', 'item1.md', { title: 'Updated' });
      
      const item = mockIndexedDB._data.get('file1');
      expect(item).toBeTruthy();
      expect(item.data.title).toBe('Updated');
    });
  });
  
  describe('removeCachedItem', () => {
    beforeEach(async () => {
      await driveCache.init();
      mockIndexedDB._data.set('file1', { fileId: 'file1', folderId: 'folder1' });
    });
    
    it('should remove a single item from cache', async () => {
      await driveCache.removeCachedItem('file1');
      expect(mockIndexedDB._data.has('file1')).toBe(false);
    });
  });
  
  describe('removeCachedItems', () => {
    beforeEach(async () => {
      await driveCache.init();
      mockIndexedDB._data.set('file1', { fileId: 'file1' });
      mockIndexedDB._data.set('file2', { fileId: 'file2' });
    });
    
    it('should remove multiple items from cache', async () => {
      await driveCache.removeCachedItems(['file1', 'file2']);
      expect(mockIndexedDB._data.has('file1')).toBe(false);
      expect(mockIndexedDB._data.has('file2')).toBe(false);
    });
  });
  
  describe('clearFolderCache', () => {
    beforeEach(async () => {
      await driveCache.init();
      mockIndexedDB._data.set('file1', { fileId: 'file1', folderId: 'folder1' });
      mockIndexedDB._data.set('file2', { fileId: 'file2', folderId: 'folder2' });
    });
    
    it('should clear only items from specified folder', async () => {
      await driveCache.clearFolderCache('folder1');
      expect(mockIndexedDB._data.has('file1')).toBe(false);
      expect(mockIndexedDB._data.has('file2')).toBe(true);
    });
  });
  
  describe('clearAllCache', () => {
    beforeEach(async () => {
      await driveCache.init();
      mockIndexedDB._data.set('file1', { fileId: 'file1' });
      mockIndexedDB._data.set('file2', { fileId: 'file2' });
    });
    
    it('should clear all cached items', async () => {
      await driveCache.clearAllCache();
      expect(mockIndexedDB._data.size).toBe(0);
    });
  });
  
  describe('getCacheStats', () => {
    beforeEach(async () => {
      await driveCache.init();
      mockIndexedDB._data.set('file1', { fileId: 'file1' });
      mockIndexedDB._data.set('file2', { fileId: 'file2' });
    });
    
    it('should return cache statistics', async () => {
      const stats = await driveCache.getCacheStats();
      expect(stats).toHaveProperty('itemCount');
      expect(stats.itemCount).toBe(2);
    });
  });
});
