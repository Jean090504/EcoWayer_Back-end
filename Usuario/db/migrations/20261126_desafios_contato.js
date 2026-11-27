exports.up = async function (db) {
    if (await db.schema.hasTable('tbl_desafio_contato')) return
    await db.schema.createTable('tbl_desafio_contato', table => {
        table.string('id', 36).primary()
        table.string('tipo', 10).notNullable()
        table.string('finalidade', 20).notNullable()
        table.string('destino', 255).notNullable()
        table.string('codigo_hash', 64).notNullable()
        table.dateTime('expira_em').notNullable()
        table.dateTime('criado_em').notNullable()
        table.dateTime('enviado_em').notNullable()
        table.dateTime('confirmado_em').nullable()
        table.dateTime('consumido_em').nullable()
        table.integer('tentativas').notNullable().defaultTo(0)
        table.index(['tipo', 'destino', 'finalidade', 'criado_em'], 'idx_desafio_destino')
    })
}

exports.down = async function (db) {
    await db.schema.dropTableIfExists('tbl_desafio_contato')
}
