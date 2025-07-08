exports.up = function(knex) {
  return knex.schema.createTable('sample_orders', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('order_number').unique().notNullable();
    table.enum('status', ['pending', 'shipped', 'delivered', 'returned', 'cancelled']).defaultTo('pending');
    table.json('shipping_address').notNullable();
    table.string('tracking_number');
    table.string('shipping_carrier');
    table.decimal('shipping_cost', 10, 2);
    table.timestamp('shipped_at');
    table.timestamp('delivered_at');
    table.timestamp('expected_return_date');
    table.json('kit_contents'); // What's included in the kit
    table.text('special_instructions');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sample_orders');
};