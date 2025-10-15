const { cleanEnv, str, num, port } = require('envalid');

function loadEnv(raw = process.env) {
  const env = cleanEnv(raw, {
    NODE_ENV: str({
      choices: ['development', 'test', 'production', 'local'],
      default: 'development'
    }),
    PORT: port({ default: 3000 }),

    // Database
    DATABASE_URL: str({ default: '' }),
    DB_PATH: str({ default: './database/alcohol_license.db' }),

    // Sessions
    SESSION_SECRET: str(),
    SESSION_NAME: str({ default: 'alcohol_license_session' }),

    // Security / rate limiting
    RATE_LIMIT_WINDOW_MS: num({ default: 15 * 60 * 1000 }),
    RATE_LIMIT_MAX: num({ default: 100 }),

    // CORS
    CORS_ORIGIN: str({ default: '' }),

    // Logging
    LOG_LEVEL: str({ default: 'info' }),
    LOG_FILE: str({ default: './logs/app.log' }),

    // Microsoft OAuth
    MS_CLIENT_ID: str({ default: '' }),
    MS_CLIENT_SECRET: str({ default: '' }),
    MS_CALLBACK_URL: str({ default: 'http://localhost:3000/auth/microsoft/callback' }),

    // Admin allowlist (comma-separated email domains)
    ALLOWED_EMAIL_DOMAINS: str({ default: '' })
  });

  return env;
}

module.exports = { loadEnv };
