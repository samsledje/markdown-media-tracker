import { useState, useEffect } from 'react';
import { loadThemeColors, saveThemeColors, loadCardSize, saveCardSize } from '../services/configService.js';
import { applyThemeColors } from '../utils/colorUtils.js';

/**
 * Custom hook for managing theme and appearance settings
 * @returns {object} Theme state and actions
 */
export const useTheme = () => {
  const [primaryColor, setPrimaryColor] = useState(() => {
    const { primary } = loadThemeColors();
    return primary;
  });

  const [highlightColor, setHighlightColor] = useState(() => {
    const { highlight } = loadThemeColors();
    return highlight;
  });

  const [cardSize, setCardSize] = useState(() => {
    return loadCardSize();
  });

  // Apply theme colors when they change
  useEffect(() => {
    saveThemeColors(primaryColor, highlightColor);
    applyThemeColors(primaryColor, highlightColor);
  }, [primaryColor, highlightColor]);

  // Save card size when it changes
  useEffect(() => {
    saveCardSize(cardSize);
  }, [cardSize]);

  /**
   * Update primary color
   */
  const updatePrimaryColor = (color) => {
    setPrimaryColor(color);
  };

  /**
   * Update highlight color
   */
  const updateHighlightColor = (color) => {
    setHighlightColor(color);
  };

  /**
   * Update card size
   */
  const updateCardSize = (size) => {
    setCardSize(size);
  };

  /**
   * Reset theme to defaults
   */
  const resetTheme = () => {
    const { primary, highlight } = loadThemeColors();
    setPrimaryColor('#0b1220');
    setHighlightColor('#7c3aed');
  };

  return {
    primaryColor,
    highlightColor,
    cardSize,
    updatePrimaryColor,
    updateHighlightColor,
    updateCardSize,
    resetTheme
  };
};