// Configuration service for managing app settings

import { LOCAL_STORAGE_KEYS, DEFAULT_THEME } from '../constants/index.js';

/**
 * Load OMDb API key from localStorage
 * @returns {string} API key or empty string
 */
export const loadOmdbApiKey = () => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.OMDB_API_KEY) || '';
  } catch (error) {
    console.warn('Error loading OMDb API key:', error);
    return '';
  }
};

/**
 * Save OMDb API key to localStorage
 * @param {string} apiKey - API key to save
 */
export const saveOmdbApiKey = (apiKey) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.OMDB_API_KEY, apiKey);
  } catch (error) {
    console.warn('Error saving OMDb API key:', error);
  }
};

/**
 * Load theme colors from localStorage
 * @returns {object} Theme colors
 */
export const loadThemeColors = () => {
  try {
    return {
      primary: localStorage.getItem(LOCAL_STORAGE_KEYS.THEME_PRIMARY) || DEFAULT_THEME.PRIMARY,
      highlight: localStorage.getItem(LOCAL_STORAGE_KEYS.THEME_HIGHLIGHT) || DEFAULT_THEME.HIGHLIGHT
    };
  } catch (error) {
    console.warn('Error loading theme colors:', error);
    return DEFAULT_THEME;
  }
};

/**
 * Save theme colors to localStorage
 * @param {string} primary - Primary color
 * @param {string} highlight - Highlight color
 */
export const saveThemeColors = (primary, highlight) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME_PRIMARY, primary);
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME_HIGHLIGHT, highlight);
  } catch (error) {
    console.warn('Error saving theme colors:', error);
  }
};

/**
 * Load card size from localStorage
 * @returns {string} Card size
 */
export const loadCardSize = () => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.CARD_SIZE) || 'medium';
  } catch (error) {
    console.warn('Error loading card size:', error);
    return 'medium';
  }
};

/**
 * Save card size to localStorage
 * @param {string} size - Card size
 */
export const saveCardSize = (size) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CARD_SIZE, size);
  } catch (error) {
    console.warn('Error saving card size:', error);
  }
};