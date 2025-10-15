const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig);

async function migrateLatest() {
  return knex.migrate.latest();
}

async function rollback() {
  return knex.migrate.rollback(undefined, true);
}

async function close() {
  await knex.destroy();
}

module.exports = { migrateLatest, rollback, close, knex };
