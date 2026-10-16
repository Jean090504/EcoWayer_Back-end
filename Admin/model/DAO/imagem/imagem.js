/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Imagem
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertImagem = async function (imagem) {
    try {
        let sql = `INSERT INTO tbl_imagem (url, id_tipo_imagem) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [imagem.url, imagem.id_tipo_imagem])

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

const updateImagem = async function (imagem) {
    try {
        let sql = `UPDATE tbl_imagem SET url = ?, id_tipo_imagem = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [imagem.url, imagem.id_tipo_imagem, imagem.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Os selects trazem o id_tipo_imagem só para o controller consultar a tabela relacionada.
// O controller remove esse campo antes de responder.
const selectByIdImagem = async function (id) {
    try {
        let sql = `SELECT id, url, id_tipo_imagem FROM tbl_imagem WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllImagem = async function () {
    try {
        let sql = `SELECT id, url, id_tipo_imagem FROM tbl_imagem ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deleteImagem = async function (id) {
    try {
        let sql = `DELETE FROM tbl_imagem WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertImagem,
    updateImagem,
    selectByIdImagem,
    selectAllImagem,
    deleteImagem
}