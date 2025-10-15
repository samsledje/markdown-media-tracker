import { vi } from 'vitest';

/**
 * Mock localStorage implementation for testing
 */
export class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  get length() {
    return Object.keys(this.store).length;
  }
}

/**
 * Create and setup mock localStorage
 */
export function setupMockLocalStorage() {
  const mockStorage = new MockLocalStorage();
  
  global.localStorage = {
    getItem: vi.fn((key) => mockStorage.getItem(key)),
    setItem: vi.fn((key, value) => mockStorage.setItem(key, value)),
    removeItem: vi.fn((key) => mockStorage.removeItem(key)),
    clear: vi.fn(() => mockStorage.clear()),
  };
  
  return mockStorage;
}
