/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Histórico de Pagamento
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// data_alteracao é opcional: sem valor, o banco grava a data e hora atuais
const insertHistoricoPagamento = async function (historico) {
    try {
        let sql = `INSERT INTO tbl_historico_pagamento (status, data_alteracao, detalhes, id_pagamento)
                   VALUES (?, COALESCE(?, NOW()), ?, ?);`
        let result = await knexConex.raw(sql, [
            historico.status,
            historico.data_alteracao,
            historico.detalhes,
            historico.id_pagamento
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

// data_alteracao não enviada no PUT mantém o valor que já estava gravado
const updateHistoricoPagamento = async function (historico) {
    try {
        let sql = `UPDATE tbl_historico_pagamento SET
                       status = ?, data_alteracao = COALESCE(?, data_alteracao),
                       detalhes = ?, id_pagamento = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            historico.status,
            historico.data_alteracao,
            historico.detalhes,
            historico.id_pagamento,
            historico.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Os selects trazem o id_pagamento só para o controller consultar a tabela relacionada.
// O controller remove esse campo antes de responder.
// DATE_FORMAT evita que a data volte como "2026-10-20T10:30:00.000Z" (problema de fuso).
const selectByIdHistoricoPagamento = async function (id) {
    try {
        let sql = `SELECT id, status,
                          DATE_FORMAT(data_alteracao, '%Y-%m-%d %H:%i:%s') AS data_alteracao,
                          detalhes, id_pagamento
                   FROM tbl_historico_pagamento WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllHistoricoPagamento = async function () {
    try {
        let sql = `SELECT id, status,
                          DATE_FORMAT(data_alteracao, '%Y-%m-%d %H:%i:%s') AS data_alteracao,
                          detalhes, id_pagamento
                   FROM tbl_historico_pagamento ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deleteHistoricoPagamento = async function (id) {
    try {
        let sql = `DELETE FROM tbl_historico_pagamento WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)

        // 1451 = existe registro de outra tabela apontando para este histórico
        if (error.errno == 1451) {
            return 'EM_USO'
        }

        return false
    }
}

module.exports = {
    insertHistoricoPagamento,
    updateHistoricoPagamento,
    selectByIdHistoricoPagamento,
    selectAllHistoricoPagamento,
    deleteHistoricoPagamento
}