/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela
 *           intermediária de categoria e item (tbl_categoria_item)
 * Local: model/DAO/categoria_item/categoria_item.js
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Vincula um item a uma categoria. Aceita uma transação (trx) opcional
const insertCategoriaItem = async function (idCategoria, idItem, trx) {
    try {
        let executor = trx ? trx : knexConex
        let sql = `INSERT INTO tbl_categoria_item (id_categoria, id_item)
                   VALUES (?, ?);`
        let result = await executor.raw(sql, [Number(idCategoria), Number(idItem)])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Remove o vínculo de um item com uma categoria
const deleteCategoriaItem = async function (idCategoria, idItem) {
    try {
        let sql = `DELETE FROM tbl_categoria_item
                   WHERE id_categoria = ? AND id_item = ?;`
        let result = await knexConex.raw(sql, [Number(idCategoria), Number(idItem)])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca o vínculo (lista vazia se não existir)
const selectCategoriaItem = async function (idCategoria, idItem) {
    try {
        let sql = `SELECT * FROM tbl_categoria_item
                   WHERE id_categoria = ? AND id_item = ?;`
        let result = await knexConex.raw(sql, [Number(idCategoria), Number(idItem)])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertCategoriaItem,
    deleteCategoriaItem,
    selectCategoriaItem
}