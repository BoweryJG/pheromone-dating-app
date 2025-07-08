exports.up = function(knex) {
  return knex.schema.createTable('scent_samples', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('scent_profile_id').references('id').inTable('scent_profiles').onDelete('CASCADE');
    table.string('sample_code').unique().notNullable(); // Anonymized code for rating
    table.enum('sample_type', ['t_shirt', 'sweat_patch', 'saliva', 'breath']).defaultTo('t_shirt');
    table.json('storage_conditions'); // Temperature, humidity, etc.
    table.timestamp('expiration_date');
    table.integer('rating_count').defaultTo(0);
    table.decimal('average_rating', 3, 2); // 0-10 scale
    table.boolean('is_available_for_rating').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('scent_samples');
};