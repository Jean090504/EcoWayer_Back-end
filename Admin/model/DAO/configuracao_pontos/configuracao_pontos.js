const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const selectTaxaAtiva = async function () {
    try {
        const [rows] = await knexConex.raw(`
            SELECT taxa_conversao
              FROM tbl_configuracao_pontos
             WHERE status = 'ativo'
             ORDER BY id DESC
             LIMIT 1
        `)
        return rows?.[0] ? Number(rows[0].taxa_conversao) : null
    } catch (error) {
        console.log(error)
        return null
    }
}

const updateTaxa = async function (valor) {
    try {
        const [result] = await knexConex.raw(`
            UPDATE tbl_configuracao_pontos
               SET taxa_conversao = ?, data_atualizacao = CURRENT_TIMESTAMP
             WHERE status = 'ativo'
        `, [valor])
        if (result.affectedRows > 0) return true

        const [insert] = await knexConex.raw(`
            INSERT INTO tbl_configuracao_pontos (taxa_conversao, status)
            VALUES (?, 'ativo')
        `, [valor])
        return Boolean(insert.insertId)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = { selectTaxaAtiva, updateTaxa }
