/**
 * IndexedDB Cache Service for Google Drive items
 * Caches file metadata and content to speed up subsequent loads
 */

const DB_NAME = 'MediaTrackerCache';
const DB_VERSION = 1;
const STORE_NAME = 'driveItems';

class DriveCache {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize IndexedDB connection
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'fileId' });
          
          // Create indexes for efficient querying
          objectStore.createIndex('folderId', 'folderId', { unique: false });
          objectStore.createIndex('modifiedTime', 'modifiedTime', { unique: false });
        }
      };
    });
  }

  /**
   * Get all cached items for a specific folder
   * Uses cursor to avoid browser limits on getAll() (typically 100 items)
   * @param {string} folderId - Google Drive folder ID
   * @returns {Promise<Object>} Map of fileId -> cached item
   */
  async getCachedItems(folderId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('folderId');
      const itemsMap = {};
      
      // Use cursor to iterate through ALL items without limit
      const request = index.openCursor(IDBKeyRange.only(folderId));

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          // Add item to map
          const item = cursor.value;
          itemsMap[item.fileId] = item;
          // Continue to next item
          cursor.continue();
        } else {
          // No more items, we're done
          console.log(`[Cache] getCachedItems for folder ${folderId}: found ${Object.keys(itemsMap).length} items`);
          if (Object.keys(itemsMap).length > 0) {
            console.log('[Cache] Sample cached item:', Object.values(itemsMap)[0]);
          }
          resolve(itemsMap);
        }
      };

      request.onerror = () => {
        console.error('Error reading from cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Store multiple items in cache
   * @param {string} folderId - Google Drive folder ID
   * @param {Array} items - Array of items with fileId, modifiedTime, and data
   */
  async cacheItems(folderId, items) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      console.log(`[Cache] cacheItems: Storing ${items.length} items for folder ${folderId}`);
      items.forEach(item => {
        const cacheEntry = {
          fileId: item.fileId,
          folderId: folderId,
          modifiedTime: item.modifiedTime,
          filename: item.filename,
          data: item.data
        };
        objectStore.put(cacheEntry);
      });

      transaction.oncomplete = () => {
        console.log(`[Cache] Successfully stored ${items.length} items`);
        resolve();
      };

      transaction.onerror = () => {
        console.error('Error writing to cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Update a single item in cache
   * @param {string} folderId - Google Drive folder ID
   * @param {string} fileId - File ID
   * @param {string} modifiedTime - Last modified time
   * @param {string} filename - Filename
   * @param {Object} data - Item data
   */
  async updateCachedItem(folderId, fileId, modifiedTime, filename, data) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      objectStore.put({
        fileId,
        folderId,
        modifiedTime,
        filename,
        data
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        console.error('Error updating cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Remove an item from cache
   * @param {string} fileId - File ID to remove
   */
  async removeCachedItem(fileId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      objectStore.delete(fileId);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        console.error('Error removing from cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Remove multiple items from cache
   * @param {Array<string>} fileIds - Array of file IDs to remove
   */
  async removeCachedItems(fileIds) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      fileIds.forEach(fileId => {
        objectStore.delete(fileId);
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        console.error('Error removing items from cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Clear all cached items for a specific folder
   * @param {string} folderId - Google Drive folder ID
   */
  async clearFolderCache(folderId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('folderId');
      const request = index.openCursor(IDBKeyRange.only(folderId));

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        console.error('Error clearing folder cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Clear entire cache
   */
  async clearAllCache() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Error clearing cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const countRequest = objectStore.count();

      countRequest.onsuccess = () => {
        resolve({
          itemCount: countRequest.result
        });
      };

      countRequest.onerror = () => {
        console.error('Error getting cache stats:', countRequest.error);
        reject(countRequest.error);
      };
    });
  }
}

// Export singleton instance
export const driveCache = new DriveCache();
