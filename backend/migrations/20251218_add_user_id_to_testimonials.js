exports.up = function (knex) {
  return knex.schema.table('testimonials', (table) => {
    table.integer('user_id').unsigned().nullable();
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.table('testimonials', (table) => {
    table.dropForeign('user_id');
    table.dropColumn('user_id');
  });
};
