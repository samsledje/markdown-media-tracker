import { useState, useEffect } from 'react';
import { getConfig, saveConfig, hasApiKey } from '../config.js';

/**
 * Custom hook for managing OMDb API key
 * @returns {object} API key state and actions
 */
export const useOmdbApi = () => {
  const [omdbApiKey, setOmdbApiKey] = useState('');

  // Load API key on mount
  useEffect(() => {
    const currentKey = getConfig('omdbApiKey');
    setOmdbApiKey(currentKey || '');
  }, []);

  /**
   * Update and save API key
   */
  const updateApiKey = (key) => {
    setOmdbApiKey(key);
    saveConfig({ omdbApiKey: key });
  };

  return {
    omdbApiKey,
    updateApiKey,
    hasApiKey: hasApiKey()
  };
};