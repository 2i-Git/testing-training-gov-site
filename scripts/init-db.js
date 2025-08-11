const Database = require('./database/database');

async function initializeDatabase() {
  console.log('Initializing database...');

  const db = new Database();

  // Database initialization is handled in the constructor
  // This script just ensures the database is created

  setTimeout(async () => {
    console.log('Database initialization complete.');
    await db.close();
    process.exit(0);
  }, 1000);
}

initializeDatabase();
