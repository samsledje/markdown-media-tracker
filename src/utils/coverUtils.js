// Utility functions for fetching cover images from external APIs
import { getMovieByTitleYear } from '../services/omdbService.js';
import { getBookByISBN, searchBooks } from '../services/openLibraryService.js';

/**
 * Attempt to fetch a cover URL for an item using available data
 * For books: tries ISBN first, then falls back to title+author search
 * For movies: uses title+year to fetch from OMDb
 * 
 * @param {object} item - The item to fetch cover for
 * @param {string} item.type - 'book' or 'movie'
 * @param {string} item.title - Title of the item
 * @param {string} [item.isbn] - ISBN for books
 * @param {string} [item.author] - Author for books
 * @param {string} [item.director] - Director for movies
 * @param {string} [item.year] - Year of publication/release
 * @returns {Promise<string|null>} Cover URL or null if not found
 */
export const fetchCoverForItem = async (item) => {
  if (!item || !item.type || !item.title) {
    throw new Error('Invalid item: type and title are required');
  }

  if (item.type === 'book') {
    return await fetchBookCover(item);
  } else if (item.type === 'movie') {
    return await fetchMovieCover(item);
  } else {
    throw new Error(`Unsupported item type: ${item.type}`);
  }
};

/**
 * Fetch cover for a book item
 * Tries ISBN first, then title+author search
 * 
 * @param {object} book - Book item
 * @returns {Promise<string|null>} Cover URL or null if not found
 */
const fetchBookCover = async (book) => {
  // Try ISBN first if available
  if (book.isbn && book.isbn.trim()) {
    try {
      const bookData = await getBookByISBN(book.isbn);
      if (bookData && bookData.coverUrl) {
        return bookData.coverUrl;
      }
    } catch (error) {
      console.warn('Error fetching book by ISBN:', error);
      // Continue to title+author search fallback
    }
  }

  // Fallback: search by title+author
  if (book.title && book.title.trim()) {
    try {
      const searchQuery = book.author 
        ? `${book.title} ${book.author}`
        : book.title;
      
      const results = await searchBooks(searchQuery, 1);
      
      if (results && results.length > 0 && results[0].coverUrl) {
        return results[0].coverUrl;
      }
    } catch (error) {
      console.warn('Error searching for book cover:', error);
    }
  }

  return null;
};

/**
 * Fetch cover for a movie item
 * Uses title+year from OMDb
 * 
 * @param {object} movie - Movie item
 * @returns {Promise<string|null>} Cover URL or null if not found
 */
const fetchMovieCover = async (movie) => {
  if (!movie.title || !movie.title.trim()) {
    return null;
  }

  try {
    const movieData = await getMovieByTitleYear(movie.title, movie.year || null);
    
    if (movieData && movieData.coverUrl) {
      return movieData.coverUrl;
    }
  } catch (error) {
    console.warn('Error fetching movie cover:', error);
  }

  return null;
};
