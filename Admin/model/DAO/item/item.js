/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de item
 *           (tbl_item)
 * Local: model/DAO/item/item.js
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)
const categoriaItemDAO = require('../categoria_item/categoria_item.js')

// Insere um item e retorna o id gerado (ou false)
// Insere o item e o vínculo com a categoria na mesma transação. Retorna o id do item (ou false)
const insertItem = async function (item) {
    try {
        let idItem = false

        await knexConex.transaction(async function (trx) {
            let result = await trx.raw(
                `INSERT INTO tbl_item (nome, descricao, pontos_base, status)
                 VALUES (?, ?, ?, ?);`,
                [item.nome, item.descricao, Number(item.pontos_base), item.status]
            )

            if (result[0].affectedRows > 0) {
                idItem = Number(result[0].insertId)

                let vinculou = await categoriaItemDAO.insertCategoriaItem(item.id_categoria, idItem, trx)

                // o throw é o que faz a transação desfazer o insert do item
                if (!vinculou) throw new Error('Falha ao vincular o item à categoria')
            }
        })

        return idItem
    } catch (error) {
        console.log(error)
        return false
    }
}

// Atualiza um item pelo id
const updateItem = async function (item) {
    try {
        let sql = `UPDATE tbl_item
                   SET nome = ?, descricao = ?, pontos_base = ?, status = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            item.nome,
            item.descricao,
            Number(item.pontos_base),
            item.status,
            Number(item.id)
        ])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um item e, na mesma transação, os vínculos dele com categorias
const deleteItem = async function (id) {
    try {
        let apagou = false

        await knexConex.transaction(async function (trx) {
            await trx.raw(`DELETE FROM tbl_categoria_item WHERE id_item = ?;`, [Number(id)])

            let result = await trx.raw(`DELETE FROM tbl_item WHERE id = ?;`, [Number(id)])
            apagou = result[0].affectedRows > 0
        })

        return apagou
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os itens (mais recentes primeiro)
const selectAllItem = async function () {
    try {
        let sql = `SELECT id, nome, descricao, pontos_base, status
                   FROM tbl_item
                   ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um item pelo id (lista vazia se não existir)
const selectByIdItem = async function (id) {
    try {
        let sql = `SELECT id, nome, descricao, pontos_base, status
                   FROM tbl_item
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [Number(id)])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertItem,
    updateItem,
    deleteItem,
    selectAllItem,
    selectByIdItem
}