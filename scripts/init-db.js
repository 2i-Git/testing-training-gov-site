const { Database } = require('../database/improved-database');

async function initializeDatabase() {
  console.log('Initializing database...');

  const db = new Database();

  try {
    await db.connect();
    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Failed to initialize database:', err.message || err);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

initializeDatabase();
