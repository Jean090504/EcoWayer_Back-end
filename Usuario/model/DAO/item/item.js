/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de Item
 * Autor : [SEU NOME]
 * Versão : 1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um novo item e devolve o insertId (ou false)
const insertItem = async function (item) {
    try {
        let sql = `INSERT INTO tbl_item (nome, descricao, pontos_base, status) VALUES (?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [item.nome, item.descricao, item.pontos_base, item.status])

        if (Array.isArray(result) && result[0].affectedRows > 0)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Atualiza um item (o controller já garantiu que o ID existe)
const updateItem = async function (item) {
    try {
        let sql = `UPDATE tbl_item
                   SET nome = ?, descricao = ?, pontos_base = ?, status = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [item.nome, item.descricao, item.pontos_base, item.status, item.id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os itens
const selectAllItem = async function () {
    try {
        let sql = `SELECT id, nome, descricao, pontos_base, status FROM tbl_item ORDER BY id;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um item pelo ID
const selectByIdItem = async function (id) {
    try {
        let sql = `SELECT id, nome, descricao, pontos_base, status FROM tbl_item WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um item pelo ID (os vínculos com categoria são apagados antes, pelo controller)
const deleteItem = async function (id) {
    try {
        let sql = `DELETE FROM tbl_item WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertItem,
    updateItem,
    selectAllItem,
    selectByIdItem,
    deleteItem
}