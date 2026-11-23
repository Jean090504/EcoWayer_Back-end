// Complementa o catálogo esperado pela API Usuario sem alterar vouchers existentes.
exports.up = async function (knex) {
    if (!(await knex.schema.hasTable('tbl_voucher_catalogo'))) {
        await knex.schema.createTable('tbl_voucher_catalogo', table => {
            table.increments('id');
            table.string('nome_parceiro', 150).notNullable();
            table.string('beneficio', 255).notNullable();
            table.integer('pontos_necessarios').unsigned().notNullable();
            table.integer('validade_dias').unsigned().notNullable();
            table.boolean('ativo').notNullable().defaultTo(true);
        });
    }
    if (!(await knex.schema.hasColumn('tbl_voucher', 'id_voucher_catalogo'))) {
        await knex.schema.alterTable('tbl_voucher', table => {
            table.integer('id_voucher_catalogo').unsigned().nullable()
                .references('id').inTable('tbl_voucher_catalogo')
                .onUpdate('CASCADE').onDelete('RESTRICT');
        });
    }
};
