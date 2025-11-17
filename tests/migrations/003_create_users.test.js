const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true
});
const migration = require('../../migrations/003_create_users');

describe('003_create_users migration', () => {
  afterAll(async () => {
    await knex.destroy();
  });

  test('creates users table with correct columns', async () => {
    await migration.up(knex);
    const hasTable = await knex.schema.hasTable('users');
    expect(hasTable).toBe(true);
    const columns = await knex('users').columnInfo();
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('email');
    expect(columns).toHaveProperty('password_hash');
    expect(columns).toHaveProperty('role');
    expect(columns).toHaveProperty('created_at');
    expect(columns).toHaveProperty('updated_at');
  });

  test('does not drop data on down', async () => {
    await migration.up(knex);
    await knex('users').insert({
      email: 'test@example.com',
      password_hash: 'hash',
      role: 'user',
      created_at: new Date(),
      updated_at: new Date()
    });
    await migration.down(knex);
    const rows = await knex('users').select();
    expect(rows.length).toBe(1);
  });
});
