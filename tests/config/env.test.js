// Patch envalid reporter to throw instead of process.exit
const envalid = require('envalid');
envalid.reporter = ({ errors }) => {
  if (Object.keys(errors).length > 0) {
    throw new Error('Envalid validation error');
  }
};

const { loadEnv } = require('../../config/env');

describe('loadEnv', () => {
  it('loads defaults for missing values', () => {
    const env = loadEnv({ SESSION_SECRET: 'testsecret' });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.DB_PATH).toBe('./database/alcohol_license.db');
    expect(env.SESSION_SECRET).toBe('testsecret');
    expect(env.SESSION_NAME).toBe('alcohol_license_session');
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(15 * 60 * 1000);
    expect(env.RATE_LIMIT_MAX).toBe(100);
    expect(env.FORMS_RATE_LIMIT_MAX).toBe(10);
    expect(env.API_RATE_LIMIT_MAX).toBe(30);
    expect(env.CORS_ORIGIN).toBe('');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.LOG_FILE).toBe('./logs/app.log');
    expect(env.MS_CALLBACK_URL).toBe('http://localhost:3000/auth/microsoft/callback');
    expect(env.ALLOWED_EMAIL_DOMAINS).toBe('');
  });

  it('overrides defaults with provided values', () => {
    const env = loadEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      SESSION_SECRET: 'abc',
      SESSION_NAME: 'mysession',
      DB_PATH: '/tmp/db.sqlite',
      LOG_LEVEL: 'debug',
      LOG_FILE: '/tmp/app.log',
      MS_CALLBACK_URL: 'https://foo/callback',
      ALLOWED_EMAIL_DOMAINS: 'example.com,foo.com'
    });
    expect(env.NODE_ENV).toBe('production');
    expect(env.PORT).toBe(8080);
    expect(env.SESSION_SECRET).toBe('abc');
    expect(env.SESSION_NAME).toBe('mysession');
    expect(env.DB_PATH).toBe('/tmp/db.sqlite');
    expect(env.LOG_LEVEL).toBe('debug');
    expect(env.LOG_FILE).toBe('/tmp/app.log');
    expect(env.MS_CALLBACK_URL).toBe('https://foo/callback');
    expect(env.ALLOWED_EMAIL_DOMAINS).toBe('example.com,foo.com');
  });

  it('throws if SESSION_SECRET is missing', () => {
    expect(() => loadEnv({})).toThrow();
  });
});
