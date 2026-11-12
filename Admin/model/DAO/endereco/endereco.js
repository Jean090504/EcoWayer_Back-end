/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Endereco
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertEndereco = async function (endereco) {
    try {
        let sql = `INSERT INTO tbl_endereco (cep, rua, numero, complemento, bairro, cidade, estado, sigla, id_externo)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            endereco.cep,
            endereco.rua,
            endereco.numero,
            endereco.complemento,
            endereco.bairro,
            endereco.cidade,
            endereco.estado,
            endereco.sigla,
            endereco.id_externo
        ])

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

const updateEndereco = async function (endereco) {
    try {
        let sql = `UPDATE tbl_endereco SET
                       cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?,
                       cidade = ?, estado = ?, sigla = ?, id_externo = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            endereco.cep,
            endereco.rua,
            endereco.numero,
            endereco.complemento,
            endereco.bairro,
            endereco.cidade,
            endereco.estado,
            endereco.sigla,
            endereco.id_externo,
            endereco.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdEndereco = async function (id) {
    try {
        let sql = `SELECT id, cep, rua, numero, complemento, bairro, cidade, estado, sigla, id_externo
                   FROM tbl_endereco WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllEndereco = async function () {
    try {
        let sql = `SELECT id, cep, rua, numero, complemento, bairro, cidade, estado, sigla, id_externo
                   FROM tbl_endereco ORDER BY id;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deleteEndereco = async function (id) {
    try {
        let sql = `DELETE FROM tbl_endereco WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertEndereco,
    updateEndereco,
    selectByIdEndereco,
    selectAllEndereco,
    deleteEndereco
}