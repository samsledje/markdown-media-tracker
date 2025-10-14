/**
 * IndexedDB Storage Service for File System Access API handles
 * Stores FileSystemDirectoryHandle to enable persistent connections across browser sessions
 */

const DB_NAME = 'MediaTrackerFileSystem';
const DB_VERSION = 1;
const STORE_NAME = 'directoryHandles';

class FileSystemCache {
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
        console.error('Failed to open IndexedDB for file system cache:', request.error);
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
          // Use a fixed key since we only store one handle at a time
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Create index for directory name
          objectStore.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  /**
   * Store directory handle
   * @param {FileSystemDirectoryHandle} handle - Directory handle to store
   * @returns {Promise<void>}
   */
  async storeDirectoryHandle(handle) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const data = {
        id: 'current', // Fixed ID since we only store one handle
        handle: handle,
        name: handle.name,
        timestamp: Date.now()
      };

      const request = objectStore.put(data);

      request.onsuccess = () => {
        console.log('[FileSystemCache] Directory handle stored successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('[FileSystemCache] Error storing directory handle:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Retrieve stored directory handle
   * @returns {Promise<FileSystemDirectoryHandle|null>}
   */
  async getDirectoryHandle() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.handle) {
          console.log('[FileSystemCache] Retrieved directory handle:', result.name);
          resolve(result.handle);
        } else {
          console.log('[FileSystemCache] No stored directory handle found');
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('[FileSystemCache] Error retrieving directory handle:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear stored directory handle
   * @returns {Promise<void>}
   */
  async clearDirectoryHandle() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete('current');

      request.onsuccess = () => {
        console.log('[FileSystemCache] Directory handle cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('[FileSystemCache] Error clearing directory handle:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Verify that a stored handle is still valid and accessible
   * @param {FileSystemDirectoryHandle} handle - Handle to verify
   * @param {boolean} requestIfNeeded - Whether to request permission if not granted (requires user gesture)
   * @returns {Promise<boolean>}
   */
  async verifyHandlePermission(handle, requestIfNeeded = false) {
    try {
      // Query current permission status (doesn't require user activation)
      const permission = await handle.queryPermission({ mode: 'readwrite' });
      
      if (permission === 'granted') {
        return true;
      }
      
      // If permission is prompt/denied and we're allowed to request
      // Note: requestPermission() requires user activation (click, etc)
      if (requestIfNeeded) {
        try {
          const requestResult = await handle.requestPermission({ mode: 'readwrite' });
          return requestResult === 'granted';
        } catch (requestError) {
          // User activation required or permission denied
          console.log('[FileSystemCache] Could not request permission:', requestError.message);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[FileSystemCache] Error verifying handle permission:', error);
      return false;
    }
  }
}

// Export singleton instance
export const fileSystemCache = new FileSystemCache();
