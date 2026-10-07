/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Tipo Categoria
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertTipoCategoria = async function (tipoCategoria) {
    try {
        let sql = `INSERT INTO tbl_tipo_categoria (nome) VALUES (?);`
        let result = await knexConex.raw(sql, [tipoCategoria.nome])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateTipoCategoria = async function (tipoCategoria) {
    try {
        let sql = `UPDATE tbl_tipo_categoria SET nome = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [tipoCategoria.nome, tipoCategoria.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdTipoCategoria = async function (id) {
    try {
        let sql = `SELECT id, nome FROM tbl_tipo_categoria WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllTipoCategoria = async function () {
    try {
        let sql = `SELECT id, nome FROM tbl_tipo_categoria ORDER BY nome;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deleteTipoCategoria = async function (id) {
    try {
        let sql = `DELETE FROM tbl_tipo_categoria WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertTipoCategoria,
    updateTipoCategoria,
    selectByIdTipoCategoria,
    selectAllTipoCategoria,
    deleteTipoCategoria
}