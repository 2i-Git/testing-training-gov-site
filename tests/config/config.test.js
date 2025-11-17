const originalEnv = process.env;

describe('config.js', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  it('loads defaults in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SESSION_SECRET;
    const config = require('../../config/config');
    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.session.name).toBe('alcohol_license_session');
    expect(config.session.secret).toBe('fallback-secret-change-me');
    expect(config.security.general.max).toBe(100);
    expect(config.security.corsOrigin).toBe('http://localhost:3000');
    expect(config.app.name).toBe('Alcohol License Training App');
    expect(config.app.version).toBe('1.0.0');
    expect(config.logging.level).toBe('info');
    expect(config.logging.file).toBe('./logs/app.log');
    expect(config.validation.maxFileSize).toBe(5 * 1024 * 1024);
    expect(config.validation.allowedFileTypes).toEqual(['pdf', 'jpg', 'png']);
  });

  it('uses env vars when set', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'supersecret';
    process.env.PORT = '8080';
    process.env.APP_NAME = 'TestApp';
    process.env.APP_VERSION = '2.0.0';
    process.env.LOG_LEVEL = 'debug';
    process.env.LOG_FILE = '/tmp/app.log';
    process.env.MAX_FILE_SIZE = '12345';
    process.env.ALLOWED_FILE_TYPES = 'docx,xlsx';
    const config = require('../../config/config');
    expect(config.NODE_ENV).toBe('production');
    expect(config.session.secret).toBe('supersecret');
    expect(config.PORT).toBe(8080);
    expect(config.app.name).toBe('TestApp');
    expect(config.app.version).toBe('2.0.0');
    expect(config.logging.level).toBe('debug');
    expect(config.logging.file).toBe('/tmp/app.log');
    expect(config.validation.maxFileSize).toBe(12345);
    expect(config.validation.allowedFileTypes).toEqual(['docx', 'xlsx']);
  });

  it('throws in production if SESSION_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_SECRET;
    expect(() => require('../../config/config')).toThrow(/SESSION_SECRET/);
  });

  it('throws in production if fallback secret is used', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'fallback-secret-change-me';
    expect(() => require('../../config/config')).toThrow(/SESSION_SECRET must be set/);
  });
});
