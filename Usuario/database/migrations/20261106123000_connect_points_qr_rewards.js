// Liga a negociação à entrega e habilita QR codes e catálogo de recompensas.
exports.up = async (knex) => {
    await knex.schema.alterTable('tbl_entrega', (table) => {
        table.integer('id_negociacao').unsigned().nullable().unique();
        table.foreign('id_negociacao')
            .references('id')
            .inTable('tbl_negociacao')
            .onDelete('SET NULL');
    });

    await knex.schema.alterTable('tbl_qr_code', (table) => {
        table.integer('id_usuario_gerador').nullable();
        table.foreign('id_usuario_gerador')
            .references('id')
            .inTable('tbl_usuario')
            .onDelete('SET NULL');
    });

    await knex.schema.createTable('tbl_catalogo_voucher', (table) => {
        table.increments('id');
        table.string('nome_parceiro', 150).notNullable();
        table.string('beneficio', 255).notNullable();
        table.integer('pontos_necessarios').unsigned().notNullable();
        table.integer('validade_dias').unsigned().notNullable().defaultTo(30);
        table.boolean('ativo').notNullable().defaultTo(true);
        table.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
    });

    // Mantém o item de exemplo que já aparece nos inserts entregues.
    await knex('tbl_catalogo_voucher').insert({
        nome_parceiro: 'EcoShop',
        beneficio: '10% de desconto em produtos sustentáveis.',
        pontos_necessarios: 15,
        validade_dias: 30,
        ativo: true,
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('tbl_catalogo_voucher');

    await knex.schema.alterTable('tbl_qr_code', (table) => {
        table.dropForeign('id_usuario_gerador');
        table.dropColumn('id_usuario_gerador');
    });

    await knex.schema.alterTable('tbl_entrega', (table) => {
        table.dropForeign('id_negociacao');
        table.dropColumn('id_negociacao');
    });
};
