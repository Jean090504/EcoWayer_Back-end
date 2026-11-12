exports.up = async function up(knex) {
  if (!(await knex.schema.hasColumn('tbl_usuario', 'senha_hash'))) {
    await knex.schema.alterTable('tbl_usuario', (table) => {
      table.string('senha_hash', 255).nullable();
    });
  }

  if (!(await knex.schema.hasColumn('tbl_email', 'verificado'))) {
    await knex.schema.alterTable('tbl_email', (table) => {
      table.boolean('verificado').notNullable().defaultTo(false);
    });
  }

  if (!(await knex.schema.hasColumn('tbl_telefone', 'verificado'))) {
    await knex.schema.alterTable('tbl_telefone', (table) => {
      table.boolean('verificado').notNullable().defaultTo(false);
    });
  }

  if (!(await knex.schema.hasTable('tbl_codigo_usuario'))) {
    await knex.schema.createTable('tbl_codigo_usuario', (table) => {
      table.increments('id').primary();
      table.integer('id_usuario').notNullable();
      table.string('contato', 255).notNullable();
      table.string('codigo_hash', 255).notNullable();
      table.enum('finalidade', ['email', 'telefone', 'recuperacao']).notNullable();
      table.dateTime('expira_em').notNullable();
      table.integer('tentativas').unsigned().notNullable().defaultTo(0);
      table.index(['contato', 'finalidade']);
    });
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('tbl_codigo_usuario')) await knex.schema.dropTable('tbl_codigo_usuario');
  if (await knex.schema.hasColumn('tbl_telefone', 'verificado')) await knex.schema.alterTable('tbl_telefone', (table) => table.dropColumn('verificado'));
  if (await knex.schema.hasColumn('tbl_email', 'verificado')) await knex.schema.alterTable('tbl_email', (table) => table.dropColumn('verificado'));
  if (await knex.schema.hasColumn('tbl_usuario', 'senha_hash')) await knex.schema.alterTable('tbl_usuario', (table) => table.dropColumn('senha_hash'));
};
