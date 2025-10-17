// Run DB migrations once before the Jest test suites to prevent per-suite lock contention
module.exports = async () => {
  const { Client } = require('pg');
  const adminUrl =
    process.env.PG_ADMIN_URL || 'postgres://postgres:postgres@127.0.0.1:5433/postgres';
  const testDbName = 'alcohols_test';

  // 1) Reset test database (terminate connections, drop, recreate)
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

  // 2) Run migrations against the fresh test DB
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
