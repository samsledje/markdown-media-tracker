/**
 * Check if user is currently typing in an input/textarea/contenteditable
 * @returns {boolean} True if user is typing
 */
export const isTyping = () => {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName && el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || el.isContentEditable) return true;
  if (el.getAttribute && el.getAttribute('role') === 'textbox') return true;
  return false;
};

/**
 * Generate a filename for an item
 * @param {string} title - Item title
 * @returns {string} Generated filename
 */
export const generateFilename = (title) => {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
};

/**
 * Check for duplicate items based on title and author
 * @param {object[]} items - Existing items array
 * @param {object} newItem - New item to check
 * @returns {boolean} True if duplicate exists
 */
export const isDuplicate = (items, newItem) => {
  return items.some(it => 
    (it.title || '').toLowerCase() === (newItem.title || '').toLowerCase() && 
    (it.author || '').toLowerCase() === (newItem.author || '').toLowerCase()
  );
};