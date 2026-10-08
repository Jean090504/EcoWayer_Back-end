/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Categoria
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertCategoria = async function (categoria) {
    try {
        let sql = `INSERT INTO tbl_categoria (nome, pontos, id_tipo_categoria) VALUES (?, ?, ?);`
        let result = await knexConex.raw(sql, [categoria.nome, categoria.pontos, categoria.id_tipo_categoria])

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

const updateCategoria = async function (categoria) {
    try {
        let sql = `UPDATE tbl_categoria SET nome = ?, pontos = ?, id_tipo_categoria = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [categoria.nome, categoria.pontos, categoria.id_tipo_categoria, categoria.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdCategoria = async function (id) {
    try {
        let sql = `SELECT c.id, c.nome, c.pontos, c.id_tipo_categoria, t.nome AS tipo_categoria
                   FROM tbl_categoria AS c
                   INNER JOIN tbl_tipo_categoria AS t ON t.id = c.id_tipo_categoria
                   WHERE c.id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllCategoria = async function () {
    try {
        let sql = `SELECT c.id, c.nome, c.pontos, c.id_tipo_categoria, t.nome AS tipo_categoria
                   FROM tbl_categoria AS c
                   INNER JOIN tbl_tipo_categoria AS t ON t.id = c.id_tipo_categoria
                   ORDER BY c.nome;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deleteCategoria = async function (id) {
    try {
        let sql = `DELETE FROM tbl_categoria WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertCategoria,
    updateCategoria,
    selectByIdCategoria,
    selectAllCategoria,
    deleteCategoria
}