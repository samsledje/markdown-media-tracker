// OMDb API service for movie searches

const OMDB_BASE_URL = 'https://www.omdbapi.com';

/**
 * Search for movies using OMDb API
 * @param {string} query - Search query
 * @param {string} apiKey - OMDb API key
 * @param {number} limit - Maximum number of results (default: 12)
 * @returns {Promise<object[]>} Array of movie objects
 */
export const searchMovies = async (query, apiKey, limit = 12) => {
  if (!query.trim()) {
    throw new Error('Query cannot be empty');
  }

  if (!apiKey) {
    throw new Error('API key is required for movie searches');
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
          
          return {
            title: details.Title,
            director: details.Director !== 'N/A' ? details.Director : '',
            actors: details.Actors !== 'N/A' ? details.Actors.split(', ') : [],
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
 * @param {string} apiKey - API key to validate
 * @returns {Promise<boolean>} True if valid
 */
export const validateApiKey = async (apiKey) => {
  if (!apiKey) return false;
  
  try {
    const response = await fetch(`${OMDB_BASE_URL}/?t=test&apikey=${apiKey}`);
    const data = await response.json();
    return data.Response !== 'False' || data.Error !== 'Invalid API key!';
  } catch (error) {
    return false;
  }
};