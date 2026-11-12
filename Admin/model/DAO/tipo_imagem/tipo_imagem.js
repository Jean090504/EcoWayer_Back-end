/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_tipo_imagem no banco de dados MySQL
 * Autor: Seu Nome
 * Versão: 1.0
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um novo tipo de imagem e retorna o id gerado (ou false)
const insertTipoImagem = async function (tipoImagem) {
    try {
        let sql = `INSERT INTO tbl_tipo_imagem (tipo) VALUES (?);`
        let result = await knexConex.raw(sql, [tipoImagem.tipo])

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

// Atualiza um tipo de imagem existente
const updateTipoImagem = async function (tipoImagem) {
    try {
        let sql = `UPDATE tbl_tipo_imagem SET tipo = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [tipoImagem.tipo, tipoImagem.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um tipo de imagem pelo id
const selectByIdTipoImagem = async function (id) {
    try {
        let sql = `SELECT id, tipo FROM tbl_tipo_imagem WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os tipos de imagem (maior id primeiro)
const selectAllTipoImagem = async function () {
    try {
        let sql = `SELECT id, tipo FROM tbl_tipo_imagem ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um tipo de imagem pelo id
const deleteTipoImagem = async function (id) {
    try {
        let sql = `DELETE FROM tbl_tipo_imagem WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertTipoImagem,
    updateTipoImagem,
    selectByIdTipoImagem,
    selectAllTipoImagem,
    deleteTipoImagem
}