// Markdown parsing and generation utilities
import { STATUS_TYPES } from '../constants/index.js';

/**
 * Get default status for item type (for backward compatibility)
 * @param {string} type - Item type ('book' or 'movie')
 * @returns {string} Default status value
 */
const getDefaultStatus = (type) => {
  return type === 'book' ? STATUS_TYPES.BOOK.READ : STATUS_TYPES.MOVIE.WATCHED;
};

/**
 * Parse markdown content with YAML frontmatter
 * @param {string} content - Raw markdown content
 * @returns {object} Object with metadata and body
 */
export const parseMarkdown = (content) => {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) return { metadata: {}, body: content };
  
  const metadata = {};
  const yamlLines = match[1].split('\n');
  
  yamlLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
      } else {
        value = value.replace(/['"]/g, '');
      }
      
      metadata[key] = value;
    }
  });

  // Add default status for backward compatibility if not present
  if (!metadata.status && metadata.type) {
    metadata.status = getDefaultStatus(metadata.type);
  }
  
  return { metadata, body: match[2].trim() };
};

/**
 * Generate markdown content with YAML frontmatter
 * @param {object} item - Item object
 * @returns {string} Markdown content with frontmatter
 */
export const generateMarkdown = (item) => {
  let yaml = '---\n';
  yaml += `title: "${item.title}"\n`;
  yaml += `type: ${item.type}\n`;
  
  // Add status field with default if not present
  const status = item.status || getDefaultStatus(item.type);
  yaml += `status: ${status}\n`;
  
  if (item.author) yaml += `author: "${item.author}"\n`;
  if (item.director) yaml += `director: "${item.director}"\n`;
  if (item.actors) yaml += `actors: [${item.actors.map(a => `"${a}"`).join(', ')}]\n`;
  if (item.isbn) yaml += `isbn: "${item.isbn}"\n`;
  if (item.year) yaml += `year: ${item.year}\n`;
  if (item.rating) yaml += `rating: ${item.rating}\n`;
  if (item.tags && item.tags.length > 0) yaml += `tags: [${item.tags.map(t => `"${t}"`).join(', ')}]\n`;
  if (item.coverUrl) yaml += `coverUrl: "${item.coverUrl}"\n`;
  
  if (item.dateRead) yaml += `dateRead: "${item.dateRead}"\n`;
  if (item.dateWatched) yaml += `dateWatched: "${item.dateWatched}"\n`;
  yaml += `dateAdded: "${item.dateAdded}"\n`;
  yaml += '---\n\n';
  
  return yaml + (item.review || '');
};