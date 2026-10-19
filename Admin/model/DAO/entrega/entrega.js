/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_entrega no banco de dados MySQL
 * Local: model/DAO/entrega/entrega.js
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere uma entrega e retorna o id gerado (ou false)
const insertEntrega = async function (entrega) {
    try {
        let sql = `INSERT INTO tbl_entrega (peso_estimado, status, data_entrega, id_anuncio, id_usuario)
                   VALUES (?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [entrega.peso_estimado, entrega.status, entrega.data_entrega, entrega.id_anuncio, entrega.id_usuario])

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

// Atualiza peso_estimado, status e data_entrega (não altera anúncio nem usuário)
const updateEntrega = async function (entrega) {
    try {
        let sql = `UPDATE tbl_entrega SET peso_estimado = ?, status = ?, data_entrega = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [entrega.peso_estimado, entrega.status, entrega.data_entrega, entrega.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdEntrega = async function (id) {
    try {
        let sql = `SELECT id, peso_estimado, status, data_entrega, id_anuncio, id_usuario
                   FROM tbl_entrega WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllEntregas = async function () {
    try {
        let sql = `SELECT id, peso_estimado, status, data_entrega, id_anuncio, id_usuario
                   FROM tbl_entrega ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteEntrega = async function (id) {
    try {
        let sql = `DELETE FROM tbl_entrega WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertEntrega,
    updateEntrega,
    selectByIdEntrega,
    selectAllEntregas,
    deleteEntrega
}