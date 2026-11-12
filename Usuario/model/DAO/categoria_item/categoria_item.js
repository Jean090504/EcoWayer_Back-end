/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Categoria e Item (sem endpoint, filha de categoria e de item)
 * Autor : [SEU NOME]
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertCategoriaItem = async function (relacao) {
    try {
        let sql = `INSERT INTO tbl_categoria_item (id_categoria, id_item) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [relacao.id_categoria, relacao.id_item])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna os itens de uma categoria (mesmas colunas do selectByIdItem)
const selectItensByIdCategoria = async function (idCategoria) {
    try {
        let sql = `SELECT i.id, i.nome, i.descricao, i.pontos_base, i.status
                   FROM tbl_item AS i
                   INNER JOIN tbl_categoria_item AS ci ON ci.id_item = i.id
                   WHERE ci.id_categoria = ?
                   ORDER BY i.id;`
        let result = await knexConex.raw(sql, [idCategoria])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE da categoria: apaga todas as relações dela
// (0 linhas apagadas também é sucesso: a categoria pode não ter itens ainda)
const deleteItensByIdCategoria = async function (idCategoria) {
    try {
        let sql = `DELETE FROM tbl_categoria_item WHERE id_categoria = ?;`
        let result = await knexConex.raw(sql, [idCategoria])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna as categorias de um item (mesmas colunas do selectByIdCategoria)
const selectCategoriasByIdItem = async function (idItem) {
    try {
        let sql = `SELECT c.id, c.nome, c.pontos, c.id_tipo_categoria, c.img, c.cor
                   FROM tbl_categoria AS c
                   INNER JOIN tbl_categoria_item AS ci ON ci.id_categoria = c.id
                   WHERE ci.id_item = ?
                   ORDER BY c.id;`
        let result = await knexConex.raw(sql, [idItem])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE do item: apaga todas as relações dele
// (0 linhas apagadas também é sucesso: o item pode não ter categorias ainda)
const deleteCategoriasByIdItem = async function (idItem) {
    try {
        let sql = `DELETE FROM tbl_categoria_item WHERE id_item = ?;`
        let result = await knexConex.raw(sql, [idItem])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertCategoriaItem,
    selectItensByIdCategoria,
    deleteItensByIdCategoria,
    selectCategoriasByIdItem,
    deleteCategoriasByIdItem
}