#!/usr/bin/env node

// Cleanup script using Knex: remove applications not in final states (approved, rejected)
// Usage: node scripts/cleanup-unfinalized-knex.js [--dry-run]

const { knex } = require('./db');

(async () => {
  const dryRun = process.argv.includes('--dry-run');
  try {
    // Ensure migrations are applied before operating
    await knex.migrate.latest();

    const [{ cnt }] = await knex('applications')
      .whereNotIn('status', ['approved', 'rejected'])
      .count('* as cnt');

    if (dryRun) {
      console.log(`[DRY RUN] ${cnt} application(s) would be deleted`);
      process.exit(0);
    }

    const changes = await knex('applications').whereNotIn('status', ['approved', 'rejected']).del();

    console.log(`Deleted ${changes} application(s)`);
  } catch (err) {
    console.error('Cleanup failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
})();
