exports.up = async knex => {
  const has = await knex.schema.hasTable('applications');
  if (!has) {
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
  }
};

exports.down = async () => {
  // Do not drop data by default
};
