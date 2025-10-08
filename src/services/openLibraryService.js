// Open Library API service for book searches

const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org';
const COVERS_BASE_URL = 'https://covers.openlibrary.org';

/**
 * Search for books using Open Library API
 * Note: This function requests edition data to get ISBN information from the most relevant edition.
 * It prefers ISBN-13 over ISBN-10 when both are available.
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 12)
 * @returns {Promise<object[]>} Array of book objects
 */
export const searchBooks = async (query, limit = 12) => {
  if (!query.trim()) {
    throw new Error('Query cannot be empty');
  }

  try {
    // Request edition ISBN data along with work data
    const response = await fetch(
      `${OPEN_LIBRARY_BASE_URL}/search.json?q=${encodeURIComponent(query)}&fields=key,title,author_name,first_publish_year,cover_i,editions,editions.isbn&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const books = data.docs.slice(0, limit).map(book => {
      // Get the best ISBN from the most relevant edition
      let isbn = null;
      if (book.editions && book.editions.docs && book.editions.docs.length > 0) {
        const firstEdition = book.editions.docs[0];
        if (firstEdition.isbn && firstEdition.isbn.length > 0) {
          // Prefer ISBN-13 (13 characters) over ISBN-10 (10 characters)
          const isbn13 = firstEdition.isbn.find(isbn => isbn.length === 13);
          const isbn10 = firstEdition.isbn.find(isbn => isbn.length === 10);
          isbn = isbn13 || isbn10 || firstEdition.isbn[0];
        }
      }

      return {
        title: book.title || 'Unknown Title',
        author: book.author_name?.[0] || 'Unknown Author',
        year: book.first_publish_year,
        isbn: isbn,
        coverUrl: book.cover_i 
          ? `${COVERS_BASE_URL}/b/id/${book.cover_i}-M.jpg`
          : null,
        type: 'book'
      };
    });
    
    return books;
  } catch (error) {
    console.error('Error searching books:', error);
    throw new Error('Error searching for books. Please try again.');
  }
};