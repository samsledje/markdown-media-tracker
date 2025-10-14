import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';
import { DEFAULT_THEME, CARD_SIZES } from '../../constants/index.js';

describe('useTheme', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with default theme colors', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.primaryColor).toBe(DEFAULT_THEME.PRIMARY);
      expect(result.current.highlightColor).toBe(DEFAULT_THEME.HIGHLIGHT);
    });

    it('should initialize with default card size', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.cardSize).toBe(CARD_SIZES.MEDIUM);
    });

    it('should load saved theme colors from localStorage', () => {
      localStorage.setItem('themePrimary', '#ff0000');
      localStorage.setItem('themeHighlight', '#00ff00');

      const { result } = renderHook(() => useTheme());

      expect(result.current.primaryColor).toBe('#ff0000');
      expect(result.current.highlightColor).toBe('#00ff00');
    });

    it('should load saved card size from localStorage', () => {
      localStorage.setItem('cardSize', CARD_SIZES.LARGE);

      const { result } = renderHook(() => useTheme());

      expect(result.current.cardSize).toBe(CARD_SIZES.LARGE);
    });
  });

  describe('updatePrimaryColor', () => {
    it('should update primary color', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.updatePrimaryColor('#ff0000');
      });

      expect(result.current.primaryColor).toBe('#ff0000');
    });

    it('should persist primary color to localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.updatePrimaryColor('#ff0000');
      });

      expect(localStorage.getItem('themePrimary')).toBe('#ff0000');
    });
  });

  describe('updateHighlightColor', () => {
    it('should update highlight color', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.updateHighlightColor('#00ff00');
      });

      expect(result.current.highlightColor).toBe('#00ff00');
    });

    it('should persist highlight color to localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.updateHighlightColor('#00ff00');
      });

      expect(localStorage.getItem('themeHighlight')).toBe('#00ff00');
    });
  });

  describe('updateCardSize', () => {
    it('should update card size', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.updateCardSize(CARD_SIZES.SMALL);
      });

      expect(result.current.cardSize).toBe(CARD_SIZES.SMALL);
    });

    it('should persist card size to localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.updateCardSize(CARD_SIZES.XLARGE);
      });

      expect(localStorage.getItem('cardSize')).toBe(CARD_SIZES.XLARGE);
    });

    it('should update through all card sizes', () => {
      const { result } = renderHook(() => useTheme());

      const sizes = [CARD_SIZES.TINY, CARD_SIZES.SMALL, CARD_SIZES.MEDIUM, CARD_SIZES.LARGE, CARD_SIZES.XLARGE];

      sizes.forEach(size => {
        act(() => {
          result.current.updateCardSize(size);
        });
        expect(result.current.cardSize).toBe(size);
      });
    });
  });

  describe('resetTheme', () => {
    it('should reset colors to defaults', () => {
      const { result } = renderHook(() => useTheme());

      // Change colors first
      act(() => {
        result.current.updatePrimaryColor('#ff0000');
        result.current.updateHighlightColor('#00ff00');
      });

      expect(result.current.primaryColor).toBe('#ff0000');
      expect(result.current.highlightColor).toBe('#00ff00');

      // Reset
      act(() => {
        result.current.resetTheme();
      });

      expect(result.current.primaryColor).toBe('#0b1220');
      expect(result.current.highlightColor).toBe('#7c3aed');
    });
  });

  describe('persistence', () => {
    it('should maintain theme across hook remounts', () => {
      const { result: result1 } = renderHook(() => useTheme());

      act(() => {
        result1.current.updatePrimaryColor('#123456');
        result1.current.updateHighlightColor('#abcdef');
        result1.current.updateCardSize(CARD_SIZES.TINY);
      });

      // Unmount and remount
      const { result: result2 } = renderHook(() => useTheme());

      expect(result2.current.primaryColor).toBe('#123456');
      expect(result2.current.highlightColor).toBe('#abcdef');
      expect(result2.current.cardSize).toBe(CARD_SIZES.TINY);
    });

    it('should update both colors simultaneously', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.updatePrimaryColor('#111111');
        result.current.updateHighlightColor('#222222');
      });

      expect(result.current.primaryColor).toBe('#111111');
      expect(result.current.highlightColor).toBe('#222222');
      expect(localStorage.getItem('themePrimary')).toBe('#111111');
      expect(localStorage.getItem('themeHighlight')).toBe('#222222');
    });
  });
});
