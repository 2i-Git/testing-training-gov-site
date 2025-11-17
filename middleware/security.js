/**
 * Security Middleware
 *
 * Provides comprehensive security middleware for the application including:
 * - Rate limiting to prevent abuse and DoS attacks
 * - Input sanitization to prevent XSS attacks
 * - Security headers via Helmet.js
 * - CSRF protection for forms
 *
 * Security Layers:
 * 1. Rate Limiting - Prevents brute force and abuse
 * 2. Input Sanitization - Cleans user input to prevent XSS
 * 3. Security Headers - Adds browser security protections
 * 4. CSRF Protection - Prevents cross-site request forgery
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const he = require('he');
const config = require('../config/config');

/**
 * Create a rate limiter with custom configuration
 *
 * Rate limiting helps prevent abuse by limiting the number of requests
 * a client can make within a specified time window.
 *
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests per window
 * @param {string} message - Custom message for rate limit exceeded
 * @returns {Function} Express middleware function
 */
const createRateLimiter = (windowMs, max, message, options = {}) => {
  return rateLimit({
    windowMs, // Time window for rate limiting
    max, // Maximum requests per window
    message: {
      success: false,
      error: 'Too many requests',
      message
    },
    standardHeaders: true, // Include rate limit info in standard headers
    legacyHeaders: false, // Don't include legacy rate limit headers
    // Per-user key when available, otherwise per-IP
    keyGenerator: req => {
      if (req.session && req.session.user && req.session.user.id) {
        return `user:${req.session.user.id}`;
      }
      if (req.session && req.sessionID) {
        return `sess:${req.sessionID}`;
      }
      return `ip:${req.ip}`;
    },
    // Skip rate limiting in test environment and when caller-provided skip says so
    skip: (req, res) => {
      if (config.NODE_ENV === 'test') return true;
      if (typeof options.skip === 'function') {
        try {
          return !!options.skip(req, res);
        } catch {
          // ...existing code...
          return false;
        }
      }
      return false;
    },
    handler: (req, res, _next, _options) => {
      const payload = {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: message || 'Too many requests from this user, please try again later'
      };

      if (req.path && req.path.startsWith('/api/')) {
        return res.status(429).json(payload);
      }
      return res.status(429).render('rate-limit', {
        title: 'Too many requests',
        statusCode: 429,
        message: payload.message
      });
    }
  });
};

/**
 * Input sanitization middleware
 *
 * Recursively sanitizes all string inputs in request body, query, and params
 * to prevent XSS attacks by escaping HTML characters.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeInput = (req, res, next) => {
  /**
   * Recursively sanitize an object's string properties
   *
   * @param {Object} obj - Object to sanitize
   */
  if (process.env.NODE_ENV === 'test') {
    console.log('[sanitizeInput] BEFORE', JSON.stringify(req.body));
  }
  const sanitizeObject = obj => {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'string') {
          const before = obj[i];
          obj[i] = he.encode(obj[i].trim());
          const after = obj[i];
          if (process.env.NODE_ENV === 'test') {
            console.log(`[sanitizeInput] array[${i}], before: ${before}, after: ${after}`);
          }
        } else if (typeof obj[i] === 'object' && obj[i] !== null) {
          sanitizeObject(obj[i]);
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          const before = obj[key];
          obj[key] = he.encode(obj[key].trim());
          const after = obj[key];
          if (process.env.NODE_ENV === 'test') {
            console.log(`[sanitizeInput] key: ${key}, before: ${before}, after: ${after}`);
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    }
  };

  // Sanitize all request data sources
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  if (process.env.NODE_ENV === 'test') {
    console.log('[sanitizeInput] AFTER', JSON.stringify(req.body));
  }
  next();
};

/**
 * Security headers middleware using Helmet.js
 *
 * Adds various security headers to protect against common attacks:
 * - Content Security Policy (CSP) to prevent XSS
 * - X-Frame-Options to prevent clickjacking
 * - X-Content-Type-Options to prevent MIME sniffing
 * - And many more security headers
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Default to same-origin only
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // Allow inline styles for GOV.UK
      fontSrc: ["'self'", 'https://fonts.gstatic.com'], // Allow Google Fonts
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts (required for GOV.UK Frontend)
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false // Required for some GOV.UK components
});

// Defense-in-depth: ensure crawlers are told not to index via HTTP header as well
const robotsNoindexHeader = (req, res, next) => {
  // Explicitly instruct search engines not to index or follow links
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for API endpoints in development
  if (config.NODE_ENV === 'development' && req.path.startsWith('/api/')) {
    return next();
  }

  // Generate CSRF token for forms
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
  }

  res.locals.csrfToken = req.session.csrfToken;

  // Validate CSRF token for POST requests
  if (req.method === 'POST' && !req.path.startsWith('/api/')) {
    const clientToken = req.body._csrf || req.headers['x-csrf-token'];

    if (!clientToken || clientToken !== req.session.csrfToken) {
      // Render the correct form with CSRF error
      let formName;
      if (req.path === '/personal-details') formName = 'personal-details';
      else if (req.path === '/business-details') formName = 'business-details';
      else if (req.path === '/license-details') formName = 'license-details';
      else if (req.path === '/summary') formName = 'summary';
      else if (req.path === '/login') formName = 'login';
      else if (req.path === '/admin/login') formName = 'admin-login';
      else if (req.path.startsWith('/admin/applications/') && req.path.endsWith('/status')) {
        // For admin status updates, redirect back to applications with error
        return res.status(403).redirect('/admin/applications?error=Invalid CSRF token');
      }

      if (formName) {
        return res.status(403).render(formName, {
          errors: [{ msg: 'Invalid CSRF token', path: '_csrf' }],
          data: req.body,
          csrfToken: res.locals.csrfToken
        });
      } else {
        return res.status(403).send('Invalid CSRF token');
      }
    }
  }

  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  // eslint-disable-next-line no-unused-vars
  const _ = req.body._csrf || req.headers['x-csrf-token'];

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    console.log(
      `${logData.method} ${logData.url} ${logData.status} ${logData.duration} - ${logData.ip}`
    );
  });

  next();
};

module.exports = {
  // Rate limiters for different endpoints
  rateLimiters: {
    general: createRateLimiter(
      config.security.general.windowMs,
      config.security.general.max,
      'Too many requests from this user, please try again later',
      {
        // Don't count static assets or safe methods to prevent navigation from burning quota
        skip: req => {
          const m = req.method;
          if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return true;
          const p = req.path || '';
          return (
            p === '/healthz' ||
            p === '/favicon.ico' ||
            p.startsWith('/govuk/') ||
            p.startsWith('/assets') ||
            p.startsWith('/images') ||
            p.startsWith('/css') ||
            p.startsWith('/js')
          );
        }
      }
    ),
    forms: createRateLimiter(
      config.security.forms.windowMs,
      config.security.forms.max,
      'Too many form submissions for this user, please try again later'
    ),
    api: createRateLimiter(
      config.security.api.windowMs,
      config.security.api.max,
      'API rate limit exceeded for this user'
    )
  },

  securityHeaders,
  robotsNoindexHeader,
  sanitizeInput,
  csrfProtection,
  requestLogger
};
