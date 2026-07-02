const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

// Add Morgan stream for HTTP logging
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Create child loggers for specific modules
const createModuleLogger = (moduleName) => {
  return logger.child({ module: moduleName });
};

// Log request details
const logRequest = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip, headers } = req;
  const userAgent = headers['user-agent'] || 'unknown';

  // Log request
  logger.info(`📥 ${method} ${originalUrl}`, {
    ip,
    userAgent,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
    
    logger.info(`${statusColor} ${method} ${originalUrl} - ${status} (${duration}ms)`, {
      status,
      duration,
      ip,
    });
  });

  next();
};

// Log database queries
const logQuery = (query, collection) => {
  logger.debug(`📊 Database Query`, {
    collection,
    query: JSON.stringify(query),
  });
};

// Log API responses
const logResponse = (message, data = null) => {
  if (data) {
    logger.info(`📤 ${message}`, { data });
  } else {
    logger.info(`📤 ${message}`);
  }
};

// Log errors with context
const logError = (error, context = {}) => {
  logger.error(`💥 ${error.message}`, {
    error: error.stack,
    ...context,
  });
};

// Log warnings
const logWarning = (message, context = {}) => {
  logger.warn(`⚠️ ${message}`, context);
};

// Log info
const logInfo = (message, context = {}) => {
  logger.info(`ℹ️ ${message}`, context);
};

// Log debug
const logDebug = (message, context = {}) => {
  logger.debug(`🔍 ${message}`, context);
};

// Performance logging
const logPerformance = (operation, duration, context = {}) => {
  logger.info(`⚡ ${operation} completed in ${duration}ms`, {
    operation,
    duration,
    ...context,
  });
};

// Security logging
const logSecurity = (event, context = {}) => {
  logger.warn(`🔒 Security Event: ${event}`, context);
};

// Audit logging
const logAudit = (action, userId, details = {}) => {
  logger.info(`📋 Audit: ${action}`, {
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Create logger for specific module
const getLogger = (module) => {
  return {
    info: (message, meta = {}) => logInfo(`[${module}] ${message}`, meta),
    error: (message, error, meta = {}) => logError(error || message, { module, ...meta }),
    warn: (message, meta = {}) => logWarning(`[${module}] ${message}`, meta),
    debug: (message, meta = {}) => logDebug(`[${module}] ${message}`, meta),
    audit: (action, userId, details = {}) => logAudit(action, userId, { module, ...details }),
  };
};

module.exports = {
  logger,
  morganStream,
  createModuleLogger,
  logRequest,
  logQuery,
  logResponse,
  logError,
  logWarning,
  logInfo,
  logDebug,
  logPerformance,
  logSecurity,
  logAudit,
  getLogger,
};