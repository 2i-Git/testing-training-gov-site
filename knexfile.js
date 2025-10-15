const path = require('node:path');

const isPg = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));

module.exports = {
  client: isPg ? 'pg' : 'sqlite3',
  connection: isPg
    ? process.env.DATABASE_URL
    : {
        filename: process.env.DB_PATH || path.join(process.cwd(), 'database', 'alcohol_license.db')
      },
  useNullAsDefault: !isPg,
  migrations: {
    directory: path.join(process.cwd(), 'migrations'),
    tableName: 'knex_migrations',
    loadExtensions: ['.js']
  },
  pool: isPg ? { min: 0, max: 10 } : { min: 1, max: 1 }
};
