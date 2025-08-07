const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const config = require('../config/config');

// Rate limiting middleware
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { 
      success: false, 
      error: 'Too many requests', 
      message 
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in test environment
    skip: () => config.NODE_ENV === 'test'
  });
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS attacks
        obj[key] = validator.escape(obj[key].trim());
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    });
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  
  next();
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for GOV.UK Frontend
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false // Required for some GOV.UK components
});

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
    
    console.log(`${logData.method} ${logData.url} ${logData.status} ${logData.duration} - ${logData.ip}`);
  });
  
  next();
};

module.exports = {
  // Rate limiters for different endpoints
  rateLimiters: {
    general: createRateLimiter(
      config.security.rateLimitWindowMs, 
      config.security.rateLimitMax,
      'Too many requests from this IP, please try again later'
    ),
    forms: createRateLimiter(
      15 * 60 * 1000, // 15 minutes
      10, // Max 10 form submissions per 15 minutes
      'Too many form submissions, please try again later'
    ),
    api: createRateLimiter(
      60 * 1000, // 1 minute
      30, // Max 30 API calls per minute
      'API rate limit exceeded'
    )
  },
  
  securityHeaders,
  sanitizeInput,
  csrfProtection,
  requestLogger
};
