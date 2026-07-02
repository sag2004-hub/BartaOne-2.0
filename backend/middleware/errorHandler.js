const { sendError } = require('../utils/response');

/**
 * Global error handling middleware
 * Catches all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation error';
    errors = Object.values(err.errors).map(e => e.message);
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    // Mongoose duplicate key error
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate value for field: ${field}. Please use a different value.`;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    statusCode = 401;
    message = 'Token expired. Please login again.';
  } else if (err.name === 'MulterError') {
    // Multer upload error
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum size exceeded.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files. Maximum count exceeded.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected field name.';
    } else {
      message = err.message;
    }
  } else if (err.code === 'auth/user-not-found') {
    // Firebase auth error
    statusCode = 404;
    message = 'User not found';
  } else if (err.code === 'auth/wrong-password') {
    statusCode = 401;
    message = 'Invalid credentials';
  } else if (err.code === 'auth/email-already-exists') {
    statusCode = 409;
    message = 'Email already exists';
  } else if (err.code === 'auth/invalid-email') {
    statusCode = 400;
    message = 'Invalid email address';
  }

  // Send error response
  return sendError(res, statusCode, message, errors);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Async wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Rate limiting error handler
 */
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err.name === 'RateLimitError') {
    return sendError(res, 429, 'Too many requests. Please try again later.');
  }
  next(err);
};

/**
 * CORS error handler
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.name === 'CORSError') {
    return sendError(res, 403, 'CORS error: Origin not allowed');
  }
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  rateLimitErrorHandler,
  corsErrorHandler,
};

// Export default
module.exports.default = errorHandler;