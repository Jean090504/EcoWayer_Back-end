/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Categoria e Item (tbl_categoria_item)
 * Local: model/DAO/categoria_item/categoria_item.js
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Vincula um item a uma categoria
const insertCategoriaItem = async function (idCategoria, idItem) {
    try {
        let sql = `INSERT INTO tbl_categoria_item (id_categoria, id_item) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [Number(idCategoria), Number(idItem)])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna o vínculo específico (lista vazia se não existir)
const selectVinculo = async function (idCategoria, idItem) {
    try {
        let sql = `SELECT id_categoria, id_item
                   FROM tbl_categoria_item
                   WHERE id_categoria = ? AND id_item = ?;`
        let result = await knexConex.raw(sql, [Number(idCategoria), Number(idItem)])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista os vínculos "crus" (somente os ids)
const selectAllCategoriaItem = async function () {
    try {
        let sql = `SELECT id_categoria, id_item
                   FROM tbl_categoria_item
                   ORDER BY id_categoria, id_item;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Itens de uma categoria (com os dados do item)
const selectItensByCategoria = async function (idCategoria) {
    try {
        let sql = `SELECT i.id, i.nome, i.descricao, i.pontos_base, i.status
                   FROM tbl_item AS i
                   INNER JOIN tbl_categoria_item AS ci ON ci.id_item = i.id
                   WHERE ci.id_categoria = ?
                   ORDER BY i.id;`
        let result = await knexConex.raw(sql, [Number(idCategoria)])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Remove um vínculo específico
const deleteCategoriaItem = async function (idCategoria, idItem) {
    try {
        let sql = `DELETE FROM tbl_categoria_item WHERE id_categoria = ? AND id_item = ?;`
        let result = await knexConex.raw(sql, [Number(idCategoria), Number(idItem)])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Substitui TODOS os itens de uma categoria pela lista recebida (em transação)
// (lista vazia também é válida: só apaga os vínculos)
const replaceItensDaCategoria = async function (idCategoria, itens) {
    try {
        await knexConex.transaction(async function (trx) {
            await trx.raw(`DELETE FROM tbl_categoria_item WHERE id_categoria = ?;`, [Number(idCategoria)])

            for (let idItem of itens) {
                await trx.raw(
                    `INSERT INTO tbl_categoria_item (id_categoria, id_item) VALUES (?, ?);`,
                    [Number(idCategoria), Number(idItem)]
                )
            }
        })

        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertCategoriaItem,
    selectVinculo,
    selectAllCategoriaItem,
    selectItensByCategoria,
    deleteCategoriaItem,
    replaceItensDaCategoria
}