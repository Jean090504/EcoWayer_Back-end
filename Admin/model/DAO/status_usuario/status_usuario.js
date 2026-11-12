/************************************************************************************
 * Objetivo: CRUD no MySQL na tabela tbl_status_usuario (SQL sempre com bindings)
 * Data: 15/10/2026
 * Autor: Maxw
 * Versão: 1.0
 ************************************************************************************/
const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// INSERT: retorna o insertId em caso de sucesso, ou false
const insertStatusUsuario = async function (statusUsuario) {
    try {
        let sql = `INSERT INTO tbl_status_usuario (status) VALUES (?);`
        let result = await knexConex.raw(sql, [statusUsuario.status])

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

// UPDATE: retorna true ou false
const updateStatusUsuario = async function (statusUsuario) {
    try {
        let sql = `UPDATE tbl_status_usuario SET status = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [statusUsuario.status, statusUsuario.id])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// SELECT por ID: retorna array (pode ser vazio) ou false
const selectByIdStatusUsuario = async function (id) {
    try {
        let sql = `SELECT id, status FROM tbl_status_usuario WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// SELECT ALL: maior id primeiro
const selectAllStatusUsuario = async function () {
    try {
        let sql = `SELECT id, status FROM tbl_status_usuario ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// DELETE: retorna true ou false
const deleteStatusUsuario = async function (id) {
    try {
        let sql = `DELETE FROM tbl_status_usuario WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertStatusUsuario,
    updateStatusUsuario,
    selectByIdStatusUsuario,
    selectAllStatusUsuario,
    deleteStatusUsuario
}