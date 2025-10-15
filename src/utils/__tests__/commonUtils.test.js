import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isTyping, isMobileScreen } from '../commonUtils.js';

describe('commonUtils', () => {
  describe('isTyping', () => {
    it('should return true when user is typing in an input', () => {
      // Mock document.activeElement
      const mockInput = { tagName: 'INPUT' };
      Object.defineProperty(document, 'activeElement', {
        value: mockInput,
        writable: true
      });

      expect(isTyping()).toBe(true);
    });

    it('should return true when user is typing in a textarea', () => {
      const mockTextarea = { tagName: 'TEXTAREA' };
      Object.defineProperty(document, 'activeElement', {
        value: mockTextarea,
        writable: true
      });

      expect(isTyping()).toBe(true);
    });

    it('should return true when user is typing in a contenteditable element', () => {
      const mockEditable = { tagName: 'DIV', isContentEditable: true };
      Object.defineProperty(document, 'activeElement', {
        value: mockEditable,
        writable: true
      });

      expect(isTyping()).toBe(true);
    });

    it('should return true when user is typing in an element with textbox role', () => {
      const mockTextbox = { tagName: 'DIV', getAttribute: () => 'textbox' };
      Object.defineProperty(document, 'activeElement', {
        value: mockTextbox,
        writable: true
      });

      expect(isTyping()).toBe(true);
    });

    it('should return false when no active element', () => {
      Object.defineProperty(document, 'activeElement', {
        value: null,
        writable: true
      });

      expect(isTyping()).toBe(false);
    });

    it('should return false when active element is not an input type', () => {
      const mockButton = { tagName: 'BUTTON' };
      Object.defineProperty(document, 'activeElement', {
        value: mockButton,
        writable: true
      });

      expect(isTyping()).toBe(false);
    });
  });

  describe('isMobileScreen', () => {
    let originalInnerWidth;

    beforeEach(() => {
      originalInnerWidth = window.innerWidth;
    });

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        writable: true
      });
    });

    it('should return true for mobile screen width (< 640px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 639,
        writable: true
      });

      expect(isMobileScreen()).toBe(true);
    });

    it('should return false for desktop screen width (>= 640px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 640,
        writable: true
      });

      expect(isMobileScreen()).toBe(false);
    });

    it('should return false for larger screen widths', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true
      });

      expect(isMobileScreen()).toBe(false);
    });
  });
});