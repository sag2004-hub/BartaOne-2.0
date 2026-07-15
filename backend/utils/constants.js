// User Roles
const USER_ROLES = {
  VIEWER: 'viewer',
  OWNER: 'owner',
  ADMIN: 'admin',
};

// Content Types
const CONTENT_TYPES = {
  ARTICLE: 'article',
  VIDEO: 'video',
  LIVE: 'live',
  NEWSPAPER: 'newspaper', // ✅ ADDED
};

// Categories
const CATEGORIES = [
  'news',
  'entertainment',
  'sports',
  'business',
  'technology',
  'lifestyle',
  'other',
];

// Languages
const LANGUAGES = {
  EN: 'en',
  BN: 'bn',
  HI: 'hi',
  UR: 'ur',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  ZH: 'zh',
  AR: 'ar',
  RU: 'ru',
  TA: 'ta',
  TE: 'te',
  ML: 'ml',
  KN: 'kn',
  GU: 'gu',
  PA: 'pa',
  OR: 'or',
  AS: 'as',
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Messages
const ERROR_MESSAGES = {
  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  BAD_REQUEST: 'Bad request',
  VALIDATION_ERROR: 'Validation error',
  DUPLICATE_ENTRY: 'Duplicate entry found',

  // Auth
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USER_NOT_FOUND: 'User not found',
  PASSWORD_RESET_FAILED: 'Password reset failed',
  TOKEN_EXPIRED: 'Token expired',
  TOKEN_INVALID: 'Invalid token',

  // Channel
  CHANNEL_NOT_FOUND: 'Channel not found',
  CHANNEL_ALREADY_EXISTS: 'Channel already exists',
  CHANNEL_OWNER_REQUIRED: 'Channel owner required',

  // Article
  ARTICLE_NOT_FOUND: 'Article not found',
  ARTICLE_ALREADY_EXISTS: 'Article already exists',

  // Video
  VIDEO_NOT_FOUND: 'Video not found',
  VIDEO_UPLOAD_FAILED: 'Video upload failed',

  // Live
  LIVE_NOT_FOUND: 'Live stream not found',
  LIVE_ALREADY_ACTIVE: 'Live stream already active',

  // Comment
  COMMENT_NOT_FOUND: 'Comment not found',

  // Like
  LIKE_ALREADY_EXISTS: 'Already liked',
  LIKE_NOT_FOUND: 'Like not found',

  // Subscription
  ALREADY_SUBSCRIBED: 'Already subscribed',
  NOT_SUBSCRIBED: 'Not subscribed',

  // File Upload
  FILE_TOO_LARGE: 'File too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'Upload failed',

  // ✅ NEWSPAPER ERRORS
  NEWSPAPER_NOT_FOUND: 'Newspaper not found',
  NEWSPAPER_EXPIRED: 'This newspaper has expired',
  NEWSPAPER_PAGE_LIMIT: 'Newspaper cannot have more than 20 pages',
  NEWSPAPER_CONTENT_EMPTY: 'Page content cannot be empty',
  NEWSPAPER_ALREADY_EXISTS: 'Newspaper already exists',
  NEWSPAPER_DELETE_FAILED: 'Failed to delete newspaper',
};

// Success Messages
const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  EMAIL_VERIFIED: 'Email verified successfully',

  // Channel
  CHANNEL_CREATED: 'Channel created successfully',
  CHANNEL_UPDATED: 'Channel updated successfully',
  CHANNEL_DELETED: 'Channel deleted successfully',
  SUBSCRIBED: 'Subscribed successfully',
  UNSUBSCRIBED: 'Unsubscribed successfully',

  // Article
  ARTICLE_CREATED: 'Article created successfully',
  ARTICLE_UPDATED: 'Article updated successfully',
  ARTICLE_DELETED: 'Article deleted successfully',
  ARTICLE_LIKED: 'Article liked successfully',
  ARTICLE_UNLIKED: 'Article unliked successfully',

  // Video
  VIDEO_UPLOADED: 'Video uploaded successfully',
  VIDEO_UPDATED: 'Video updated successfully',
  VIDEO_DELETED: 'Video deleted successfully',
  VIDEO_LIKED: 'Video liked successfully',
  VIDEO_UNLIKED: 'Video unliked successfully',

  // Live
  LIVE_STARTED: 'Live stream started successfully',
  LIVE_ENDED: 'Live stream ended successfully',
  LIVE_UPDATED: 'Live stream updated successfully',

  // Comment
  COMMENT_ADDED: 'Comment added successfully',
  COMMENT_DELETED: 'Comment deleted successfully',

  // User
  PROFILE_UPDATED: 'Profile updated successfully',
  PREFERENCES_UPDATED: 'Preferences updated successfully',

  // ✅ NEWSPAPER SUCCESS MESSAGES
  NEWSPAPER_PUBLISHED: 'Newspaper published successfully! It will expire in 24 hours',
  NEWSPAPER_UPDATED: 'Newspaper updated successfully',
  NEWSPAPER_DELETED: 'Newspaper deleted successfully',
  NEWSPAPER_VIEWED: 'Newspaper view recorded',
};

// Collection Names
const COLLECTIONS = {
  USERS: 'users',
  CHANNELS: 'channels',
  ARTICLES: 'articles',
  VIDEOS: 'videos',
  LIVE: 'lives',
  NEWSPAPERS: 'newspapers', // ✅ ADDED
  COMMENTS: 'comments',
  LIKES: 'likes',
  SUBSCRIPTIONS: 'subscriptions',
};

// File Upload Limits
const UPLOAD_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  VIDEO_MAX_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_FILES: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'],
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Sort Options
const SORT_OPTIONS = {
  LATEST: '-createdAt',
  OLDEST: 'createdAt',
  POPULAR: '-views',
  TRENDING: '-likes',
  TOP_RATED: '-likes',
};

// Cache Keys
const CACHE_KEYS = {
  ARTICLES: 'articles',
  CHANNELS: 'channels',
  VIDEOS: 'videos',
  LIVE: 'live',
  NEWSPAPERS: 'newspapers', // ✅ ADDED
  USER: 'user',
  PREFERENCES: 'preferences',
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// Notification Types
const NOTIFICATION_TYPES = {
  NEW_ARTICLE: 'new_article',
  NEW_VIDEO: 'new_video',
  LIVE_STARTED: 'live_started',
  NEW_NEWSPAPER: 'new_newspaper', // ✅ ADDED
  COMMENT: 'comment',
  LIKE: 'like',
  SUBSCRIPTION: 'subscription',
  FOLLOW: 'follow',
  MENTION: 'mention',
  SYSTEM: 'system',
};

// ✅ NEWSPAPER CONSTANTS
const NEWSPAPER_LAYOUTS = {
  FULL: 'full',
  SPLIT: 'split',
  GRID: 'grid',
};

const NEWSPAPER_FILTERS = {
  ALL: 'all',
  TODAY: 'today',
  EXPIRING: 'expiring',
  CHANNELS: 'channels',
};

const NEWSPAPER_EXPIRY_HOURS = 24; // 24 hours expiry
const NEWSPAPER_PAGE_LIMIT = 20; // Max pages per newspaper

const NEWSPAPER_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  DRAFT: 'draft',
};

// Environment
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

// Gender
const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

// Device Types
const DEVICE_TYPES = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
  OTHER: 'other',
};

module.exports = {
  USER_ROLES,
  CONTENT_TYPES,
  CATEGORIES,
  LANGUAGES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COLLECTIONS,
  UPLOAD_LIMITS,
  PAGINATION,
  SORT_OPTIONS,
  CACHE_KEYS,
  CACHE_TTL,
  NOTIFICATION_TYPES,
  ENVIRONMENTS,
  GENDER,
  DEVICE_TYPES,
  // ✅ NEWSPAPER EXPORTS
  NEWSPAPER_LAYOUTS,
  NEWSPAPER_FILTERS,
  NEWSPAPER_EXPIRY_HOURS,
  NEWSPAPER_PAGE_LIMIT,
  NEWSPAPER_STATUS,
};