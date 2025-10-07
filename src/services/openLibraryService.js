// Open Library API service for book searches

const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org';
const COVERS_BASE_URL = 'https://covers.openlibrary.org';

/**
 * Search for books using Open Library API
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 12)
 * @returns {Promise<object[]>} Array of book objects
 */
export const searchBooks = async (query, limit = 12) => {
  if (!query.trim()) {
    throw new Error('Query cannot be empty');
  }

  try {
    const response = await fetch(
      `${OPEN_LIBRARY_BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const books = data.docs.slice(0, limit).map(book => ({
      title: book.title || 'Unknown Title',
      author: book.author_name?.[0] || 'Unknown Author',
      year: book.first_publish_year,
      isbn: book.isbn?.[0],
      coverUrl: book.cover_i 
        ? `${COVERS_BASE_URL}/b/id/${book.cover_i}-M.jpg`
        : null,
      type: 'book'
    }));
    
    return books;
  } catch (error) {
    console.error('Error searching books:', error);
    throw new Error('Error searching for books. Please try again.');
  }
};