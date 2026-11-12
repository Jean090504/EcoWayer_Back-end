/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Tipo Imagem
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertTipoImagem = async function (tipoImagem) {
    try {
        let sql = `INSERT INTO tbl_tipo_imagem (tipo) VALUES (?);`
        let result = await knexConex.raw(sql, [tipoImagem.tipo])

        // devolve o id gerado (result[0] é o ResultSetHeader do MySQL)
        return result ? result[0].insertId : false
    } catch (error) {
        console.log(error)
        return false
    }
}

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

const selectByIdTipoImagem = async function (id) {
    try {
        let sql = `SELECT id, tipo FROM tbl_tipo_imagem WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

const selectAllTipoImagem = async function () {
    try {
        let sql = `SELECT id, tipo FROM tbl_tipo_imagem;`
        let result = await knexConex.raw(sql)

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

// Quantas imagens usam este tipo. Usado antes de excluir.
const selectTipoImagemEmUso = async function (id) {
    try {
        let sql = `SELECT COUNT(*) AS total FROM tbl_imagem WHERE id_tipo_imagem = ?;`
        let result = await knexConex.raw(sql, [id])

        if (Array.isArray(result)) {
            return Number(result[0][0].total)
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

const deleteTipoImagem = async function (id) {
    try {
        let sql = `DELETE FROM tbl_tipo_imagem WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        return false
    }
}

module.exports = {
    insertTipoImagem,
    updateTipoImagem,
    selectByIdTipoImagem,
    selectAllTipoImagem,
    selectTipoImagemEmUso,
    deleteTipoImagem
}