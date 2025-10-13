/**
 * Sample items for testing
 */

export const sampleBook = {
  id: 'test-book-1',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  type: 'book',
  status: 'read',
  rating: 5,
  genre: 'Fiction',
  year: '1925',
  tags: ['classic', 'american-literature'],
  cover: 'https://example.com/gatsby.jpg',
  notes: 'A masterpiece of American literature.',
  dateRead: '2024-01-15',
  dateAdded: '2024-01-10',
};

export const sampleMovie = {
  id: 'test-movie-1',
  title: 'The Matrix',
  director: 'The Wachowskis',
  type: 'movie',
  status: 'watched',
  rating: 5,
  genre: 'Sci-Fi',
  year: '1999',
  tags: ['sci-fi', 'action'],
  cover: 'https://example.com/matrix.jpg',
  notes: 'Mind-bending action movie.',
  dateWatched: '2024-02-20',
  dateAdded: '2024-02-15',
};

export const sampleBookUnrated = {
  id: 'test-book-2',
  title: 'To Kill a Mockingbird',
  author: 'Harper Lee',
  type: 'book',
  status: 'reading',
  rating: 0,
  genre: 'Fiction',
  year: '1960',
  tags: ['classic'],
  dateAdded: '2024-03-01',
};

export const sampleMovieWatchlist = {
  id: 'test-movie-2',
  title: 'Inception',
  director: 'Christopher Nolan',
  type: 'movie',
  status: 'to-watch',
  rating: 0,
  genre: 'Sci-Fi',
  year: '2010',
  tags: ['sci-fi', 'thriller'],
  dateAdded: '2024-03-05',
};

export const sampleItems = [
  sampleBook,
  sampleMovie,
  sampleBookUnrated,
  sampleMovieWatchlist,
];

export const sampleMarkdownWithFrontmatter = `---
title: "The Great Gatsby"
author: "F. Scott Fitzgerald"
type: "book"
status: "read"
rating: 5
genre: "Fiction"
year: "1925"
tags:
  - classic
  - american-literature
cover: "https://example.com/gatsby.jpg"
date_read: "2024-01-15"
date_added: "2024-01-10"
---

A masterpiece of American literature.`;

export const sampleMarkdownWithoutFrontmatter = `Just some notes without any frontmatter.
This should still be parseable.`;

export const sampleMarkdownMalformed = `---
title: "Bad YAML
author: This won't parse
---

Content here.`;
