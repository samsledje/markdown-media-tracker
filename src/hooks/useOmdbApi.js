import { useState, useEffect } from 'react';
import { loadOmdbApiKey, saveOmdbApiKey } from '../services/configService.js';
import { config } from '../config.js';

/**
 * Custom hook for managing OMDb API key
 * @returns {object} API key state and actions
 */
export const useOmdbApi = () => {
  const [omdbApiKey, setOmdbApiKey] = useState('');

  // Load API key on mount
  useEffect(() => {
    const storedKey = loadOmdbApiKey();
    if (storedKey) {
      setOmdbApiKey(storedKey);
    } else if (config.omdbApiKey) {
      // Fall back to config.js if no stored key
      setOmdbApiKey(config.omdbApiKey);
    }
  }, []);

  /**
   * Update and save API key
   */
  const updateApiKey = (key) => {
    setOmdbApiKey(key);
    saveOmdbApiKey(key);
  };

  return {
    omdbApiKey,
    updateApiKey
  };
};