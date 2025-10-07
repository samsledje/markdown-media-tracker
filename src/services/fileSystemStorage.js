import { StorageAdapter } from './storageAdapter.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdownUtils.js';

/**
 * File System Access API Storage Adapter
 * Implements storage operations using the File System Access API for local file storage
 */
export class FileSystemStorage extends StorageAdapter {
  constructor() {
    super();
    this.directoryHandle = null;
    this.trashHandle = null;
  }

  static isSupported() {
    // Check if File System Access API is supported
    return typeof window !== 'undefined' && 
           'showDirectoryPicker' in window && 
           'FileSystemDirectoryHandle' in window;
  }

  getStorageType() {
    return 'filesystem';
  }

  async initialize() {
    // File System Access API doesn't require initialization
    return true;
  }

  isConnected() {
    return !!this.directoryHandle;
  }

  getStorageInfo() {
    if (!this.directoryHandle) return null;
    return `Local Directory: ${this.directoryHandle.name}`;
  }

  async selectStorage() {
    try {
      console.log('Opening directory picker...');
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      console.log('Directory selected:', handle.name);
      
      this.directoryHandle = handle;
      this.trashHandle = null; // Reset trash handle, will be created when needed
      
      return {
        handle: handle,
        name: handle.name
      };
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error selecting directory:', error);
        throw new Error(`Error: ${error.message}. Make sure you're using Chrome, Edge, or Opera.`);
      }
      throw error;
    }
  }

  async disconnect() {
    this.directoryHandle = null;
    this.trashHandle = null;
  }

  async loadItems() {
    if (!this.directoryHandle) {
      throw new Error('Please select a directory first');
    }

    console.log('Loading items from directory...');
    const loadedItems = [];
    
    try {
      for await (const entry of this.directoryHandle.values()) {
        console.log('Found entry:', entry.name, entry.kind);
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          try {
            const file = await entry.getFile();
            const content = await file.text();
            console.log('Loaded file:', entry.name);
            const { metadata, body } = parseMarkdown(content);
            
            loadedItems.push({
              id: entry.name.replace('.md', ''),
              filename: entry.name,
              title: metadata.title || 'Untitled',
              type: metadata.type || 'book',
              author: metadata.author,
              director: metadata.director,
              actors: metadata.actors || [],
              isbn: metadata.isbn,
              year: metadata.year,
              rating: metadata.rating,
              tags: metadata.tags || [],
              coverUrl: metadata.coverUrl,
              dateRead: metadata.dateRead,
              dateWatched: metadata.dateWatched,
              dateAdded: metadata.dateAdded,
              review: body
            });
          } catch (err) {
            console.error(`Error loading ${entry.name}:`, err);
          }
        }
      }
      
      console.log(`Loaded ${loadedItems.length} items`);
      return loadedItems.sort((a, b) => 
        new Date(b.dateAdded) - new Date(a.dateAdded)
      );
    } catch (err) {
      console.error('Error reading directory:', err);
      throw new Error(`Error reading directory: ${err.message}`);
    }
  }

  async saveItem(item) {
    if (!this.directoryHandle) {
      throw new Error('Please select a directory first');
    }

    try {
      const filename = item.filename || `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
      const fileHandle = await this.directoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(generateMarkdown(item));
      await writable.close();
    } catch (err) {
      console.error('Error saving file:', err);
      throw new Error('Error saving file. Please try again.');
    }
  }

  async deleteItem(item) {
    if (!this.directoryHandle) {
      throw new Error('Please select a directory first');
    }

    try {
      const trashDir = await this._getOrCreateTrashDir();
      const srcHandle = await this.directoryHandle.getFileHandle(item.filename);
      const file = await srcHandle.getFile();
      
      let trashName = item.filename;
      // if file exists in trash, append timestamp
      try {
        await trashDir.getFileHandle(trashName);
        trashName = `${item.filename.replace(/\.md$/, '')}-${Date.now()}.md`;
      } catch (e) {
        // not found -> ok
      }

      const dest = await trashDir.getFileHandle(trashName, { create: true });
      const writable = await dest.createWritable();
      await writable.write(await file.text());
      await writable.close();

      // remove original
      await this.directoryHandle.removeEntry(item.filename);

      return { from: item.filename, to: `.trash/${trashName}` };
    } catch (err) {
      console.error('Error moving file to trash:', err);
      throw new Error('Error deleting file. Please try again.');
    }
  }

  async restoreItem(undoInfo) {
    if (!this.directoryHandle) {
      throw new Error('Please select a directory first');
    }

    try {
      const trashDir = await this._getOrCreateTrashDir();
      const trashPath = undoInfo.to.replace(/^\.trash\//, '');
      const trashFile = await trashDir.getFileHandle(trashPath);
      const file = await trashFile.getFile();

      // restore to original name; if it exists, append timestamp
      let restoreName = undoInfo.from;
      try {
        await this.directoryHandle.getFileHandle(restoreName);
        restoreName = `${restoreName.replace(/\.md$/, '')}-restored-${Date.now()}.md`;
      } catch (e) {
        // not found -> ok
      }

      const dest = await this.directoryHandle.getFileHandle(restoreName, { create: true });
      const writable = await dest.createWritable();
      await writable.write(await file.text());
      await writable.close();

      // remove from trash
      await trashDir.removeEntry(trashPath);

      return restoreName;
    } catch (err) {
      console.error('Error undoing trash', err);
      throw new Error('Error restoring file. See console for details.');
    }
  }

  /**
   * Get or create a trash directory within the current directory handle
   * @returns {Promise<FileSystemDirectoryHandle>} Trash directory handle
   */
  async _getOrCreateTrashDir() {
    if (this.trashHandle) {
      return this.trashHandle;
    }

    try {
      this.trashHandle = await this.directoryHandle.getDirectoryHandle('.trash', { create: true });
      return this.trashHandle;
    } catch (err) {
      console.error('Error creating/reading .trash dir', err);
      throw err;
    }
  }
}