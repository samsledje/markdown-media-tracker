import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getOrCreateTrashDir,
  loadItemsFromDirectory,
  saveItemToFile,
  moveItemToTrash,
  restoreItemFromTrash,
  selectDirectory
} from '../fileUtils.js';

// Mock markdownUtils
vi.mock('../markdownUtils.js', () => ({
  parseMarkdown: vi.fn((content) => ({
    metadata: {
      title: 'Test Item',
      type: 'book',
      author: 'Test Author',
      status: 'read',
      rating: 5,
      tags: ['test'],
      dateAdded: '2024-01-01'
    },
    body: 'Test review'
  })),
  generateMarkdown: vi.fn((item) => `---
title: ${item.title}
type: ${item.type}
---
${item.review || ''}`)
}));

import { parseMarkdown, generateMarkdown } from '../markdownUtils.js';

describe('fileUtils', () => {
  let mockDirectoryHandle;
  let mockFileHandle;
  let mockWritable;
  let mockTrashHandle;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWritable = {
      write: vi.fn(),
      close: vi.fn()
    };

    mockFileHandle = {
      getFile: vi.fn(() => Promise.resolve({
        text: () => Promise.resolve('---\ntitle: Test\n---\nContent')
      })),
      createWritable: vi.fn(() => Promise.resolve(mockWritable))
    };

    mockTrashHandle = {
      getFileHandle: vi.fn(() => Promise.resolve(mockFileHandle)),
      removeEntry: vi.fn()
    };

    mockDirectoryHandle = {
      getDirectoryHandle: vi.fn(() => Promise.resolve(mockTrashHandle)),
      getFileHandle: vi.fn(() => Promise.resolve(mockFileHandle)),
      removeEntry: vi.fn(),
      values: vi.fn()
    };
  });

  describe('getOrCreateTrashDir', () => {
    it('should create and return trash directory', async () => {
      const result = await getOrCreateTrashDir(mockDirectoryHandle);

      expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('.trash', { create: true });
      expect(result).toBe(mockTrashHandle);
    });

    it('should throw error if directory creation fails', async () => {
      mockDirectoryHandle.getDirectoryHandle.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(getOrCreateTrashDir(mockDirectoryHandle)).rejects.toThrow('Permission denied');
    });
  });

  describe('loadItemsFromDirectory', () => {
    it('should load markdown files from directory', async () => {
      const mockEntry1 = {
        kind: 'file',
        name: 'test-item.md',
        getFile: () => Promise.resolve({
          text: () => Promise.resolve('---\ntitle: Test\n---\nContent')
        })
      };

      const mockEntry2 = {
        kind: 'file',
        name: 'another-item.md',
        getFile: () => Promise.resolve({
          text: () => Promise.resolve('---\ntitle: Another\n---\nMore content')
        })
      };

      mockDirectoryHandle.values = vi.fn(async function* () {
        yield mockEntry1;
        yield mockEntry2;
      });

      const items = await loadItemsFromDirectory(mockDirectoryHandle);

      expect(items).toHaveLength(2);
      expect(items[0].title).toBe('Test Item');
      expect(items[0].id).toBe('test-item');
      expect(items[0].filename).toBe('test-item.md');
      expect(parseMarkdown).toHaveBeenCalledTimes(2);
    });

    it('should skip non-markdown files', async () => {
      const mockEntry1 = {
        kind: 'file',
        name: 'test.txt',
        getFile: () => Promise.resolve({
          text: () => Promise.resolve('Not markdown')
        })
      };

      const mockEntry2 = {
        kind: 'file',
        name: 'test.md',
        getFile: () => Promise.resolve({
          text: () => Promise.resolve('---\ntitle: Test\n---\nContent')
        })
      };

      mockDirectoryHandle.values = vi.fn(async function* () {
        yield mockEntry1;
        yield mockEntry2;
      });

      const items = await loadItemsFromDirectory(mockDirectoryHandle);

      expect(items).toHaveLength(1);
      expect(items[0].filename).toBe('test.md');
    });

    it('should skip directories', async () => {
      const mockEntry1 = {
        kind: 'directory',
        name: 'subfolder'
      };

      const mockEntry2 = {
        kind: 'file',
        name: 'test.md',
        getFile: () => Promise.resolve({
          text: () => Promise.resolve('---\ntitle: Test\n---\nContent')
        })
      };

      mockDirectoryHandle.values = vi.fn(async function* () {
        yield mockEntry1;
        yield mockEntry2;
      });

      const items = await loadItemsFromDirectory(mockDirectoryHandle);

      expect(items).toHaveLength(1);
    });

    it('should handle errors loading individual files gracefully', async () => {
      const mockEntry1 = {
        kind: 'file',
        name: 'broken.md',
        getFile: () => Promise.reject(new Error('File read error'))
      };

      const mockEntry2 = {
        kind: 'file',
        name: 'working.md',
        getFile: () => Promise.resolve({
          text: () => Promise.resolve('---\ntitle: Test\n---\nContent')
        })
      };

      mockDirectoryHandle.values = vi.fn(async function* () {
        yield mockEntry1;
        yield mockEntry2;
      });

      const items = await loadItemsFromDirectory(mockDirectoryHandle);

      expect(items).toHaveLength(1);
      expect(items[0].filename).toBe('working.md');
    });

    it('should sort items by dateAdded descending', async () => {
      parseMarkdown
        .mockReturnValueOnce({
          metadata: { title: 'Older', dateAdded: '2024-01-01' },
          body: ''
        })
        .mockReturnValueOnce({
          metadata: { title: 'Newer', dateAdded: '2024-12-01' },
          body: ''
        });

      const mockEntry1 = {
        kind: 'file',
        name: 'older.md',
        getFile: () => Promise.resolve({
          text: () => Promise.resolve('content')
        })
      };

      const mockEntry2 = {
        kind: 'file',
        name: 'newer.md',
        getFile: () => Promise.resolve({
          text: () => Promise.resolve('content')
        })
      };

      mockDirectoryHandle.values = vi.fn(async function* () {
        yield mockEntry1;
        yield mockEntry2;
      });

      const items = await loadItemsFromDirectory(mockDirectoryHandle);

      expect(items[0].title).toBe('Newer');
      expect(items[1].title).toBe('Older');
    });

    it('should throw error if directory reading fails', async () => {
      mockDirectoryHandle.values = vi.fn(() => {
        throw new Error('Permission denied');
      });

      await expect(loadItemsFromDirectory(mockDirectoryHandle)).rejects.toThrow('Error reading directory');
    });
  });

  describe('saveItemToFile', () => {
    it('should save item with existing filename', async () => {
      const item = {
        title: 'Test Item',
        type: 'book',
        filename: 'existing-file.md',
        review: 'Great book'
      };

      await saveItemToFile(item, mockDirectoryHandle);

      expect(mockDirectoryHandle.getFileHandle).toHaveBeenCalledWith('existing-file.md', { create: true });
      expect(mockWritable.write).toHaveBeenCalled();
      expect(mockWritable.close).toHaveBeenCalled();
      expect(generateMarkdown).toHaveBeenCalledWith(item);
    });

    it('should generate filename if not provided', async () => {
      const item = {
        title: 'New Test Item',
        type: 'book',
        review: 'Good book'
      };

      await saveItemToFile(item, mockDirectoryHandle);

      expect(mockDirectoryHandle.getFileHandle).toHaveBeenCalledWith(
        expect.stringMatching(/^new-test-item-\d+\.md$/),
        { create: true }
      );
    });

    it('should throw error if no directory handle provided', async () => {
      const item = { title: 'Test', type: 'book' };

      await expect(saveItemToFile(item, null)).rejects.toThrow('Please select a directory first');
    });

    it('should throw error if file save fails', async () => {
      const item = { title: 'Test', type: 'book', filename: 'test.md' };
      mockDirectoryHandle.getFileHandle.mockRejectedValueOnce(new Error('Write error'));

      await expect(saveItemToFile(item, mockDirectoryHandle)).rejects.toThrow('Error saving file');
    });
  });

  describe('moveItemToTrash', () => {
    it('should move item to trash directory', async () => {
      const item = {
        title: 'Test Item',
        filename: 'test-item.md'
      };

      // Mock that file doesn't exist in trash
      mockTrashHandle.getFileHandle.mockRejectedValueOnce(new Error('Not found'));

      const result = await moveItemToTrash(item, mockDirectoryHandle);

      expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('.trash', { create: true });
      expect(mockDirectoryHandle.getFileHandle).toHaveBeenCalledWith('test-item.md');
      expect(mockDirectoryHandle.removeEntry).toHaveBeenCalledWith('test-item.md');
      expect(result).toEqual({
        from: 'test-item.md',
        to: '.trash/test-item.md'
      });
    });

    it('should append timestamp if file exists in trash', async () => {
      const item = {
        title: 'Test Item',
        filename: 'test-item.md'
      };

      // First call succeeds (file exists in trash), second call for timestamped name
      mockTrashHandle.getFileHandle
        .mockResolvedValueOnce(mockFileHandle) // File exists
        .mockResolvedValueOnce(mockFileHandle); // Create with timestamp

      const result = await moveItemToTrash(item, mockDirectoryHandle);

      expect(result.to).toMatch(/^\.trash\/test-item-\d+\.md$/);
    });

    it('should throw error if no directory handle provided', async () => {
      const item = { title: 'Test', filename: 'test.md' };

      await expect(moveItemToTrash(item, null)).rejects.toThrow('Please select a directory first');
    });

    it('should throw error if move fails', async () => {
      const item = { title: 'Test', filename: 'test.md' };
      mockDirectoryHandle.getFileHandle.mockRejectedValueOnce(new Error('File not found'));

      await expect(moveItemToTrash(item, mockDirectoryHandle)).rejects.toThrow('Error deleting file');
    });
  });

  describe('restoreItemFromTrash', () => {
    it('should restore item from trash', async () => {
      const undoInfo = {
        from: 'original-file.md',
        to: '.trash/original-file.md'
      };

      mockDirectoryHandle.getFileHandle
        .mockRejectedValueOnce(new Error('Not found')) // Check if original exists - doesn't
        .mockResolvedValueOnce(mockFileHandle); // Create restored file

      const result = await restoreItemFromTrash(undoInfo, mockDirectoryHandle);

      expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('.trash', { create: true });
      expect(mockTrashHandle.getFileHandle).toHaveBeenCalledWith('original-file.md');
      expect(mockTrashHandle.removeEntry).toHaveBeenCalledWith('original-file.md');
      expect(result).toBe('original-file.md');
    });

    it('should append "restored" timestamp if original filename exists', async () => {
      const undoInfo = {
        from: 'original-file.md',
        to: '.trash/original-file.md'
      };

      // First call succeeds (original file exists), second call for restored name
      mockDirectoryHandle.getFileHandle
        .mockResolvedValueOnce(mockFileHandle) // File exists at original location
        .mockResolvedValueOnce(mockFileHandle); // Create with "restored" timestamp

      const result = await restoreItemFromTrash(undoInfo, mockDirectoryHandle);

      expect(result).toMatch(/^original-file-restored-\d+\.md$/);
    });

    it('should throw error if no directory handle provided', async () => {
      const undoInfo = { from: 'test.md', to: '.trash/test.md' };

      await expect(restoreItemFromTrash(undoInfo, null)).rejects.toThrow('Please select a directory first');
    });

    it('should throw error if restore fails', async () => {
      const undoInfo = { from: 'test.md', to: '.trash/test.md' };
      mockTrashHandle.getFileHandle.mockRejectedValueOnce(new Error('File not found'));

      await expect(restoreItemFromTrash(undoInfo, mockDirectoryHandle)).rejects.toThrow('Error restoring file');
    });
  });

  describe('selectDirectory', () => {
    it('should open directory picker and return handle', async () => {
      const mockHandle = {
        name: 'Test Directory'
      };

      global.showDirectoryPicker = vi.fn(() => Promise.resolve(mockHandle));

      const result = await selectDirectory();

      expect(global.showDirectoryPicker).toHaveBeenCalledWith({ mode: 'readwrite' });
      expect(result).toBe(mockHandle);
    });

    it('should throw error if picker is cancelled (AbortError)', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      global.showDirectoryPicker = vi.fn(() => Promise.reject(abortError));

      await expect(selectDirectory()).rejects.toThrow('User cancelled');
    });

    it('should throw descriptive error for other failures', async () => {
      const error = new Error('Permission denied');
      global.showDirectoryPicker = vi.fn(() => Promise.reject(error));

      await expect(selectDirectory()).rejects.toThrow('Make sure you\'re using Chrome, Edge, or Opera');
    });
  });
});
