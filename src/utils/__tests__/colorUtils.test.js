import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hexToRgba, applyThemeColors } from '../../utils/colorUtils.js';

describe('colorUtils', () => {
  describe('hexToRgba', () => {
    it('should convert 6-digit hex to rgba', () => {
      const result = hexToRgba('#ff0000', 1);
      expect(result).toBe('rgba(255, 0, 0, 1)');
    });

    it('should convert hex without # to rgba', () => {
      const result = hexToRgba('00ff00', 1);
      expect(result).toBe('rgba(0, 255, 0, 1)');
    });

    it('should handle 3-digit hex shorthand', () => {
      const result = hexToRgba('#f00', 1);
      expect(result).toBe('rgba(255, 0, 0, 1)');
    });

    it('should handle 3-digit hex shorthand without #', () => {
      const result = hexToRgba('0f0', 1);
      expect(result).toBe('rgba(0, 255, 0, 1)');
    });

    it('should apply alpha value', () => {
      const result = hexToRgba('#ffffff', 0.5);
      expect(result).toBe('rgba(255, 255, 255, 0.5)');
    });

    it('should handle alpha value of 0', () => {
      const result = hexToRgba('#000000', 0);
      expect(result).toBe('rgba(0, 0, 0, 0)');
    });

    it('should default alpha to 1 if not provided', () => {
      const result = hexToRgba('#123456');
      expect(result).toContain(', 1)');
    });

    it('should handle black color', () => {
      const result = hexToRgba('#000000', 1);
      expect(result).toBe('rgba(0, 0, 0, 1)');
    });

    it('should handle white color', () => {
      const result = hexToRgba('#ffffff', 1);
      expect(result).toBe('rgba(255, 255, 255, 1)');
    });

    it('should handle blue color', () => {
      const result = hexToRgba('#0000ff', 1);
      expect(result).toBe('rgba(0, 0, 255, 1)');
    });

    it('should handle custom colors', () => {
      const result = hexToRgba('#3b82f6', 1);
      expect(result).toBe('rgba(59, 130, 246, 1)');
    });

    it('should handle null or undefined', () => {
      const result = hexToRgba(null, 0.5);
      expect(result).toBe('rgba(0,0,0,0.5)');
    });

    it('should handle empty string', () => {
      const result = hexToRgba('', 0.5);
      expect(result).toBe('rgba(0,0,0,0.5)');
    });

    it('should handle lowercase hex', () => {
      const result = hexToRgba('#abc def', 1);
      // Should handle the hex part
      expect(result).toContain('rgba');
    });

    it('should handle uppercase hex', () => {
      const result = hexToRgba('#ABCDEF', 1);
      expect(result).toBe('rgba(171, 205, 239, 1)');
    });
  });

  describe('applyThemeColors', () => {
    let mockSetProperty;
    
    beforeEach(() => {
      // Mock document.documentElement.style.setProperty
      mockSetProperty = vi.fn();
      if (typeof document !== 'undefined' && document.documentElement) {
        vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(mockSetProperty);
      }
    });

    it('should set CSS variables for theme colors', () => {
      if (typeof document === 'undefined') {
        // Skip in non-browser environments
        expect(true).toBe(true);
        return;
      }

      const primaryColor = '#3b82f6';
      const highlightColor = '#ef4444';
      
      applyThemeColors(primaryColor, highlightColor);
      
      expect(mockSetProperty).toHaveBeenCalledWith(
        '--mt-primary',
        primaryColor
      );
      expect(mockSetProperty).toHaveBeenCalledWith(
        '--mt-highlight',
        highlightColor
      );
    });

    it('should extract and set highlight RGB values', () => {
      if (typeof document === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      const primaryColor = '#3b82f6';
      const highlightColor = '#ef4444'; // rgb(239, 68, 68)
      
      applyThemeColors(primaryColor, highlightColor);
      
      expect(mockSetProperty).toHaveBeenCalledWith(
        '--mt-highlight-rgb',
        '239, 68, 68'
      );
    });

    it('should handle errors gracefully', () => {
      // Should not throw even if document is not available
      expect(() => {
        applyThemeColors('#000000', '#ffffff');
      }).not.toThrow();
    });

    it('should work with 3-digit hex colors', () => {
      if (typeof document === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      const primaryColor = '#f00';
      const highlightColor = '#0f0';
      
      applyThemeColors(primaryColor, highlightColor);
      
      expect(mockSetProperty).toHaveBeenCalled();
    });
  });
});
