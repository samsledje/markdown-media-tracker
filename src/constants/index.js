// Application constants and configuration

export const CARD_SIZES = {
  TINY: 'tiny',
  SMALL: 'small', 
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge'
};

export const FILTER_TYPES = {
  ALL: 'all',
  BOOK: 'book',
  MOVIE: 'movie'
};

export const SORT_OPTIONS = {
  DATE_ADDED: 'dateAdded',
  DATE_CONSUMED: 'dateConsumed',
  TITLE: 'title',
  AUTHOR: 'author',
  YEAR: 'year',
  RATING: 'rating'
};

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
};

export const RECENT_FILTER_OPTIONS = {
  ANY: 'any',
  LAST_7: 'last7',
  LAST_30: 'last30',
  LAST_90: 'last90'
};

export const DEFAULT_THEME = {
  PRIMARY: '#0b1220', // dark navy
  HIGHLIGHT: '#7c3aed' // purple-600
};

export const CSV_FORMATS = {
  GOODREADS: 'goodreads',
  LETTERBOXD: 'letterboxd',
  GENERIC: 'generic'
};

export const KEYBOARD_SHORTCUTS = {
  HELP: '?',
  SEARCH: '/',
  SEARCH_ALT: 'k',
  ADD: 'a',
  ADD_ALT: 'n',
  ONLINE_SEARCH: 's',
  FILTERS: 'f',
  CUSTOMIZE: 'c',
  TOGGLE_TYPE: 't',
  SELECTION_MODE: 'v',
  SELECT_ALL: 'a',
  ESCAPE: 'Escape',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
  ENTER: 'Enter',
  SPACE: ' ',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown'
};

export const GRID_COLUMNS_BY_SIZE = {
  [CARD_SIZES.TINY]: 8,
  [CARD_SIZES.SMALL]: 5,
  [CARD_SIZES.MEDIUM]: 3,
  [CARD_SIZES.LARGE]: 3,
  [CARD_SIZES.XLARGE]: 2
};

export const LOCAL_STORAGE_KEYS = {
  CARD_SIZE: 'cardSize',
  THEME_PRIMARY: 'themePrimary', 
  THEME_HIGHLIGHT: 'themeHighlight',
  OMDB_API_KEY: 'omdbApiKey'
};

export const CSS_VARIABLES = {
  PRIMARY: '--mt-primary',
  HIGHLIGHT: '--mt-highlight'
};