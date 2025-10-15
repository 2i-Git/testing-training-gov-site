#!/usr/bin/env node
const { migrateLatest, rollback, close } = require('./db');

(async () => {
  const cmd = process.argv[2];
  try {
    if (cmd === 'migrate') {
      const [batch, migrations] = await migrateLatest();
      console.log(`Migrations applied: batch ${batch} -> ${migrations.length} files`);
    } else if (cmd === 'rollback') {
      const [batch, migrations] = await rollback();
      console.log(`Rollback: batch ${batch} -> ${migrations.length} files`);
    } else {
      console.log('Usage: node scripts/db-runner.js [migrate|rollback]');
    }
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await close();
  }
})();
