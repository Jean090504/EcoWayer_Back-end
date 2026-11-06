// Adiciona os campos e tabelas usados pelos módulos da comunidade.
exports.up = async (knex) => {
    await knex.schema.alterTable('tbl_anuncio', (table) => {
        table.decimal('valor', 10, 2).nullable();
    });

    await knex.schema.alterTable('tbl_endereco', (table) => {
        table.decimal('latitude', 10, 7).nullable();
        table.decimal('longitude', 10, 7).nullable();
    });

    await knex.schema.createTable('tbl_negociacao', (table) => {
        table.increments('id');
        table.integer('id_conversa').notNullable();
        table.integer('id_usuario').notNullable();
        // `increments` cria um identificador sem sinal no MySQL.
        table.integer('id_negociacao_pai').unsigned().nullable();
        table.decimal('valor_ofertado', 10, 2).notNullable();
        table.string('local_retirada', 255).notNullable();
        table.string('status', 24).notNullable().defaultTo('pendente');
        table.timestamp('criada_em').notNullable().defaultTo(knex.fn.now());
        table.timestamp('atualizada_em').notNullable().defaultTo(knex.fn.now());
        table.foreign('id_conversa').references('id').inTable('tbl_conversa').onDelete('CASCADE');
        table.foreign('id_usuario').references('id').inTable('tbl_usuario');
        table.foreign('id_negociacao_pai').references('id').inTable('tbl_negociacao');
        table.index(['id_conversa', 'status']);
    });

    await knex.schema.createTable('tbl_notificacao', (table) => {
        table.increments('id');
        table.integer('id_usuario').notNullable();
        table.string('tipo', 40).notNullable();
        table.string('titulo', 120).notNullable();
        table.text('mensagem').notNullable();
        table.json('dados').nullable();
        table.boolean('lida').notNullable().defaultTo(false);
        table.timestamp('criada_em').notNullable().defaultTo(knex.fn.now());
        table.foreign('id_usuario').references('id').inTable('tbl_usuario').onDelete('CASCADE');
        table.index(['id_usuario', 'lida', 'criada_em']);
    });

    await knex.schema.createTable('tbl_denuncias_usuario', (table) => {
        table.increments('id');
        table.integer('id_denuncias').notNullable();
        table.integer('id_usuario').notNullable();
        table.unique(['id_denuncias', 'id_usuario']);
        table.foreign('id_denuncias').references('id').inTable('tbl_denuncias').onDelete('CASCADE');
        table.foreign('id_usuario').references('id').inTable('tbl_usuario');
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('tbl_denuncias_usuario');
    await knex.schema.dropTableIfExists('tbl_notificacao');
    await knex.schema.dropTableIfExists('tbl_negociacao');
    await knex.schema.alterTable('tbl_endereco', (table) => {
        table.dropColumn('longitude');
        table.dropColumn('latitude');
    });
    await knex.schema.alterTable('tbl_anuncio', (table) => table.dropColumn('valor'));
};
