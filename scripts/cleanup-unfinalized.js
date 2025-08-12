#!/usr/bin/env node

// Cleanup script: remove applications not in final states (approved, rejected)
// Usage: node scripts/cleanup-unfinalized.js [--dry-run]

const { Database } = require('../database/improved-database');
const config = require('../config/config');

(async () => {
  const dryRun = process.argv.includes('--dry-run');
  const db = new Database();

  try {
    await db.connect();

    const countRow = await db.get(
      "SELECT COUNT(*) AS cnt FROM applications WHERE status NOT IN ('approved','rejected')"
    );
    const count = countRow ? countRow.cnt : 0;

    if (dryRun) {
      console.log(
        `[DRY RUN] ${count} application(s) would be deleted from ${config.database.path}`
      );
      await db.close();
      process.exit(0);
    }

    const res = await db.run(
      "DELETE FROM applications WHERE status NOT IN ('approved','rejected')"
    );

    console.log(`Deleted ${res.changes || 0} application(s) from ${config.database.path}`);
  } catch (err) {
    console.error('Cleanup failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
})();
