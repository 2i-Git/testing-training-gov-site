/**
 * Logging Utility
 *
 * Provides comprehensive logging functionality using Winston logger.
 * Includes request/response logging, error tracking, and log file management.
 *
 * Features:
 * - Structured JSON logging for production
 * - Console logging for development
 * - Request/response timing and details
 * - Error logging with stack traces
 * - Log file rotation and size management
 * - Application event logging
 *
 * Log Levels:
 * - error: Error conditions requiring immediate attention
 * - warn: Warning conditions that should be monitored
 * - info: General information about application flow
 * - debug: Detailed debugging information (development only)
 */

const winston = require('winston');
const path = require('path');
const config = require('../config/config');

/**
 * Initialize logging directory
 *
 * Ensures the logs directory exists before creating log files.
 * Creates the directory recursively if it doesn't exist.
 */
const fs = require('fs');
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format configuration
 *
 * Creates a standardized log format with:
 * - ISO timestamp for precise timing
 * - Error stack traces for debugging
 * - JSON structure for parsing and analysis
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // Include stack traces for errors
  winston.format.json() // Structured JSON format
);

/**
 * Winston logger instance
 *
 * Main logger with file transports and service metadata.
 * Includes automatic log rotation to prevent disk space issues.
 */
const logger = winston.createLogger({
  level: config.logging.level, // Minimum log level from config
  format: logFormat,
  defaultMeta: {
    service: config.app.name, // Service name for log identification
    version: config.app.version // Version for deployment tracking
  },
  transports: [
    // Main log file - all log levels
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB max file size
      maxFiles: 5, // Keep 5 rotated files
      tailable: true // New logs go to end of file
    }),

    // Error-only log file for quick error analysis
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB max file size
      maxFiles: 5, // Keep 5 rotated files
      tailable: true
    })
  ]
});

/**
 * Development Environment Enhancements
 *
 * In non-production environments:
 * - Add console logging with colors
 * - Handle undefined error messages gracefully
 * - Use simple format for console readability
 */
if (config.NODE_ENV !== 'production') {
  // Wrap logger.error to prevent undefined messages in console output
  const originalError = logger.error.bind(logger);
  logger.error = function (message, ...args) {
    if (typeof message === 'undefined' || message === undefined) {
      message = '[ERROR] Undefined error message';
    }
    return originalError(message, ...args);
  };

  // Add colorized console output for development
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Color-code log levels
        winston.format.simple() // Simple readable format
      )
    })
  );
}

/**
 * Request logging middleware
 *
 * Logs HTTP request and response details including:
 * - Request method, URL, and client information
 * - Response status code and timing
 * - Error details for failed requests
 * - Filters out noise from font/asset 404s
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Filter out noisy 404 requests for fonts and assets to keep logs clean
  const isFont404 = req.url.includes('/fonts/') || req.url.includes('fonts.googleapis.com');

  if (!isFont404) {
    // Log incoming request details
    logger.info('Request started', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type')
    });
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    // Log response unless it's a font 404
    if (!(isFont404 && res.statusCode === 404)) {
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      // Always provide a valid message
      const message = 'Request completed';
      logger.log(logLevel, message, {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        contentLength: res.get('Content-Length')
      });
    }
  });

  next();
};

// Application event logging
const logApplicationEvent = (event, data = {}) => {
  logger.info('Application event', {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Security event logging
const logSecurityEvent = (event, req, details = {}) => {
  logger.warn('Security event', {
    event,
    ip: req.ip,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Error logging
const logError = (error, req = null, context = {}) => {
  const errorData = {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    context,
    timestamp: new Date().toISOString()
  };

  if (req) {
    errorData.request = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID
    };
  }

  // Always log a valid message
  logger.error('Application error', errorData);
};

module.exports = {
  logger,
  requestLogger,
  logApplicationEvent,
  logSecurityEvent,
  logError
};
