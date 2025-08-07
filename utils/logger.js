const winston = require('winston');
const path = require('path');
const config = require('../config/config');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { 
    service: config.app.name,
    version: config.app.version 
  },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console transport in development
if (config.NODE_ENV !== 'production') {
  // Wrap logger.error to prevent undefined messages in console
  const originalError = logger.error.bind(logger);
  logger.error = function(message, ...args) {
    if (typeof message === 'undefined' || message === undefined) {
      message = '[ERROR] Undefined error message';
    }
    return originalError(message, ...args);
  };
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Suppress logging for 404 requests to fonts
  const isFont404 = req.url.includes('/fonts/') || req.url.includes('fonts.googleapis.com');

  if (!isFont404) {
    // Log request
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
