// Ensure tests use in-memory sqlite and test environment
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

// Provide a deterministic session secret in tests if not set
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
