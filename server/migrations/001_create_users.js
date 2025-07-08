exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.date('date_of_birth').notNullable();
    table.enum('gender', ['male', 'female', 'non_binary', 'other']).notNullable();
    table.enum('interested_in', ['male', 'female', 'both', 'non_binary']).notNullable();
    table.text('bio');
    table.json('photos'); // Array of photo URLs
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.string('city');
    table.string('state');
    table.string('country');
    table.enum('subscription_tier', ['basic', 'premium', 'elite']).defaultTo('basic');
    table.timestamp('subscription_expires_at');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('last_active_at');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};