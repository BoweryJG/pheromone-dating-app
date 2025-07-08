exports.up = function(knex) {
  return knex.schema.createTable('messages', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('match_id').references('id').inTable('matches').onDelete('CASCADE');
    table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('receiver_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.enum('message_type', ['text', 'image', 'voice', 'video']).defaultTo('text');
    table.string('media_url'); // For non-text messages
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamp('sent_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};