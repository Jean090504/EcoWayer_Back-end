/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_configuracao_pontos no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const updateConfiguracaoPontos = async function (config) {
    try {
        let result = await knexConex.raw(
            `update tbl_configuracao_pontos set taxa_conversao = ?, status = ? where id = 1`,
            [config.taxa_conversao, config.status]
        )

        if (result)
            return result[0].affectedRows > 0 || result[0].changedRows >= 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectConfiguracaoPontos = async function () {
    try {
        let result = await knexConex.raw(
            `select id, taxa_conversao, status, data_atualizacao from tbl_configuracao_pontos where id = 1`
        )

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    updateConfiguracaoPontos,
    selectConfiguracaoPontos
}