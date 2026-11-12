/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_historico_anuncio no banco de dados MySQL
 * Local: model/DAO/historico_anuncio/historico_anuncio.js
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um registro de histórico e retorna o id gerado (ou false). data_alteracao é gerada pelo banco.
const insertHistoricoAnuncio = async function (historico) {
    try {
        let sql = `INSERT INTO tbl_historico_anuncio (status, data_alteracao, detalhes, id_anuncio)
                   VALUES (?, NOW(), ?, ?);`
        let result = await knexConex.raw(sql, [historico.status, historico.detalhes, historico.id_anuncio])

        if (Array.isArray(result) && result[0].insertId) {
            return result[0].insertId
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

// Atualiza status e detalhes (não altera data_alteracao nem o anúncio do registro)
const updateHistoricoAnuncio = async function (historico) {
    try {
        let sql = `UPDATE tbl_historico_anuncio SET status = ?, detalhes = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [historico.status, historico.detalhes, historico.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um registro pelo id
const selectByIdHistoricoAnuncio = async function (id) {
    try {
        let sql = `SELECT id, status, data_alteracao, detalhes, id_anuncio
                   FROM tbl_historico_anuncio WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os registros (mais recente primeiro)
const selectAllHistoricoAnuncio = async function () {
    try {
        let sql = `SELECT id, status, data_alteracao, detalhes, id_anuncio
                   FROM tbl_historico_anuncio ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um registro pelo id
const deleteHistoricoAnuncio = async function (id) {
    try {
        let sql = `DELETE FROM tbl_historico_anuncio WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertHistoricoAnuncio,
    updateHistoricoAnuncio,
    selectByIdHistoricoAnuncio,
    selectAllHistoricoAnuncio,
    deleteHistoricoAnuncio
}