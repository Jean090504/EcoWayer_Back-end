const BENEFICIOS_DEMONSTRACAO = [
    { nome_parceiro: 'EcoWayer', beneficio: 'Cupom demonstrativo de 5% em produtos sustentáveis', pontos_necessarios: 100, validade_dias: 30, ativo: true },
    { nome_parceiro: 'EcoWayer', beneficio: 'Cupom demonstrativo de 10% em produtos sustentáveis', pontos_necessarios: 250, validade_dias: 30, ativo: true },
    { nome_parceiro: 'EcoWayer', beneficio: 'Kit demonstrativo de reutilização e reciclagem', pontos_necessarios: 500, validade_dias: 60, ativo: true }
]

exports.up = async function (knex) {
    for (const beneficio of BENEFICIOS_DEMONSTRACAO) {
        const existente = await knex('tbl_voucher_catalogo')
            .where({ nome_parceiro: beneficio.nome_parceiro, beneficio: beneficio.beneficio })
            .first('id')
        if (!existente) await knex('tbl_voucher_catalogo').insert(beneficio)
    }
}

exports.down = async function (knex) {
    await knex('tbl_voucher_catalogo')
        .where({ nome_parceiro: 'EcoWayer' })
        .whereIn('beneficio', BENEFICIOS_DEMONSTRACAO.map(item => item.beneficio))
        .del()
}
