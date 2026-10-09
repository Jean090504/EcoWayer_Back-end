/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Ponto de Coleta
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertPontoColeta = async function (ponto) {
    try {
        let sql = `INSERT INTO tbl_ponto_coleta (nome, descricao, status, latitude, longitude, id_categoria)
                   VALUES (?, ?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            ponto.nome,
            ponto.descricao,
            ponto.status,
            ponto.latitude,
            ponto.longitude,
            ponto.id_categoria
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

const updatePontoColeta = async function (ponto) {
    try {
        let sql = `UPDATE tbl_ponto_coleta SET
                       nome = ?, descricao = ?, status = ?,
                       latitude = ?, longitude = ?, id_categoria = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            ponto.nome,
            ponto.descricao,
            ponto.status,
            ponto.latitude,
            ponto.longitude,
            ponto.id_categoria,
            ponto.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdPontoColeta = async function (id) {
    try {
        let sql = `SELECT p.id, p.nome, p.descricao, p.status, p.latitude, p.longitude,
                          c.nome AS categoria
                   FROM tbl_ponto_coleta AS p
                   INNER JOIN tbl_categoria AS c ON c.id = p.id_categoria
                   WHERE p.id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllPontoColeta = async function () {
    try {
        let sql = `SELECT p.id, p.nome, p.descricao, p.status, p.latitude, p.longitude,
                          c.nome AS categoria
                   FROM tbl_ponto_coleta AS p
                   INNER JOIN tbl_categoria AS c ON c.id = p.id_categoria
                   ORDER BY p.id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deletePontoColeta = async function (id) {
    try {
        let sql = `DELETE FROM tbl_ponto_coleta WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertPontoColeta,
    updatePontoColeta,
    selectByIdPontoColeta,
    selectAllPontoColeta,
    deletePontoColeta
}