exports.up = async knex => {
  const has = await knex.schema.hasTable('users');
  if (!has) {
    await knex.schema.createTable('users', t => {
      t.increments('id').primary();
      t.string('email').notNullable().unique().index();
      t.string('password_hash').notNullable();
      t.string('role').notNullable().defaultTo('user').index();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
  }
};

exports.down = async () => {
  // No destructive down migration for training app
};
