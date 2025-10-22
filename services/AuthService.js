const bcrypt = require('bcrypt');
const createKnex = require('knex');
const knexConfig = require('../knexfile');
const { logger } = require('../utils/logger');

class AuthService {
  constructor() {
    this.knex = createKnex(knexConfig);
    this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  }

  async initialize() {
    // Ensure default training users exist with hashed passwords
    await this.ensureUser({
      email: process.env.TRAINING_USER_EMAIL || 'user@example.com',
      password: process.env.TRAINING_USER_PASSWORD || 'password123',
      role: 'user'
    });
    await this.ensureUser({
      email: process.env.TRAINING_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.TRAINING_ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });
    logger.info('AuthService initialized successfully');
  }

  async close() {
    await this.knex.destroy();
  }

  async ensureUser({ email, password, role }) {
    const password_hash = await this.hashPassword(password);
    try {
      // Use an idempotent insert to avoid race conditions in parallel test runs
      // Postgres/SQLite (modern) support ON CONFLICT DO NOTHING
      const inserted = await this.knex('users')
        .insert({ email, password_hash, role })
        .onConflict('email')
        .ignore()
        .returning('id');

      if (Array.isArray(inserted) && inserted.length > 0) {
        return Array.isArray(inserted[0]) ? inserted[0][0] : inserted[0];
      }
    } catch (err) {
      // SQLite compatibility: returning not supported or ON CONFLICT variations
      if (err && err.message && /returning/i.test(err.message)) {
        await this.knex('users')
          .insert({ email, password_hash, role })
          .onConflict('email')
          .ignore();
      } else if (err && /unique|constraint/i.test(err.message)) {
        // Ignore unique violations caused by races
      } else {
        throw err;
      }
    }

    // If insert was ignored (already exists), fetch id
    const row = await this.knex('users').first('id').where({ email });
    return row ? row.id : null;
  }

  async findUserByEmail(email) {
    return this.knex('users').first('id', 'email', 'password_hash', 'role').where({ email });
  }

  async hashPassword(plain) {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async verifyPassword(plain, hash) {
    if (!hash) return false;
    try {
      return await bcrypt.compare(plain, hash);
    } catch {
      return false;
    }
  }
}

module.exports = AuthService;
