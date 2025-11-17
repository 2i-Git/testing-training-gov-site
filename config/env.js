const envalid = require('envalid');
const { cleanEnv, str, num, port } = envalid;

// Use a custom reporter in test environments to avoid process.exit
if (process.env.NODE_ENV === 'test') {
  envalid.reporter = ({ errors }) => {
    if (Object.keys(errors).length > 0) {
      throw new Error('Envalid validation error');
      // Override envalid reporter globally for test environments before anything else
      if (process.env.NODE_ENV === 'test') {
        try {
          const envalid = require('envalid');
          envalid.reporter = ({ errors } = {}) => {
            if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
              throw new Error('Envalid validation error');
            }
          };
        } catch (e) {
          // envalid may not be installed yet, ignore
        }
      }
    }
  };
}

function loadEnv(raw = process.env) {
  const options = {};
  if (process.env.NODE_ENV === 'test') {
    options.reporter = ({ errors } = {}) => {
      if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
        throw new Error('Envalid validation error');
      }
    };
  }
  const env = cleanEnv(
    raw,
    {
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

      // Security / rate limiting (general, forms, api)
      RATE_LIMIT_WINDOW_MS: num({ default: 15 * 60 * 1000 }),
      RATE_LIMIT_MAX: num({ default: 100 }),
      FORMS_RATE_LIMIT_WINDOW_MS: num({ default: 15 * 60 * 1000 }),
      FORMS_RATE_LIMIT_MAX: num({ default: 10 }),
      API_RATE_LIMIT_WINDOW_MS: num({ default: 60 * 1000 }),
      API_RATE_LIMIT_MAX: num({ default: 30 }),

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
    },
    options
  );

  return env;
}

module.exports = { loadEnv };
