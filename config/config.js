/**
 * Application Configuration
 *
 * Centralized configuration management for the Alcohol License Training application.
 * Uses environment variables with sensible defaults for development.
 *
 * Configuration Categories:
 * - Environment and port settings
 * - Database connection parameters
 * - Session management and security
 * - Rate limiting and CORS settings
 * - Application metadata
 * - Logging configuration
 * - File upload validation
 *
 * Security Features:
 * - Environment-specific cookie settings
 * - CSRF protection configuration
 * - Rate limiting parameters
 * - Production environment validation
 */

const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

const config = {
  // Environment and Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,

  // Database Configuration
  // Database configuration: Prefer Postgres via DATABASE_URL; fallback to SQLite path
  database: {
    url: process.env.DATABASE_URL || '',
    path: process.env.DB_PATH || path.join(__dirname, '../database/alcohol_license.db'),
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
  },

  // Session Management Configuration
  // Handles user sessions and CSRF protection
  session: {
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
    name: process.env.SESSION_NAME || 'alcohol_license_session',
    resave: false, // Don't save unchanged sessions
    saveUninitialized: false, // Better for GDPR compliance - don't create sessions until needed
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks by blocking client-side access
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      sameSite: 'strict' // CSRF protection - restrict cross-site requests
    }
  },

  // Security Configuration
  // Rate limiting and CORS settings to prevent abuse
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // Max requests per window
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000' // Allowed CORS origins
  },

  // Application Metadata
  // Basic application information for logging and display
  app: {
    name: process.env.APP_NAME || 'Alcohol License Training App',
    version: process.env.APP_VERSION || '1.0.0'
  },

  // Logging Configuration
  // Controls log levels and output destinations
  logging: {
    level: process.env.LOG_LEVEL || 'info', // Minimum log level to output
    file: process.env.LOG_FILE || './logs/app.log' // Log file location
  },

  // File Upload Validation
  // Security settings for any file upload functionality
  validation: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,png').split(',')
  }
};

/**
 * Production Environment Validation
 *
 * Ensures that critical security settings are properly configured
 * when running in production mode. Prevents common security misconfigurations.
 */
if (config.NODE_ENV === 'production') {
  // List of environment variables that MUST be set in production
  const requiredEnvVars = ['SESSION_SECRET'];
  // If not using SQLite, require DATABASE_URL
  if (!process.env.DB_PATH) {
    requiredEnvVars.push('DATABASE_URL');
  }
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  // Fail fast if required variables are missing
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Ensure default secrets aren't used in production
  if (config.session.secret === 'fallback-secret-change-me') {
    throw new Error('SESSION_SECRET must be set in production');
  }
}

module.exports = config;
