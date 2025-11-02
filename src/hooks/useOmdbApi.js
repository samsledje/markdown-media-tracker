import { useState, useEffect } from 'react';
import { getConfig, saveConfig, hasApiKey } from '../config.js';
import { loadAllSettings, saveAllSettings } from '../services/configService.js';

/**
 * Custom hook for managing OMDb API key
 * @param {StorageAdapter} storage - Storage adapter instance (optional)
 * @returns {object} API key state and actions
 */
export const useOmdbApi = (storage = null) => {
  const [omdbApiKey, setOmdbApiKey] = useState('');

  // Load API key on mount and when storage changes
  useEffect(() => {
    if (storage && storage.isConnected()) {
      loadAllSettings(storage).then(settings => {
        const key = settings.omdbApiKey || getConfig('omdbApiKey');
        setOmdbApiKey(key || '');
      }).catch(err => {
        console.warn('Error loading OMDb API key from file:', err);
        const currentKey = getConfig('omdbApiKey');
        setOmdbApiKey(currentKey || '');
      });
    } else {
      const currentKey = getConfig('omdbApiKey');
      setOmdbApiKey(currentKey || '');
    }
  }, [storage]);

  /**
   * Update and save API key
   */
  const updateApiKey = (key) => {
    setOmdbApiKey(key);
    saveConfig({ omdbApiKey: key });
    // Also save to file if storage is available
    if (storage && storage.isConnected()) {
      saveAllSettings(storage, { omdbApiKey: key });
    }
  };

  return {
    omdbApiKey,
    updateApiKey,
    hasApiKey: hasApiKey()
  };
};