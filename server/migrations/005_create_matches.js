exports.up = function(knex) {
  return knex.schema.createTable('matches', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user1_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('user2_id').references('id').inTable('users').onDelete('CASCADE');
    table.decimal('compatibility_score', 5, 4); // 0-1 compatibility score
    table.decimal('scent_compatibility', 5, 4); // Scent-specific compatibility
    table.decimal('genetic_compatibility', 5, 4); // HLA-based compatibility (Phase 3)
    table.json('match_factors'); // Breakdown of what contributed to match
    table.enum('status', ['pending', 'mutual', 'rejected', 'expired']).defaultTo('pending');
    table.timestamp('matched_at');
    table.timestamp('expires_at');
    table.boolean('user1_liked').defaultTo(false);
    table.boolean('user2_liked').defaultTo(false);
    table.timestamps(true, true);
    
    // Ensure no duplicate matches
    table.unique(['user1_id', 'user2_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('matches');
};