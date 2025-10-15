const db = require('../../scripts/db');

describe('DB utility functions', () => {
  test('migrateLatest runs without error', async () => {
    await expect(db.migrateLatest()).resolves.toBeDefined();
  });

  test('rollback runs without error', async () => {
    await expect(db.rollback()).resolves.toBeDefined();
  });

  test('close runs without error', async () => {
    await expect(db.close()).resolves.toBeUndefined();
  });
});
