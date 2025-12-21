exports.up = function (knex) {
  return knex.schema.createTable('testimonials', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable();
    table.string('name').notNullable();
    table.string('title').nullable();
    table.string('avatar').nullable();
    table.integer('rating').notNullable().defaultTo(5);
    table.text('content').notNullable();
    table.boolean('is_visible').notNullable().defaultTo(true);
    table.boolean('is_approved').notNullable().defaultTo(true);
    table.integer('order').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('testimonials');
};
