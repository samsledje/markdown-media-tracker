import { describe, it, expect } from 'vitest';
import { STATUS_TYPES, STATUS_LABELS, STATUS_ICONS, STATUS_COLORS } from '../../constants/index.js';

/**
 * Test utility functions for status handling
 * These functions are currently defined in components but should be tested
 */

// Mock implementations of the status utility functions
const getStatusIcon = (status, className = '') => {
  const iconType = STATUS_ICONS[status];
  switch (iconType) {
    case 'bookmark':
      return `Bookmark-${className}`;
    case 'layers':
      return `Layers-${className}`;
    case 'book-open':
      return `BookOpen-${className}`;
    case 'check-circle':
      return `CheckCircle-${className}`;
    case 'play-circle':
      return `PlayCircle-${className}`;
    case 'x-circle':
      return `XCircle-${className}`;
    default:
      return `Bookmark-${className}`;
  }
};

const getStatusColorClass = (status) => {
  const colorType = STATUS_COLORS[status];
  switch (colorType) {
    case 'blue':
      return 'bg-blue-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'green':
      return 'bg-green-500';
    case 'red':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
};

describe('Status System', () => {
  describe('STATUS_TYPES', () => {
    it('should define status types for books', () => {
      expect(STATUS_TYPES.BOOK).toHaveProperty('TO_READ', 'to-read');
      expect(STATUS_TYPES.BOOK).toHaveProperty('READING', 'reading');
      expect(STATUS_TYPES.BOOK).toHaveProperty('READ', 'read');
      expect(STATUS_TYPES.BOOK).toHaveProperty('DNF', 'dnf');
    });

    it('should define status types for movies', () => {
      expect(STATUS_TYPES.MOVIE).toHaveProperty('TO_WATCH', 'to-watch');
      expect(STATUS_TYPES.MOVIE).toHaveProperty('WATCHING', 'watching');
      expect(STATUS_TYPES.MOVIE).toHaveProperty('WATCHED', 'watched');
      expect(STATUS_TYPES.MOVIE).toHaveProperty('DNF', 'dnf');
    });
  });

  describe('STATUS_LABELS', () => {
    it('should define labels for all statuses', () => {
      expect(STATUS_LABELS).toHaveProperty('to-read', 'To Read');
      expect(STATUS_LABELS).toHaveProperty('reading', 'Reading');
      expect(STATUS_LABELS).toHaveProperty('read', 'Read');
      expect(STATUS_LABELS).toHaveProperty('to-watch', 'To Watch');
      expect(STATUS_LABELS).toHaveProperty('watching', 'Watching');
      expect(STATUS_LABELS).toHaveProperty('watched', 'Watched');
      expect(STATUS_LABELS).toHaveProperty('dnf', 'Did Not Finish');
    });
  });

  describe('STATUS_ICONS', () => {
    it('should define icons for all statuses', () => {
      expect(STATUS_ICONS).toHaveProperty('to-read', 'layers');
      expect(STATUS_ICONS).toHaveProperty('reading', 'book-open');
      expect(STATUS_ICONS).toHaveProperty('read', 'check-circle');
      expect(STATUS_ICONS).toHaveProperty('to-watch', 'layers');
      expect(STATUS_ICONS).toHaveProperty('watching', 'play-circle');
      expect(STATUS_ICONS).toHaveProperty('watched', 'check-circle');
      expect(STATUS_ICONS).toHaveProperty('dnf', 'x-circle');
    });
  });

  describe('STATUS_COLORS', () => {
    it('should define colors for all statuses', () => {
      expect(STATUS_COLORS).toHaveProperty('to-read', 'blue');
      expect(STATUS_COLORS).toHaveProperty('reading', 'yellow');
      expect(STATUS_COLORS).toHaveProperty('read', 'green');
      expect(STATUS_COLORS).toHaveProperty('to-watch', 'blue');
      expect(STATUS_COLORS).toHaveProperty('watching', 'yellow');
      expect(STATUS_COLORS).toHaveProperty('watched', 'green');
      expect(STATUS_COLORS).toHaveProperty('dnf', 'red');
    });
  });

  describe('getStatusIcon', () => {
    it('should return correct icon for each status', () => {
      expect(getStatusIcon('to-read')).toBe('Layers-');
      expect(getStatusIcon('reading')).toBe('BookOpen-');
      expect(getStatusIcon('read')).toBe('CheckCircle-');
      expect(getStatusIcon('to-watch')).toBe('Layers-');
      expect(getStatusIcon('watching')).toBe('PlayCircle-');
      expect(getStatusIcon('watched')).toBe('CheckCircle-');
      expect(getStatusIcon('dnf')).toBe('XCircle-');
    });

    it('should apply className to icons', () => {
      expect(getStatusIcon('read', 'text-green-500')).toBe('CheckCircle-text-green-500');
      expect(getStatusIcon('dnf', 'w-4 h-4')).toBe('XCircle-w-4 h-4');
    });

    it('should return default icon for unknown status', () => {
      expect(getStatusIcon('unknown')).toBe('Bookmark-');
    });
  });

  describe('getStatusColorClass', () => {
    it('should return correct color class for each status', () => {
      expect(getStatusColorClass('to-read')).toBe('bg-blue-500');
      expect(getStatusColorClass('reading')).toBe('bg-yellow-500');
      expect(getStatusColorClass('read')).toBe('bg-green-500');
      expect(getStatusColorClass('to-watch')).toBe('bg-blue-500');
      expect(getStatusColorClass('watching')).toBe('bg-yellow-500');
      expect(getStatusColorClass('watched')).toBe('bg-green-500');
      expect(getStatusColorClass('dnf')).toBe('bg-red-500');
    });

    it('should return default color for unknown status', () => {
      expect(getStatusColorClass('unknown')).toBe('bg-blue-500');
    });
  });
});