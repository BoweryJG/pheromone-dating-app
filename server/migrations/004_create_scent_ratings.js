exports.up = function(knex) {
  return knex.schema.createTable('scent_ratings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('rater_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('sample_id').references('id').inTable('scent_samples').onDelete('CASCADE');
    table.integer('attraction_score').notNullable(); // 1-10 scale
    table.integer('pleasantness_score').notNullable(); // 1-10 scale
    table.integer('familiarity_score').notNullable(); // 1-10 scale
    table.json('descriptors'); // Array of scent descriptors (floral, musky, etc.)
    table.text('notes'); // Optional user notes
    table.timestamp('rated_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Ensure one rating per user per sample
    table.unique(['rater_id', 'sample_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('scent_ratings');
};