/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {*} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} - Express response
 */
const sendResponse = (res, statusCode, success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
  };

  if (data) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  // Add timestamp
  response.timestamp = new Date().toISOString();

  return res.status(statusCode).json(response);
};

/**
 * Send a success response with data
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata
 * @returns {Object} - Express response
 */
const sendSuccess = (res, data, message = 'Success', meta = null) => {
  return sendResponse(res, 200, true, message, data, meta);
};

/**
 * Send a created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Express response
 */
const sendCreated = (res, data, message = 'Created successfully') => {
  return sendResponse(res, 201, true, message, data);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} errors - Additional error details
 * @returns {Object} - Express response
 */
const sendError = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  response.timestamp = new Date().toISOString();

  return res.status(statusCode).json(response);
};

/**
 * Send a 400 Bad Request error
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Additional error details
 * @returns {Object} - Express response
 */
const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  return sendError(res, 400, message, errors);
};

/**
 * Send a 401 Unauthorized error
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} - Express response
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, 401, message);
};

/**
 * Send a 403 Forbidden error
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} - Express response
 */
const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, 403, message);
};

/**
 * Send a 404 Not Found error
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} - Express response
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, 404, message);
};

/**
 * Send a 409 Conflict error
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Additional error details
 * @returns {Object} - Express response
 */
const sendConflict = (res, message = 'Conflict', errors = null) => {
  return sendError(res, 409, message, errors);
};

/**
 * Send a 422 Validation error
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Validation errors
 * @returns {Object} - Express response
 */
const sendValidationError = (res, message = 'Validation error', errors = null) => {
  return sendError(res, 422, message, errors);
};

/**
 * Send a 429 Too Many Requests error
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} - Express response
 */
const sendTooManyRequests = (res, message = 'Too many requests') => {
  return sendError(res, 429, message);
};

/**
 * Send a 500 Internal Server Error
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Additional error details
 * @returns {Object} - Express response
 */
const sendInternalError = (res, message = 'Internal server error', errors = null) => {
  // Log the error for debugging
  console.error('Internal Server Error:', errors || message);
  return sendError(res, 500, message, errors);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Success message
 * @returns {Object} - Express response
 */
const sendPaginated = (res, data, total, page, limit, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return sendResponse(res, 200, true, message, data, {
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null,
    },
  });
};

/**
 * Send empty response (204 No Content)
 * @param {Object} res - Express response object
 * @returns {Object} - Express response
 */
const sendNoContent = (res) => {
  return res.status(204).send();
};

/**
 * Format validation errors
 * @param {Object} errors - Validation errors object
 * @returns {Object} - Formatted errors
 */
const formatValidationErrors = (errors) => {
  const formatted = {};
  for (const [key, value] of Object.entries(errors)) {
    formatted[key] = value.message || value;
  }
  return formatted;
};

module.exports = {
  sendResponse,
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendValidationError,
  sendTooManyRequests,
  sendInternalError,
  sendPaginated,
  sendNoContent,
  formatValidationErrors,
};