/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Endereço e Ponto de Coleta (sem endpoint, filha de ponto de coleta)
 * Autor : [SEU NOME]
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertEnderecoPontoColeta = async function (relacao) {
    try {
        let sql = `INSERT INTO tbl_endereco_ponto_coleta (id_endereco, id_ponto_coleta) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [relacao.id_endereco, relacao.id_ponto_coleta])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna os endereços de um ponto de coleta (mesmas colunas do selectByIdEndereco)
const selectEnderecosByIdPontoColeta = async function (idPontoColeta) {
    try {
        let sql = `SELECT e.id, e.cep, e.rua, e.numero, e.complemento, e.bairro, e.cidade, e.estado,
                          e.sigla, e.id_externo, e.latitude, e.longitude
                   FROM tbl_endereco AS e
                   INNER JOIN tbl_endereco_ponto_coleta AS ep ON ep.id_endereco = e.id
                   WHERE ep.id_ponto_coleta = ?
                   ORDER BY e.id;`
        let result = await knexConex.raw(sql, [idPontoColeta])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE do ponto de coleta: apaga todas as relações dele
// (0 linhas apagadas também é sucesso: o ponto pode não ter endereços ainda)
const deleteEnderecosByIdPontoColeta = async function (idPontoColeta) {
    try {
        let sql = `DELETE FROM tbl_endereco_ponto_coleta WHERE id_ponto_coleta = ?;`
        let result = await knexConex.raw(sql, [idPontoColeta])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertEnderecoPontoColeta,
    selectEnderecosByIdPontoColeta,
    deleteEnderecosByIdPontoColeta
}