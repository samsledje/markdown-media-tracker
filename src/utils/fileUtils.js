import { parseMarkdown, generateMarkdown } from './markdownUtils.js';

/**
 * Get or create a trash directory within the given directory handle
 * @param {FileSystemDirectoryHandle} dirHandle - Directory handle
 * @returns {Promise<FileSystemDirectoryHandle>} Trash directory handle
 */
export const getOrCreateTrashDir = async (dirHandle) => {
  try {
    return await dirHandle.getDirectoryHandle('.trash', { create: true });
  } catch (err) {
    console.error('Error creating/reading .trash dir', err);
    throw err;
  }
};

/**
 * Load all markdown items from a directory
 * @param {FileSystemDirectoryHandle} handle - Directory handle
 * @returns {Promise<object[]>} Array of loaded items
 */
export const loadItemsFromDirectory = async (handle) => {
  console.log('Loading items from directory...');
  const loadedItems = [];
  
  try {
    for await (const entry of handle.values()) {
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
            // preserve parsed status from frontmatter
            status: metadata.status,
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
};

/**
 * Save an item as a markdown file
 * @param {object} item - Item to save
 * @param {FileSystemDirectoryHandle} directoryHandle - Directory handle
 * @returns {Promise<void>}
 */
export const saveItemToFile = async (item, directoryHandle) => {
  if (!directoryHandle) {
    throw new Error('Please select a directory first');
  }

  try {
    const filename = item.filename || `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(generateMarkdown(item));
    await writable.close();
  } catch (err) {
    console.error('Error saving file:', err);
    throw new Error('Error saving file. Please try again.');
  }
};

/**
 * Move a file to trash directory
 * @param {object} item - Item to delete
 * @param {FileSystemDirectoryHandle} directoryHandle - Directory handle
 * @returns {Promise<object>} Undo information
 */
export const moveItemToTrash = async (item, directoryHandle) => {
  if (!directoryHandle) {
    throw new Error('Please select a directory first');
  }

  try {
    const trashDir = await getOrCreateTrashDir(directoryHandle);
    const srcHandle = await directoryHandle.getFileHandle(item.filename);
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
    await directoryHandle.removeEntry(item.filename);

    return { from: item.filename, to: `.trash/${trashName}` };
  } catch (err) {
    console.error('Error moving file to trash:', err);
    throw new Error('Error deleting file. Please try again.');
  }
};

/**
 * Restore a file from trash
 * @param {object} undoInfo - Undo information from moveItemToTrash
 * @param {FileSystemDirectoryHandle} directoryHandle - Directory handle
 * @returns {Promise<string>} Restored filename
 */
export const restoreItemFromTrash = async (undoInfo, directoryHandle) => {
  if (!directoryHandle) {
    throw new Error('Please select a directory first');
  }

  try {
    const trashDir = await getOrCreateTrashDir(directoryHandle);
    const trashPath = undoInfo.to.replace(/^\.trash\//, '');
    const trashFile = await trashDir.getFileHandle(trashPath);
    const file = await trashFile.getFile();

    // restore to original name; if it exists, append timestamp
    let restoreName = undoInfo.from;
    try {
      await directoryHandle.getFileHandle(restoreName);
      restoreName = `${restoreName.replace(/\.md$/, '')}-restored-${Date.now()}.md`;
    } catch (e) {
      // not found -> ok
    }

    const dest = await directoryHandle.getFileHandle(restoreName, { create: true });
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
};

/**
 * Select a directory using the File System Access API
 * @returns {Promise<FileSystemDirectoryHandle>} Directory handle
 */
export const selectDirectory = async () => {
  try {
    console.log('Opening directory picker...');
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    console.log('Directory selected:', handle.name);
    return handle;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Error selecting directory:', err);
      throw new Error(`Error: ${err.message}. Make sure you're using Chrome, Edge, or Opera.`);
    }
    throw err;
  }
};