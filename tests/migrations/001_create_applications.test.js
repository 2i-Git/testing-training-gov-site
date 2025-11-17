const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true
});
const migration = require('../../migrations/001_create_applications');

describe('001_create_applications migration', () => {
  afterAll(async () => {
    await knex.destroy();
  });

  test('creates applications table with correct columns', async () => {
    await migration.up(knex);
    const hasTable = await knex.schema.hasTable('applications');
    expect(hasTable).toBe(true);
    const columns = await knex('applications').columnInfo();
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('application_id');
    expect(columns).toHaveProperty('personal_details');
    expect(columns).toHaveProperty('business_details');
    expect(columns).toHaveProperty('license_details');
    expect(columns).toHaveProperty('declaration');
    expect(columns).toHaveProperty('status');
    expect(columns).toHaveProperty('submitted_at');
    expect(columns).toHaveProperty('created_at');
    expect(columns).toHaveProperty('updated_at');
  });

  test('does not drop data on down', async () => {
    await migration.up(knex);
    await knex('applications').insert({
      application_id: 'A1',
      personal_details: 'pd',
      business_details: 'bd',
      license_details: 'ld',
      declaration: 'yes',
      status: 'submitted',
      submitted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });
    await migration.down(knex);
    const rows = await knex('applications').select();
    expect(rows.length).toBe(1);
  });
});
