/************************************************************************************
 * Objetivo: CRUD no MySQL na tabela tbl_insignia (SQL sempre com bindings)
 * Data: 16/10/2026
 * Autor: Maxwillian Santana
 * Versão: 1.0
 ************************************************************************************/
const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// INSERT: retorna o insertId em caso de sucesso, ou false
const insertInsignia = async function (insignia) {
    try {
        let sql = `INSERT INTO tbl_insignia (nome, descricao, meta, unidade) VALUES (?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [insignia.nome, insignia.descricao, insignia.meta, insignia.unidade])

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
const updateInsignia = async function (insignia) {
    try {
        let sql = `UPDATE tbl_insignia SET nome = ?, descricao = ?, meta = ?, unidade = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [insignia.nome, insignia.descricao, insignia.meta, insignia.unidade, insignia.id])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// SELECT por ID: retorna array (pode ser vazio) ou false
const selectByIdInsignia = async function (id) {
    try {
        let sql = `SELECT id, nome, descricao, meta, unidade FROM tbl_insignia WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// SELECT ALL: maior id primeiro
const selectAllInsignia = async function () {
    try {
        let sql = `SELECT id, nome, descricao, meta, unidade FROM tbl_insignia ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// DELETE: retorna true ou false
const deleteInsignia = async function (id) {
    try {
        let sql = `DELETE FROM tbl_insignia WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertInsignia,
    updateInsignia,
    selectByIdInsignia,
    selectAllInsignia,
    deleteInsignia
}