/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de Tipo de Categoria
 * Autor : [SEU NOME]
 * Versão : 1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um novo tipo de categoria e devolve o insertId (ou false)
const insertTipoCategoria = async function (tipoCategoria) {
    try {
        let sql = `INSERT INTO tbl_tipo_categoria (nome) VALUES (?);`
        let result = await knexConex.raw(sql, [tipoCategoria.nome])

        if (Array.isArray(result) && result[0].affectedRows > 0)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Atualiza o nome de um tipo de categoria (o controller já garantiu que o ID existe)
const updateTipoCategoria = async function (tipoCategoria) {
    try {
        let sql = `UPDATE tbl_tipo_categoria SET nome = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [tipoCategoria.nome, tipoCategoria.id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os tipos de categoria
const selectAllTipoCategoria = async function () {
    try {
        let sql = `SELECT id, nome FROM tbl_tipo_categoria ORDER BY id;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um tipo de categoria pelo ID
const selectByIdTipoCategoria = async function (id) {
    try {
        let sql = `SELECT id, nome FROM tbl_tipo_categoria WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um tipo de categoria pelo ID
const deleteTipoCategoria = async function (id) {
    try {
        let sql = `DELETE FROM tbl_tipo_categoria WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Conta as categorias vinculadas ao tipo (usada antes do DELETE por causa da FK em tbl_categoria)
const countCategoriaByIdTipoCategoria = async function (id) {
    try {
        let sql = `SELECT COUNT(*) AS total FROM tbl_categoria WHERE id_tipo_categoria = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertTipoCategoria,
    updateTipoCategoria,
    selectAllTipoCategoria,
    selectByIdTipoCategoria,
    deleteTipoCategoria,
    countCategoriaByIdTipoCategoria
}