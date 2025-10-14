import { vi } from 'vitest';

/**
 * Mock OMDb API responses
 */
export const mockOmdbSearchResponse = {
  Search: [
    {
      Title: 'The Matrix',
      Year: '1999',
      imdbID: 'tt0133093',
      Type: 'movie',
      Poster: 'https://example.com/matrix.jpg',
    },
    {
      Title: 'The Matrix Reloaded',
      Year: '2003',
      imdbID: 'tt0234215',
      Type: 'movie',
      Poster: 'https://example.com/matrix2.jpg',
    },
  ],
  totalResults: '2',
  Response: 'True',
};

export const mockOmdbDetailResponse = {
  Title: 'The Matrix',
  Year: '1999',
  Rated: 'R',
  Released: '31 Mar 1999',
  Runtime: '136 min',
  Genre: 'Action, Sci-Fi',
  Director: 'Lana Wachowski, Lilly Wachowski',
  Writer: 'Lilly Wachowski, Lana Wachowski',
  Actors: 'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss',
  Plot: 'A computer hacker learns about the true nature of reality.',
  Poster: 'https://example.com/matrix.jpg',
  imdbRating: '8.7',
  imdbID: 'tt0133093',
  Type: 'movie',
  Response: 'True',
};

export const mockOmdbErrorResponse = {
  Response: 'False',
  Error: 'Movie not found!',
};

export const mockOmdbRateLimitResponse = {
  Response: 'False',
  Error: 'Request limit reached!',
};

/**
 * Mock Open Library API responses
 */
export const mockOpenLibrarySearchResponse = {
  numFound: 2,
  docs: [
    {
      title: 'The Great Gatsby',
      author_name: ['F. Scott Fitzgerald'],
      first_publish_year: 1925,
      cover_i: 7984916,
      isbn: ['9780743273565'],
      publisher: ['Scribner'],
    },
    {
      title: 'The Great Gatsby (Special Edition)',
      author_name: ['F. Scott Fitzgerald'],
      first_publish_year: 1925,
      cover_i: 7984917,
      isbn: ['9780743273566'],
    },
  ],
};

export const mockOpenLibraryISBNResponse = {
  'ISBN:9780743273565': {
    title: 'The Great Gatsby',
    authors: [{ name: 'F. Scott Fitzgerald' }],
    publish_date: '2004',
    publishers: ['Scribner'],
    cover: {
      large: 'https://covers.openlibrary.org/b/id/7984916-L.jpg',
    },
  },
};

export const mockOpenLibraryErrorResponse = {
  error: 'not_found',
};

/**
 * Mock fetch responses for API testing
 */
export function mockFetch() {
  return vi.fn((url) => {
    // OMDb API
    if (url.includes('omdbapi.com')) {
      if (url.includes('s=')) {
        // Search request
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOmdbSearchResponse),
        });
      } else if (url.includes('i=') || url.includes('t=')) {
        // Detail request
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOmdbDetailResponse),
        });
      }
    }

    // Open Library API
    if (url.includes('openlibrary.org')) {
      if (url.includes('/search.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOpenLibrarySearchResponse),
        });
      } else if (url.includes('/isbn/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOpenLibraryISBNResponse),
        });
      }
    }

    // Default error response
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    });
  });
}

/**
 * Mock fetch with error responses
 */
export function mockFetchWithErrors() {
  return vi.fn(() =>
    Promise.resolve({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    })
  );
}

/**
 * Mock fetch with network error
 */
export function mockFetchWithNetworkError() {
  return vi.fn(() => Promise.reject(new Error('Network error')));
}

/**
 * Mock fetch with rate limit error
 */
export function mockFetchWithRateLimit() {
  return vi.fn((url) => {
    if (url.includes('omdbapi.com')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOmdbRateLimitResponse),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Too many requests' }),
    });
  });
}
