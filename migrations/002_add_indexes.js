exports.up = async knex => {
  // Unique index on application_id is defined in table; ensure additional indexes
  const client = knex.client.config.client;
  if (client === 'sqlite3') {
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)');
    await knex.raw(
      'CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at)'
    );
  } else {
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)');
    await knex.raw(
      'CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at)'
    );
  }
};

exports.down = async knex => {
  await knex.raw('DROP INDEX IF EXISTS idx_applications_status');
  await knex.raw('DROP INDEX IF EXISTS idx_applications_created_at');
};
