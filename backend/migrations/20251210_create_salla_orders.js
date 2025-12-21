exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('salla_orders');
  if (!exists) {
    await knex.schema.createTable('salla_orders', (t) => {
      t.increments('id').primary();
      t.string('order_id').notNullable();
      t.string('sku').notNullable();
      t.string('customer_phone').notNullable();
      t.string('customer_email').nullable();
      t.string('status').notNullable();
      t.boolean('used').notNullable().defaultTo(false);
      t.datetime('used_at').nullable();
      t.datetime('created_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['order_id']);
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasTable('salla_orders');
  if (exists) {
    await knex.schema.dropTable('salla_orders');
  }
};
