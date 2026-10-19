/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Tipo de Denúncia
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Retorna o ID gerado (number) ou false
const insertTipoDenuncia = async function (tipoDenuncia) {
    try {
        let sql = `INSERT INTO tbl_tipo_denuncias (tipo) VALUES (?);`
        let result = await knexConex.raw(sql, [tipoDenuncia.tipo])

        if (Array.isArray(result) && result[0].affectedRows > 0) {
            return result[0].insertId
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateTipoDenuncia = async function (tipoDenuncia) {
    try {
        let sql = `UPDATE tbl_tipo_denuncias SET tipo = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [tipoDenuncia.tipo, tipoDenuncia.id])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdTipoDenuncia = async function (id) {
    try {
        let sql = `SELECT id, tipo FROM tbl_tipo_denuncias WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllTipoDenuncia = async function () {
    try {
        let sql = `SELECT id, tipo FROM tbl_tipo_denuncias ORDER BY id;`
        let result = await knexConex.raw(sql)

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna true | false | 'EM_USO' (tipo referenciado por denúncias - FK)
const deleteTipoDenuncia = async function (id) {
    try {
        let sql = `DELETE FROM tbl_tipo_denuncias WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)

        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return 'EM_USO'
        }
        return false
    }
}

module.exports = {
    insertTipoDenuncia,
    updateTipoDenuncia,
    selectByIdTipoDenuncia,
    selectAllTipoDenuncia,
    deleteTipoDenuncia
}