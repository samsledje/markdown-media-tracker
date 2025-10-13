import { useState, useEffect } from 'react';
import { loadHalfStarsEnabled, saveHalfStarsEnabled } from '../services/configService.js';

/**
 * Custom hook for managing half stars setting
 * @returns {[boolean, function]} [halfStarsEnabled, setHalfStarsEnabled]
 */
export const useHalfStars = () => {
  const [halfStarsEnabled, setHalfStarsEnabledState] = useState(() => loadHalfStarsEnabled());

  const setHalfStarsEnabled = (enabled) => {
    setHalfStarsEnabledState(enabled);
    saveHalfStarsEnabled(enabled);
  };

  // Load on mount
  useEffect(() => {
    const enabled = loadHalfStarsEnabled();
    setHalfStarsEnabledState(enabled);
  }, []);

  return [halfStarsEnabled, setHalfStarsEnabled];
};
