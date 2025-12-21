exports.up = function (knex) {
  return knex.schema.hasTable('support_requests').then(exists => {
    if (exists) {
      return knex.schema.dropTable('support_requests');
    }
  }).then(() => {
    return knex.schema.createTable('support_requests', function (t) {
      t.increments('id').primary();
      t.integer('user_id').nullable().references('users.id').onDelete('CASCADE');
      t.string('email').nullable();
      t.string('order_id').nullable();
      t.string('phone').nullable();
      t.text('message').notNullable();
      t.boolean('is_new_user').notNullable().defaultTo(false);
      t.boolean('resolved').notNullable().defaultTo(false);
      t.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('support_requests');
};

