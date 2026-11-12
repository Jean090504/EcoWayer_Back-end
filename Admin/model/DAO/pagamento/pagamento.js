/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Pagamento
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertPagamento = async function (pagamento) {
    try {
        let sql = `INSERT INTO tbl_pagamento (status, valor, id_externo, id_anuncio, id_comprador)
                   VALUES (?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            pagamento.status,
            pagamento.valor,
            pagamento.id_externo,
            pagamento.id_anuncio,
            pagamento.id_comprador
        ])

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

const updatePagamento = async function (pagamento) {
    try {
        let sql = `UPDATE tbl_pagamento SET
                       status = ?, valor = ?, id_externo = ?, id_anuncio = ?, id_comprador = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            pagamento.status,
            pagamento.valor,
            pagamento.id_externo,
            pagamento.id_anuncio,
            pagamento.id_comprador,
            pagamento.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Os selects trazem os id_... só para o controller consultar as tabelas relacionadas.
// O controller remove esses campos antes de responder.
const selectByIdPagamento = async function (id) {
    try {
        let sql = `SELECT id, status, valor, id_externo, id_anuncio, id_comprador
                   FROM tbl_pagamento WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllPagamento = async function () {
    try {
        let sql = `SELECT id, status, valor, id_externo, id_anuncio, id_comprador
                   FROM tbl_pagamento ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deletePagamento = async function (id) {
    try {
        let sql = `DELETE FROM tbl_pagamento WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)

        // 1451 = existe registro de outra tabela apontando para este
        if (error.errno == 1451) {
            return 'EM_USO'
        }

        return false
    }
}

module.exports = {
    insertPagamento,
    updatePagamento,
    selectByIdPagamento,
    selectAllPagamento,
    deletePagamento
}