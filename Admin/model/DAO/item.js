/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Item
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertItem = async function (item) {
    try {
        let sql = `INSERT INTO tbl_item (nome, descricao, pontos_base, status) VALUES (?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [item.nome, item.descricao, item.pontos_base, item.status])

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

const updateItem = async function (item) {
    try {
        let sql = `UPDATE tbl_item SET nome = ?, descricao = ?, pontos_base = ?, status = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [item.nome, item.descricao, item.pontos_base, item.status, item.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdItem = async function (id) {
    try {
        let sql = `SELECT id, nome, descricao, pontos_base, status FROM tbl_item WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllItem = async function () {
    try {
        let sql = `SELECT id, nome, descricao, pontos_base, status FROM tbl_item ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Apaga primeiro os vínculos com categorias (tbl_categoria_item) e depois o item, em transação
const deleteItem = async function (id) {
    try {
        await knexConex.transaction(async function (trx) {
            await trx.raw(`DELETE FROM tbl_categoria_item WHERE id_item = ?;`, [id])
            await trx.raw(`DELETE FROM tbl_item WHERE id = ?;`, [id])
        })

        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertItem,
    updateItem,
    selectByIdItem,
    selectAllItem,
    deleteItem
}