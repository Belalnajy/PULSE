exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('support_requests');
  if (!exists) {
    return knex.schema.createTable('support_requests', function (t) {
      t.increments('id').primary();
      t.integer('user_id')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      t.string('order_id').nullable();
      t.string('phone').nullable();
      t.text('message').notNullable();
      t.boolean('resolved').notNullable().defaultTo(false);
      t.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('support_requests');
};
