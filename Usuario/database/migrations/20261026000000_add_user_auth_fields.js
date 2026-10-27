exports.up = async (knex) => {
  await knex.schema.alterTable('tbl_usuario', (table) => {
    table.string('senha_hash', 255).nullable();
  });
  await knex.schema.alterTable('tbl_email', (table) => table.boolean('verificado').notNullable().defaultTo(false));
  await knex.schema.alterTable('tbl_telefone', (table) => table.boolean('verificado').notNullable().defaultTo(false));
  await knex.schema.createTable('tbl_codigo_usuario', (table) => {
    table.increments('id').primary();
    table.integer('id_usuario').notNullable();
    table.string('contato', 255).notNullable();
    table.string('codigo_hash', 255).notNullable();
    table.enum('finalidade', ['email', 'telefone', 'recuperacao']).notNullable();
    table.timestamp('expira_em').notNullable();
    table.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
    table.integer('tentativas').unsigned().notNullable().defaultTo(0);
    table.foreign('id_usuario').references('id').inTable('tbl_usuario').onDelete('CASCADE');
    table.index(['id_usuario', 'finalidade']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('tbl_codigo_usuario');
  await knex.schema.alterTable('tbl_telefone', (table) => table.dropColumn('verificado'));
  await knex.schema.alterTable('tbl_email', (table) => table.dropColumn('verificado'));
  await knex.schema.alterTable('tbl_usuario', (table) => table.dropColumn('senha_hash'));
};
