/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Administrador
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertAdministrador = async function (administrador) {
    try {
        let sql = `INSERT INTO tbl_administrador (nome, email, senha) VALUES (?, ?, ?);`
        let result = await knexConex.raw(sql, [administrador.nome, administrador.email, administrador.senha])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateAdministrador = async function (administrador) {
    try {
        let sql = `UPDATE tbl_administrador SET nome = ?, email = ?, senha = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [administrador.nome, administrador.email, administrador.senha, administrador.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdAdministrador = async function (id) {
    try {
        let sql = `SELECT id, nome, email FROM tbl_administrador WHERE id = ?;`
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

const selectAllAdministrador = async function () {
    try {
        let sql = `SELECT id, nome, email FROM tbl_administrador;`
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

const deleteAdministrador = async function (id) {
    try {
        let sql = `DELETE FROM tbl_administrador WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        return false
    }
}

module.exports = {
    insertAdministrador,
    updateAdministrador,
    selectByIdAdministrador,
    selectAllAdministrador,
    deleteAdministrador
}