const { Database, DatabaseError } = require('../../database/knex-database');
const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true
});

describe('Database class', () => {
  let db;
  beforeAll(async () => {
    db = new Database();
    db.knex = knex;
    await knex.schema.createTable('applications', t => {
      t.increments('id').primary();
      t.string('application_id').notNullable().unique().index();
      t.text('personal_details').notNullable();
      t.text('business_details').notNullable();
      t.text('license_details').notNullable();
      t.string('declaration').notNullable().defaultTo('yes');
      t.string('status').notNullable().defaultTo('submitted').index();
      t.timestamp('submitted_at').notNullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).index();
      t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).index();
    });
  });
  afterAll(async () => {
    await db.close();
  });

  test('connect() returns true', async () => {
    expect(await db.connect()).toBe(true);
  });

  test('createApplication and getApplicationById', async () => {
    const appData = {
      applicationId: 'A1',
      personalDetails: { name: 'Test' },
      businessDetails: { company: 'Biz' },
      licenseDetails: { type: 'Type' },
      declaration: 'yes',
      status: 'submitted',
      submittedAt: new Date().toISOString()
    };
    await db.createApplication(appData);
    const app = await db.getApplicationById('A1');
    expect(app.applicationId).toBe('A1');
    expect(app.personalDetails.name).toBe('Test');
  });

  test('getAllApplications returns array', async () => {
    const apps = await db.getAllApplications();
    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBeGreaterThan(0);
  });

  test('updateApplicationStatus updates status', async () => {
    await db.updateApplicationStatus('A1', 'approved');
    const app = await db.getApplicationById('A1');
    expect(app.status).toBe('approved');
  });

  test('deleteApplication removes application', async () => {
    await db.deleteApplication('A1');
    const app = await db.getApplicationById('A1');
    expect(app).toBeNull();
  });

  test('throws DatabaseError on invalid get', async () => {
    await expect(db.getApplicationById()).rejects.toThrow(DatabaseError);
  });

  test('throws DatabaseError on duplicate create', async () => {
    const appData = {
      applicationId: 'A2',
      personalDetails: { name: 'Test2' },
      businessDetails: { company: 'Biz2' },
      licenseDetails: { type: 'Type2' },
      declaration: 'yes',
      status: 'submitted',
      submittedAt: new Date().toISOString()
    };
    await db.createApplication(appData);
    await expect(db.createApplication(appData)).rejects.toThrow(DatabaseError);
  });
});
