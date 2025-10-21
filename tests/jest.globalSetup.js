// Run DB migrations once before the Jest test suites to prevent per-suite lock contention
const { execSync } = require('child_process');
module.exports = async () => {
  // Start the test database container
  try {
    execSync('docker compose up -d db', { stdio: 'inherit' });
    // Wait for Postgres to be ready
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

  // Now reset and migrate the test database as before
  const { Client } = require('pg');
  const adminUrl =
    process.env.PG_ADMIN_URL || 'postgres://postgres:postgres@127.0.0.1:5433/postgres';
  const testDbName = 'alcohols_test';

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
    process.env.DATABASE_URL || `postgres://postgres:postgres@127.0.0.1:5433/${testDbName}`;
  const knexConfig = require('../knexfile');
  const knex = require('knex')(knexConfig);
  try {
    await knex.migrate.latest();
  } finally {
    await knex.destroy();
  }
};
