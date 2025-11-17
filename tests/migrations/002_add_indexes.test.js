const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true
});
const migration = require('../../migrations/002_add_indexes');

describe('002_add_indexes migration', () => {
  beforeAll(async () => {
    // Create applications table for index creation
    await knex.schema.createTable('applications', t => {
      t.increments('id').primary();
      t.string('application_id').notNullable().unique().index();
      t.string('status').notNullable().defaultTo('submitted').index();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).index();
    });
  });
  afterAll(async () => {
    await knex.destroy();
  });

  test('creates indexes on status and created_at', async () => {
    await migration.up(knex);
    // SQLite: check if indexes exist
    const indexes = await knex.raw("PRAGMA index_list('applications')");
    const indexNames = indexes && indexes.length ? indexes.map(i => i.name) : indexes;
    expect(indexNames).toEqual(
      expect.arrayContaining(['idx_applications_status', 'idx_applications_created_at'])
    );
  });

  test('drops indexes on down', async () => {
    await migration.up(knex);
    await migration.down(knex);
    const indexes = await knex.raw("PRAGMA index_list('applications')");
    const indexNames = indexes && indexes.length ? indexes.map(i => i.name) : indexes;
    expect(indexNames).not.toEqual(
      expect.arrayContaining(['idx_applications_status', 'idx_applications_created_at'])
    );
  });
});
