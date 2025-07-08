exports.up = function(knex) {
  return knex.schema.createTable('scent_profiles', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('sample_id').unique().notNullable(); // Physical sample tracking ID
    table.enum('status', ['pending', 'collected', 'processing', 'analyzed', 'expired']).defaultTo('pending');
    table.text('collection_instructions');
    table.timestamp('collected_at');
    table.timestamp('received_at');
    table.timestamp('analyzed_at');
    table.json('scent_characteristics'); // Encrypted scent analysis data
    table.json('microbiome_data'); // Encrypted microbiome analysis (Phase 2)
    table.json('genetic_markers'); // Encrypted HLA data (Phase 3)
    table.decimal('sample_quality_score', 3, 2); // 0-1 quality rating
    table.text('lab_notes');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('scent_profiles');
};