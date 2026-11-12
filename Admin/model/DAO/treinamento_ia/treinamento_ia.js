/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_treinamento_ia no banco de dados MySQL
 * Local: model/DAO/treinamento_ia/treinamento_ia.js
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um treinamento e retorna o id gerado (ou false)
const insertTreinamentoIA = async function (treinamento) {
    try {
        let sql = `INSERT INTO tbl_treinamento_ia (status, id_externo, id_ia, id_dataset)
                   VALUES (?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [treinamento.status, treinamento.id_externo, treinamento.id_ia, treinamento.id_dataset])

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

// Atualiza status e id_externo (não altera a IA nem o dataset do registro)
const updateTreinamentoIA = async function (treinamento) {
    try {
        let sql = `UPDATE tbl_treinamento_ia SET status = ?, id_externo = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [treinamento.status, treinamento.id_externo, treinamento.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um registro pelo id
const selectByIdTreinamentoIA = async function (id) {
    try {
        let sql = `SELECT id, status, id_externo, id_ia, id_dataset
                   FROM tbl_treinamento_ia WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os registros (mais recente primeiro)
const selectAllTreinamentoIA = async function () {
    try {
        let sql = `SELECT id, status, id_externo, id_ia, id_dataset
                   FROM tbl_treinamento_ia ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um registro pelo id
const deleteTreinamentoIA = async function (id) {
    try {
        let sql = `DELETE FROM tbl_treinamento_ia WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertTreinamentoIA,
    updateTreinamentoIA,
    selectByIdTreinamentoIA,
    selectAllTreinamentoIA,
    deleteTreinamentoIA
}