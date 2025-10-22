// Run DB migrations once before the Jest test suites to prevent per-suite lock contention
const { execSync } = require('child_process');
module.exports = async () => {
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  // Start the test database container locally only; in CI we rely on GitHub Actions service
  if (!isCI) {
    try {
      execSync('docker compose up -d db', { stdio: 'inherit' });
      // Wait for Postgres to be ready inside the compose service
      let ready = false;
      for (let i = 0; i < 20; i++) {
        try {
          execSync('docker compose exec -T db pg_isready -U postgres', { stdio: 'inherit' });
          ready = true;
          break;
        } catch {
          await new Promise(res => setTimeout(res, 1000));
        }
      }
      if (!ready) throw new Error('Postgres test DB did not become ready');
    } catch (err) {
      console.error('Failed to start test DB:', err.message);
      process.exit(1);
    }
  } else {
    // In CI, a Postgres service is provided and exposed on the runner (e.g., 127.0.0.1:5433)
    // Poll for readiness by attempting a connection rather than using docker compose
    const { Client: ReadyClient } = require('pg');
    const readyUrl =
      process.env.PG_ADMIN_URL || 'postgres://postgres:postgres@127.0.0.1:5433/postgres';
    let ready = false;
    for (let i = 0; i < 30; i++) {
      const c = new ReadyClient({ connectionString: readyUrl });
      try {
        await c.connect();
        ready = true;
        await c.end();
        break;
      } catch {
        await new Promise(res => setTimeout(res, 1000));
      }
    }
    if (!ready) {
      console.error('CI Postgres service did not become ready');
      process.exit(1);
    }
  }

  // Now reset and migrate the test database as before
  const { Client } = require('pg');
  const defaultHostPort = isCI ? '5433' : '5433';
  const adminUrl =
    process.env.PG_ADMIN_URL ||
    `postgres://postgres:postgres@127.0.0.1:${defaultHostPort}/postgres`;
  const testDbName = process.env.PG_TEST_DB || 'alcohols_test';

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`, [
      testDbName
    ]);
    await admin.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    await admin.query(`CREATE DATABASE ${testDbName}`);
  } finally {
    await admin.end();
  }

  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    `postgres://postgres:postgres@127.0.0.1:${defaultHostPort}/${testDbName}`;
  const knexConfig = require('../knexfile');
  const knex = require('knex')(knexConfig);
  try {
    await knex.migrate.latest();
  } finally {
    await knex.destroy();
  }
};
