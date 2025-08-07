const path = require('path');

// Load environment variables
require('dotenv').config();

const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  
  // Database
  database: {
    path: process.env.DB_PATH || path.join(__dirname, '../database/alcohol_license.db'),
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
  },
  
  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
    name: process.env.SESSION_NAME || 'alcohol_license_session',
    resave: false,
    saveUninitialized: false, // Better for GDPR compliance
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict' // CSRF protection
    }
  },
  
  // Security
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  // Application
  app: {
    name: process.env.APP_NAME || 'Alcohol License Training App',
    version: process.env.APP_VERSION || '1.0.0'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  },
  
  // Validation
  validation: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,png').split(',')
  }
};

// Validate required environment variables in production
if (config.NODE_ENV === 'production') {
  const requiredEnvVars = ['SESSION_SECRET', 'DB_PATH'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  if (config.session.secret === 'fallback-secret-change-me') {
    throw new Error('SESSION_SECRET must be set in production');
  }
}

module.exports = config;
