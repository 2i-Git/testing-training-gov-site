const { Database, DatabaseError } = require('../../database/improved-database');

// Use a temporary in-memory path but we won't connect for NOT_CONNECTED branches
jest.mock('../../config/config', () => ({
  database: { path: ':memory:' },
  app: { name: 'x', version: '1.0.0' },
  NODE_ENV: 'test',
  security: { corsOrigin: '*' },
  port: 0,
  session: { secret: 'x', resave: false, saveUninitialized: true, cookie: {} }
}));

describe('improved-database extra branches', () => {
  test('run/get/all reject with NOT_CONNECTED when not connected', async () => {
    const db = new Database();
    await expect(db.run('SELECT 1')).rejects.toBeInstanceOf(DatabaseError);
    await expect(db.get('SELECT 1')).rejects.toBeInstanceOf(DatabaseError);
    await expect(db.all('SELECT 1')).rejects.toBeInstanceOf(DatabaseError);
  });

  test('transformApplicationRow JSON parse error surfaces as DatabaseError', () => {
    const db = new Database();
    expect(() =>
      db.transformApplicationRow({
        application_id: 'a',
        personal_details: '{bad json',
        business_details: '{}',
        license_details: '{}',
        declaration: null,
        status: 'submitted',
        submitted_at: 'now',
        updated_at: 'now',
        created_at: 'now'
      })
    ).toThrow(DatabaseError);
  });

  test('backup success and failure paths', async () => {
    const db = new Database();
    const fsPromises = require('fs').promises;
    const spy = jest.spyOn(fsPromises, 'copyFile');

    // success
    spy.mockResolvedValueOnce();
    await expect(db.backup('/tmp/backup.sqlite')).resolves.toBeUndefined();

    // failure
    spy.mockRejectedValueOnce(new Error('copy failed'));
    await expect(db.backup('/tmp/backup.sqlite')).rejects.toBeInstanceOf(DatabaseError);
  });

  test('close() handles error and success branches', async () => {
    const db = new Database();

    // error branch
    db.db = { close: cb => cb(new Error('close boom')) };
    db.isConnected = true;
    await expect(db.close()).resolves.toBeUndefined();
    expect(db.isConnected).toBe(false);

    // success branch
    db.db = { close: cb => cb(null) };
    db.isConnected = true;
    await expect(db.close()).resolves.toBeUndefined();
    expect(db.isConnected).toBe(false);
  });
});
