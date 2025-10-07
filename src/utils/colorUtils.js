// Color utility functions

/**
 * Convert hex color to rgba format
 * @param {string} hex - Hex color string (with or without #)
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Apply theme colors to CSS variables
 * @param {string} primaryColor - Primary theme color
 * @param {string} highlightColor - Highlight theme color
 */
export const applyThemeColors = (primaryColor, highlightColor) => {
  try {
    document.documentElement.style.setProperty('--mt-primary', primaryColor);
    document.documentElement.style.setProperty('--mt-highlight', highlightColor);
  } catch (e) {
    // ignore (server-side or non-browser)
  }
};