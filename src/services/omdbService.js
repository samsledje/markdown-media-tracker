// OMDb API service for movie searches
import { getConfig, hasApiKey } from '../config.js';

const OMDB_BASE_URL = 'https://www.omdbapi.com';

/**
 * Get the current API key from config
 * @returns {string|null} API key or null if not configured
 */
const getApiKey = () => {
  return hasApiKey() ? getConfig('omdbApiKey') : null;
};

/**
 * Search for movies using OMDb API
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 12)
 * @returns {Promise<object[]>} Array of movie objects
 */
export const searchMovies = async (query, limit = 12) => {
  if (!query.trim()) {
    throw new Error('Query cannot be empty');
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  try {
    const response = await fetch(
      `${OMDB_BASE_URL}/?s=${encodeURIComponent(query)}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.Response === 'False') {
      if (data.Error === 'Invalid API key!') {
        throw new Error('Invalid OMDb API key. Please check your key.');
      } else {
        return [];
      }
    }

    // Get detailed information for each movie
    const detailedMovies = await Promise.all(
      data.Search.slice(0, limit).map(async (movie) => {
        try {
          const detailResponse = await fetch(
            `${OMDB_BASE_URL}/?i=${movie.imdbID}&apikey=${apiKey}`
          );
          
          if (!detailResponse.ok) {
            console.warn(`Failed to get details for ${movie.Title}`);
            return null;
          }
          
          const details = await detailResponse.json();
          
          // Extract and process actors - OMDb typically returns 3-4 main cast members
          let actors = [];
          if (details.Actors && details.Actors !== 'N/A') {
            actors = details.Actors.split(', ').map(actor => actor.trim()).filter(actor => actor);
          }
          
          return {
            title: details.Title,
            director: details.Director !== 'N/A' ? details.Director : '',
            actors: actors,
            year: details.Year,
            coverUrl: details.Poster !== 'N/A' ? details.Poster : null,
            type: 'movie',
            rating: details.imdbRating !== 'N/A' ? Math.round(parseFloat(details.imdbRating) / 2) : 0
          };
        } catch (error) {
          console.warn(`Error getting details for ${movie.Title}:`, error);
          return null;
        }
      })
    );
    
    // Filter out failed requests
    return detailedMovies.filter(movie => movie !== null);
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

/**
 * Validate OMDb API key
 * @param {string} apiKey - API key to validate (optional, uses config if not provided)
 * @returns {Promise<boolean>} True if valid
 */
export const validateApiKey = async (apiKey = null) => {
  const keyToTest = apiKey || getApiKey();
  if (!keyToTest) return false;
  
  try {
    const response = await fetch(`${OMDB_BASE_URL}/?t=test&apikey=${keyToTest}`);
    const data = await response.json();
    return data.Response !== 'False' || data.Error !== 'Invalid API key!';
  } catch (error) {
    return false;
  }
};

/**
 * Check if OMDb service is available (has valid API key)
 * @returns {boolean} True if service is available
 */
export const isServiceAvailable = () => {
  return hasApiKey();
};