import { Platform } from 'react-native';
import { LANGUAGES, LOCATIONS, CATEGORIES } from './constants';

// =============================================================================
// DATE HELPERS
// =============================================================================

/**
 * Format a date into a human-readable string.
 * Supported formats: 'MMM D, YYYY' | 'MMMM D, YYYY' | 'MM/DD/YYYY' |
 *   'DD/MM/YYYY' | 'YYYY-MM-DD' | 'h:mm A' | 'h:mm:ss A' |
 *   'MMM D, YYYY h:mm A' (datetime)
 */
export const formatDate = (date, format = 'MMM D, YYYY') => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG  = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const month     = MONTHS_SHORT[d.getMonth()];
  const monthLong = MONTHS_LONG[d.getMonth()];
  const day       = d.getDate();
  const year      = d.getFullYear();
  const hours     = d.getHours();
  const minutes   = String(d.getMinutes()).padStart(2, '0');
  const seconds   = String(d.getSeconds()).padStart(2, '0');
  const ampm      = hours >= 12 ? 'PM' : 'AM';
  const hour12    = hours % 12 || 12;
  const mm        = String(d.getMonth() + 1).padStart(2, '0');
  const dd        = String(day).padStart(2, '0');

  switch (format) {
    case 'MMM D, YYYY':         return `${month} ${day}, ${year}`;
    case 'MMMM D, YYYY':        return `${monthLong} ${day}, ${year}`;
    case 'MM/DD/YYYY':          return `${mm}/${dd}/${year}`;
    case 'DD/MM/YYYY':          return `${dd}/${mm}/${year}`;
    case 'YYYY-MM-DD':          return `${year}-${mm}-${dd}`;
    case 'h:mm A':              return `${hour12}:${minutes} ${ampm}`;
    case 'h:mm:ss A':           return `${hour12}:${minutes}:${seconds} ${ampm}`;
    case 'MMM D, YYYY h:mm A':  return `${month} ${day}, ${year} ${hour12}:${minutes} ${ampm}`;
    case 'DD MMM YYYY':         return `${dd} ${month} ${year}`;
    default:                    return `${month} ${day}, ${year}`;
  }
};

/**
 * Returns a compact relative-time label ("Just now", "3h ago", etc.).
 */
export const timeAgo = (date) => {
  if (!date) return '';
  const diff    = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  const months  = Math.floor(days / 30);
  const years   = Math.floor(days / 365);

  if (seconds < 60)  return 'Just now';
  if (minutes < 60)  return `${minutes}m ago`;
  if (hours < 24)    return `${hours}h ago`;
  if (days < 7)      return `${days}d ago`;
  if (days < 30)     return `${Math.floor(days / 7)}w ago`;
  if (months < 12)   return `${months}mo ago`;
  return `${years}y ago`;
};

/**
 * Returns a human-friendly countdown label ("in 3 days", "in 2 hours", etc.).
 * Returns null if the date is in the past.
 */
export const timeUntil = (date) => {
  if (!date) return null;
  const diff    = new Date(date).getTime() - Date.now();
  if (diff <= 0) return null;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);

  if (seconds < 60)  return 'in a moment';
  if (minutes < 60)  return `in ${minutes}m`;
  if (hours < 24)    return `in ${hours}h`;
  if (days < 7)      return `in ${days}d`;
  return `in ${Math.floor(days / 7)}w`;
};

/**
 * Returns true if two dates fall on the same calendar day.
 */
export const isSameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth()    === db.getMonth()    &&
         da.getDate()     === db.getDate();
};

/**
 * Returns true if the date is today.
 */
export const isToday = (date) => isSameDay(date, new Date());

/**
 * Returns the start of the day (00:00:00.000) for a given date.
 */
export const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Adds `n` days to a date and returns a new Date.
 */
export const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

/**
 * Returns the difference in days between two dates (absolute value).
 */
export const daysBetween = (a, b) =>
  Math.abs(Math.floor((new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24)));

// =============================================================================
// NUMBER HELPERS
// =============================================================================

/**
 * Compact number format: 1200 → "1.2K", 2500000 → "2.5M".
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000)     return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)         return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

/**
 * Indian locale-aware currency formatter.
 * formatCurrency(150000) → "₹1,50,000.00"
 */
export const formatCurrency = (amount, currency = '₹') => {
  if (amount === null || amount === undefined) return `${currency}0`;
  return `${currency}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Clamps a number between min and max.
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Rounds a number to `decimals` decimal places.
 */
export const round = (num, decimals = 2) =>
  Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals);

/**
 * Converts a value to a percentage string.
 * percentage(0.753) → "75.3%"
 */
export const percentage = (value, total, decimals = 1) => {
  if (!total) return '0%';
  return `${round((value / total) * 100, decimals)}%`;
};

// =============================================================================
// TEXT / STRING HELPERS
// =============================================================================

/**
 * Truncates text to `length` characters, appending `suffix`.
 */
export const truncateText = (text, length = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length).trimEnd() + suffix;
};

/**
 * Truncates to a word boundary so words are never split.
 */
export const truncateWords = (text, wordLimit = 20, suffix = '...') => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + suffix;
};

export const capitalizeFirstLetter = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const capitalizeWords = (text) => {
  if (!text) return '';
  return text.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

/**
 * URL-safe slug from any text string.
 */
export const slugify = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateSlug = (text) => slugify(text);

/**
 * Initials from a full name: "Rahul Dev" → "RD", "Rahul" → "R".
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Strips all HTML tags from a string.
 */
export const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

/**
 * Highlights all occurrences of a search term inside text by wrapping them.
 * Returns an array of { text, highlight } segments for easy rendering in RN.
 */
export const highlightText = (text, query) => {
  if (!text || !query) return [{ text, highlight: false }];
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part) => ({
    text: part,
    highlight: part.toLowerCase() === query.toLowerCase(),
  }));
};

/**
 * Counts the number of words in a string.
 */
export const wordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Estimates reading time in minutes (assumes 200 wpm).
 */
export const readingTime = (text, wpm = 200) => {
  const words = wordCount(text);
  const mins  = Math.ceil(words / wpm);
  return mins === 1 ? '1 min read' : `${mins} min read`;
};

/**
 * Masks a string for privacy — e.g. an email or phone number.
 * maskString('user@example.com', 2, 4) → "us*******com"
 */
export const maskString = (str, visibleStart = 2, visibleEnd = 2) => {
  if (!str) return '';
  const len = str.length;
  if (len <= visibleStart + visibleEnd) return '*'.repeat(len);
  return (
    str.slice(0, visibleStart) +
    '*'.repeat(len - visibleStart - visibleEnd) +
    str.slice(len - visibleEnd)
  );
};

// =============================================================================
// LANGUAGE HELPERS  (backed by LANGUAGES in constants.js)
// =============================================================================

export const getLanguageName = (code) => {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? lang.name : code;
};

export const getNativeLanguageName = (code) => {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? lang.nativeName : code;
};

export const getLanguageFlag = (code) => {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? lang.flag : '🌐';
};

/**
 * Returns the full language record for a given code, or null.
 */
export const getLanguageByCode = (code) =>
  LANGUAGES.find((l) => l.code === code) || null;

// =============================================================================
// LOCATION HELPERS  (backed by LOCATIONS in constants.js)
// =============================================================================

export const getStateName = (stateId) => {
  const state = LOCATIONS.states.find((s) => s.id === stateId);
  return state ? state.name : stateId;
};

export const getStateCode = (stateId) => {
  const state = LOCATIONS.states.find((s) => s.id === stateId);
  return state ? state.code : null;
};

export const getStateCapital = (stateId) => {
  const state = LOCATIONS.states.find((s) => s.id === stateId);
  return state ? state.capital : null;
};

export const getDistrictName = (stateId, districtId) => {
  const districts = LOCATIONS.districts[stateId] || [];
  const district  = districts.find((d) => d.id === districtId);
  return district ? district.name : districtId;
};

export const getCityName = (districtId, cityId) => {
  const cities = LOCATIONS.cities[districtId] || [];
  const city   = cities.find((c) => c.id === cityId);
  return city ? city.name : cityId;
};

/**
 * Builds a human-readable location string from a location object.
 * { city, district, state } → "New Town, Kolkata, West Bengal"
 */
export const getFullLocation = (location) => {
  if (!location) return '';
  const parts = [];
  if (location.city)     parts.push(getCityName(location.district, location.city));
  if (location.district) parts.push(getDistrictName(location.state, location.district));
  if (location.state)    parts.push(getStateName(location.state));
  return parts.filter(Boolean).join(', ');
};

/**
 * Compact version — city + state only.
 */
export const getShortLocation = (location) => {
  if (!location) return '';
  const parts = [];
  if (location.city)  parts.push(getCityName(location.district, location.city));
  if (location.state) parts.push(getStateName(location.state));
  return parts.filter(Boolean).join(', ');
};

/**
 * Returns all districts for a state as an array of { id, name }.
 */
export const getDistrictList = (stateId) => LOCATIONS.districts[stateId] || [];

/**
 * Returns all tracked cities for a district as an array of { id, name }.
 */
export const getCityList = (districtId) => LOCATIONS.cities[districtId] || [];

// =============================================================================
// CATEGORY HELPERS  (backed by CATEGORIES in constants.js)
// =============================================================================

export const getCategoryColor = (categoryId) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.color : '#888888';
};

export const getCategoryIcon = (categoryId) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.icon : 'ellipsis-horizontal-outline';
};

export const getCategoryLabel = (categoryId) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.label : categoryId;
};

export const getCategoryById = (categoryId) =>
  CATEGORIES.find((c) => c.id === categoryId) || null;

// =============================================================================
// COLOR HELPERS
// =============================================================================

/**
 * Picks a random color from the BartaOne brand palette.
 */
export const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D', '#6C5CE7', '#A29BFE'];
  return colors[randomInt(0, colors.length - 1)];
};

/**
 * Generates a random hex color.
 */
export const generateRandomColor = () => {
  return `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase()}`;
};

/**
 * Converts a hex color to an rgba string.
 * hexToRgba('#FF6B6B', 0.5) → "rgba(255, 107, 107, 0.5)"
 */
export const hexToRgba = (hex, alpha = 1) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Returns a light or dark contrasting text color (#FFFFFF or #000000)
 * suitable for overlay text on a given background hex.
 */
export const getContrastColor = (hex) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  // YIQ formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
};

// =============================================================================
// PLATFORM HELPERS
// =============================================================================

export const isIOS     = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb     = Platform.OS === 'web';

/**
 * Returns platform-specific value.
 * platformSelect({ ios: 16, android: 14, default: 14 })
 */
export const platformSelect = (options) =>
  Platform.select({ ...options, default: options.default ?? null });

// =============================================================================
// IMAGE HELPERS
// =============================================================================

/**
 * Returns a Cloudinary-transformed URL for a given width/height.
 * Passes non-Cloudinary URLs through unchanged.
 */
export const getImageUrl = (url, width = null, height = null) => {
  if (!url) return null;
  if (url.includes('cloudinary.com') && (width || height)) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      const transformations = [];
      if (width)  transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      transformations.push('f_auto', 'q_auto'); // auto format + quality
      return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
    }
  }
  return url;
};

/**
 * Returns a Cloudinary thumbnail URL (square crop).
 */
export const getThumbnailUrl = (url, size = 200) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  return `${parts[0]}/upload/w_${size},h_${size},c_fill,f_auto,q_auto/${parts[1]}`;
};

// =============================================================================
// FILE HELPERS
// =============================================================================

export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

export const getFileName = (path) => {
  if (!path) return '';
  return path.split('/').pop();
};

export const getFileNameWithoutExtension = (filename) => {
  if (!filename) return '';
  const name = getFileName(filename);
  return name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Returns a friendly file-type category from a MIME type.
 * "image/jpeg" → "image", "video/mp4" → "video", etc.
 */
export const getFileCategory = (mimeType) => {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf'))      return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  return 'other';
};

// =============================================================================
// MEDIA / URL HELPERS
// =============================================================================

/**
 * Extracts a YouTube video ID from any standard YouTube URL format.
 */
export const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
    /(?:youtube\.com\/shorts\/)([\w-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

/**
 * Returns a YouTube thumbnail URL at the given quality.
 * quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault'
 */
export const getYouTubeThumbnail = (url, quality = 'hqdefault') => {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
};

/**
 * Parses query params from a URL string into a plain object.
 */
export const getQueryParams = (url) => {
  if (!url) return {};
  try {
    const urlObj = new URL(url);
    const params = {};
    urlObj.searchParams.forEach((value, key) => { params[key] = value; });
    return params;
  } catch {
    return {};
  }
};

/**
 * Builds a URL query string from an object, skipping null/undefined values.
 */
export const buildQueryString = (params) => {
  if (!params) return '';
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
};

/**
 * Appends query params to an existing URL.
 */
export const appendQueryParams = (url, params) => {
  if (!url) return '';
  const qs = buildQueryString(params);
  if (!qs) return url;
  return url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;
};

// =============================================================================
// VALIDATION HELPERS  (lightweight, non-duplicating validators.js)
// =============================================================================

export const isEmail = (email) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

export const isPhone = (phone) =>
  /^(\+?91)?[6-9]\d{9}$/.test(phone);

export const isUrl = (url) => {
  try { new URL(url); return true; } catch { return false; }
};

// =============================================================================
// OBJECT HELPERS
// =============================================================================

export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

export const isEmptyObject = (obj) =>
  obj !== null && typeof obj === 'object' && Object.keys(obj).length === 0;

/**
 * Picks a subset of keys from an object.
 */
export const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj && obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

/**
 * Returns a new object with the given keys removed.
 */
export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

/**
 * Deep-merges two objects. Arrays are replaced, not concatenated.
 */
export const deepMerge = (target, source) => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof result[key] === 'object' &&
      result[key] !== null
    ) {
      result[key] = deepMerge(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

/**
 * Flattens a nested object to dot-notation keys.
 * { a: { b: 1 } } → { 'a.b': 1 }
 */
export const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], fullKey));
    } else {
      acc[fullKey] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Returns true only if `value` is a plain object (not null, not array, not Date).
 */
export const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && value.constructor === Object;

// =============================================================================
// ARRAY HELPERS
// =============================================================================

export const groupBy = (array, key) =>
  array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) result[groupKey] = [];
    result[groupKey].push(item);
    return result;
  }, {});

/**
 * Sorts an array of objects by a key (non-mutating).
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    if (aVal === bVal) return 0;
    const cmp = aVal < bVal ? -1 : 1;
    return order === 'asc' ? cmp : -cmp;
  });
};

export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Returns unique items from an array, optionally by a key.
 * uniqueBy([{id:1},{id:1},{id:2}], 'id') → [{id:1},{id:2}]
 */
export const uniqueBy = (array, key) => {
  if (!key) return [...new Set(array)];
  const seen = new Set();
  return array.filter((item) => {
    const k = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/**
 * Flattens a nested array one level deep.
 */
export const flatten = (array) => [].concat(...array);

/**
 * Returns the intersection of two arrays (by value or key).
 */
export const intersect = (a, b) => a.filter((item) => b.includes(item));

/**
 * Shuffles an array (Fisher-Yates) — returns a new array.
 */
export const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Splits an array into two based on a predicate.
 * partition([1,2,3,4], x => x % 2 === 0) → [[2,4],[1,3]]
 */
export const partition = (array, predicate) =>
  array.reduce(([pass, fail], item) =>
    predicate(item) ? [[...pass, item], fail] : [pass, [...fail, item]],
  [[], []]);

// =============================================================================
// ASYNC / PERFORMANCE HELPERS
// =============================================================================

/**
 * Returns a debounced version of `func` that delays invocation by `delay` ms.
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Returns a throttled version of `func` — at most once per `limit` ms.
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
};

/**
 * Returns a promise that resolves after `ms` milliseconds.
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries an async function up to `retries` times with exponential back-off.
 */
export const retry = async (fn, retries = 3, delayMs = 1000) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(delayMs * Math.pow(2, attempt));
    }
  }
};

/**
 * Wraps a promise and returns [data, null] on success or [null, error] on
 * failure, so callers can use destructuring instead of try/catch.
 */
export const safeAsync = async (promise) => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error];
  }
};

// =============================================================================
// RANDOM / ID HELPERS
// =============================================================================

/**
 * Generates a random alphanumeric ID of the given length.
 */
export const generateRandomId = (length = 8) =>
  Array.from({ length }, () =>
    '0123456789abcdefghijklmnopqrstuvwxyz'[randomInt(0, 35)]
  ).join('');

/**
 * Generates a UUID v4-style string.
 */
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// =============================================================================
// STORAGE HELPERS  (AsyncStorage wrappers — import AsyncStorage separately)
// =============================================================================

/**
 * Safe JSON getter — returns `defaultValue` if the key is missing or parse fails.
 */
export const getStorageItem = async (AsyncStorage, key, defaultValue = null) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Safe JSON setter — silently swallows errors.
 */
export const setStorageItem = async (AsyncStorage, key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe AsyncStorage remover.
 */
export const removeStorageItem = async (AsyncStorage, key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

// =============================================================================
// NOTIFICATION / DEEP-LINK HELPERS
// =============================================================================

/**
 * Builds a deep-link path for a piece of content.
 * buildDeepLink('article', 'abc123') → "bartaone://article/abc123"
 */
export const buildDeepLink = (type, id, params = {}) => {
  const base = `bartaone://${type}/${id}`;
  const qs   = buildQueryString(params);
  return qs ? `${base}?${qs}` : base;
};

/**
 * Parses a deep-link URL into its constituent parts.
 */
export const parseDeepLink = (url) => {
  if (!url) return null;
  const withoutScheme = url.replace(/^[a-z]+:\/\//, '');
  const [pathPart, queryPart] = withoutScheme.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const params   = queryPart
    ? Object.fromEntries(queryPart.split('&').map((p) => p.split('=')))
    : {};
  return { type: segments[0] || null, id: segments[1] || null, params };
};

// =============================================================================
// EXPORT
// =============================================================================

export default {
  // Date
  formatDate, timeAgo, timeUntil, isSameDay, isToday, startOfDay, addDays, daysBetween,
  // Number
  formatNumber, formatCurrency, clamp, randomInt, round, percentage,
  // Text
  truncateText, truncateWords, capitalizeFirstLetter, capitalizeWords,
  slugify, generateSlug, getInitials, stripHtml, highlightText, wordCount, readingTime, maskString,
  // Language
  getLanguageName, getNativeLanguageName, getLanguageFlag, getLanguageByCode,
  // Location
  getStateName, getStateCode, getStateCapital,
  getDistrictName, getCityName, getFullLocation, getShortLocation,
  getDistrictList, getCityList,
  // Category
  getCategoryColor, getCategoryIcon, getCategoryLabel, getCategoryById,
  // Color
  getRandomColor, generateRandomColor, hexToRgba, getContrastColor,
  // Platform
  isIOS, isAndroid, isWeb, platformSelect,
  // Image
  getImageUrl, getThumbnailUrl,
  // File
  getFileExtension, getFileName, getFileNameWithoutExtension, formatFileSize, getFileCategory,
  // Media / URL
  extractYouTubeId, getYouTubeThumbnail,
  getQueryParams, buildQueryString, appendQueryParams,
  // Validation
  isEmail, isPhone, isUrl,
  // Object
  deepClone, isEmptyObject, pick, omit, deepMerge, flattenObject, isPlainObject,
  // Array
  groupBy, sortBy, chunk, uniqueBy, flatten, intersect, shuffle, partition,
  // Async
  debounce, throttle, sleep, retry, safeAsync,
  // Random / ID
  generateRandomId, generateUUID,
  // Storage
  getStorageItem, setStorageItem, removeStorageItem,
  // Deep-link
  buildDeepLink, parseDeepLink,
};