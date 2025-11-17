const config = require('../config/config');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

// Error logging utility
const logError = (error, req = null) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      code: error.code || 'UNKNOWN',
      stack: error.stack
    }
  };

  if (req) {
    errorLog.request = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
  }

  // In production, you'd want to use a proper logging service
  if (config.NODE_ENV === 'production') {
    console.error('ERROR:', JSON.stringify(errorLog, null, 2));
  } else {
    console.error('ERROR:', error.stack);
  }
};

// Async error wrapper
const asyncHandler = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const express = require('express');
const router = express.Router();
router.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
// Global error handler middleware
const errorHandler = (err, req, res, _next) => {
  // Preserve original error object (spreading loses prototype & stack)
  let error = err;

  // Log the original error (with stack intact)
  logError(error, req);

  // Normalization / translation of certain known library errors (example placeholders kept)
  if (error.name === 'CastError') {
    error = new NotFoundError('Resource not found');
  }

  if (error.code === 11000) {
    error = new ValidationError('Duplicate field value entered');
  }

  if (error.name === 'ValidationError' && !(error instanceof ValidationError)) {
    // Mongoose-style validation error object, convert to our ValidationError
    const messages = Object.values(error.errors || {}).map(val => val.message);
    error = new ValidationError('Validation failed', messages);
  }

  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    error = new ValidationError('Duplicate entry - this record already exists');
  }
  if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    error = new ValidationError('Invalid reference - related record not found');
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: error.code || 'INTERNAL_ERROR',
    message: error.message || 'Internal server error'
  };

  if (config.NODE_ENV === 'development') {
    response.stack = error.stack;
    if (error.details) response.details = error.details;
  }

  // For non-API GET requests, render error page
  if (!req.path.startsWith('/api/') && req.method === 'GET') {
    return res.status(statusCode).render('error', {
      title: 'Error',
      statusCode,
      message: response.message,
      showDetails: config.NODE_ENV === 'development'
    });
  }

  res.status(statusCode).json(response);
};

// 404 handler
const notFoundHandler = (req, res, _next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  _next(error);
};

// Validation error formatter
const formatValidationErrors = errors => {
  return errors.map(error => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));
};

// Handle validation results
const handleValidationResult = (req, res, next) => {
  if (req.validationErrors) {
    const formattedErrors = formatValidationErrors(req.validationErrors);

    // For API requests, return JSON
    if (req.path.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: formattedErrors
      });
    }

    // For form requests, continue with errors attached
    req.errors = req.validationErrors;
  }

  next();
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
  const error = {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this user, please try again later'
  };

  if (req.path.startsWith('/api/')) {
    return res.status(429).json(error);
  }

  // For form requests, render error page
  res.status(429).render('rate-limit', {
    title: 'Too many requests',
    statusCode: 429,
    message: error.message
  });
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,

  // Utilities
  logError,
  asyncHandler,
  formatValidationErrors,

  // Middleware
  errorHandler,
  notFoundHandler,
  handleValidationResult,
  rateLimitHandler
};
