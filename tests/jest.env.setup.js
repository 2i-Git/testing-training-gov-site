// Ensure tests run in 'test' mode and use Postgres like production
process.env.NODE_ENV = 'test';

// Use local Postgres (from docker-compose.dev.yml) on port 5433
// Creates/uses a separate database to isolate tests
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5433/alcohols_test';

// Remove SQLite fallback to keep environments consistent
delete process.env.DB_PATH;

// Provide a deterministic session secret in tests if not set
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
