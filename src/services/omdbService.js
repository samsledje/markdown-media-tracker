// OMDb API service for movie searches
import { getConfig, hasApiKey } from '../config.js';
import { generateFuzzyAlternatives, shouldTryFuzzySearch } from '../utils/fuzzySearchUtils.js';

const OMDB_BASE_URL = 'https://www.omdbapi.com';

/**
 * Custom error class for OMDB API errors
 */
export class OMDBError extends Error {
  constructor(message, type, statusCode = null) {
    super(message);
    this.name = 'OMDBError';
    this.type = type; // 'AUTH_FAILED', 'RATE_LIMIT', 'QUOTA_EXCEEDED', 'NETWORK', 'INVALID_KEY'
    this.statusCode = statusCode;
  }
}

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

  const trimmedQuery = query.trim();

  try {
    // Try the original search first
    const movies = await performMovieSearch(trimmedQuery, limit, apiKey);

    // If we got results or this was already a fuzzy attempt, return them
    if (!shouldTryFuzzySearch(movies, 1)) {
      return movies;
    }

    // Try fuzzy alternatives
    console.debug('[OMDb] No results for exact search, trying fuzzy alternatives');
    const alternatives = generateFuzzyAlternatives(trimmedQuery, 2);

    for (const alternative of alternatives) {
      console.debug(`[OMDb] Trying fuzzy alternative: "${alternative}"`);
      try {
        const fuzzyMovies = await performMovieSearch(alternative, limit, apiKey);
        if (fuzzyMovies.length > 0) {
          console.debug(`[OMDb] Found ${fuzzyMovies.length} results with fuzzy search: "${alternative}"`);
          // Mark these results as coming from fuzzy search
          return fuzzyMovies.map(movie => ({ ...movie, _fuzzySearch: true, _originalQuery: trimmedQuery }));
        }
      } catch (error) {
        // Continue to next alternative if this one fails
        console.debug(`[OMDb] Fuzzy alternative "${alternative}" failed:`, error.message);
      }
    }

    // Return empty array if no fuzzy alternatives worked
    return movies;
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

/**
 * Internal function to perform the actual movie search
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @param {string} apiKey - OMDb API key
 * @returns {Promise<object[]>} Array of movie objects
 */
const performMovieSearch = async (query, limit, apiKey) => {
  const response = await fetch(
    `${OMDB_BASE_URL}/?s=${encodeURIComponent(query)}&apikey=${apiKey}`
  );

  // Check for HTTP errors
  if (!response.ok) {
    if (response.status === 401) {
      throw new OMDBError(
        'OMDb API authentication failed. Your API key may be invalid or expired.',
        'AUTH_FAILED',
        401
      );
    } else if (response.status === 429) {
      throw new OMDBError(
        'OMDb API rate limit exceeded. Please try again later.',
        'RATE_LIMIT',
        429
      );
    }
    throw new OMDBError(
      `OMDb API error: ${response.status}`,
      'NETWORK',
      response.status
    );
  }

  const data = await response.json();

  if (data.Response === 'False') {
    if (data.Error === 'Invalid API key!') {
      throw new OMDBError(
        'Invalid OMDb API key. Please check your API key in settings.',
        'INVALID_KEY'
      );
    } else if (data.Error && data.Error.toLowerCase().includes('limit')) {
      throw new OMDBError(
        'OMDb API daily limit reached. You can continue importing without movie data enrichment.',
        'QUOTA_EXCEEDED'
      );
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
};/**
 * Get a single movie by title and optional year using OMDb API
 * @param {string} title - Movie title
 * @param {string|number} year - Optional year to narrow search
 * @returns {Promise<object|null>} Movie details or null if not found
 */
export const getMovieByTitleYear = async (title, year = null) => {
  if (!title || !String(title).trim()) return null;

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  try {
    const response = await fetch(`${OMDB_BASE_URL}/?t=${encodeURIComponent(title)}${year ? `&y=${encodeURIComponent(String(year))}` : ''}&apikey=${apiKey}`);

    if (!response.ok) {
      if (response.status === 401) {
        throw new OMDBError(
          'OMDb API authentication failed. Your API key may be invalid or expired.',
          'AUTH_FAILED',
          401
        );
      } else if (response.status === 429) {
        throw new OMDBError(
          'OMDb API rate limit exceeded. Please try again later.',
          'RATE_LIMIT',
          429
        );
      }
      throw new OMDBError(
        `OMDb API error: ${response.status}`,
        'NETWORK',
        response.status
      );
    }

    const data = await response.json();

    if (data.Response === 'False') {
      if (data.Error === 'Invalid API key!') {
        throw new OMDBError(
          'Invalid OMDb API key. Please check your API key in settings.',
          'INVALID_KEY'
        );
      } else if (data.Error && data.Error.toLowerCase().includes('limit')) {
        throw new OMDBError(
          'OMDb API daily limit reached. You can continue importing without movie data enrichment.',
          'QUOTA_EXCEEDED'
        );
      }
      return null;
    }

    const actors = data.Actors && data.Actors !== 'N/A' ? data.Actors.split(',').map(a => a.trim()).filter(Boolean) : [];

    return {
      title: data.Title || title,
      director: data.Director && data.Director !== 'N/A' ? data.Director : '',
      actors,
      year: data.Year || year || '',
      coverUrl: data.Poster && data.Poster !== 'N/A' ? data.Poster : null,
      plot: data.Plot && data.Plot !== 'N/A' ? data.Plot : ''
    };
  } catch (error) {
    console.warn('Error in getMovieByTitleYear:', error);
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
  } catch {
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
