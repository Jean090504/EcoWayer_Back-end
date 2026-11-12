/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_status_usuario no banco de dados
 *  Autor: Maxw
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertStatusUsuario = async function (statusUsuario) {
    try {
        let sql = `insert into tbl_status_usuario (status) values (?)`
        let result = await knexConex.raw(sql, [statusUsuario.status])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateStatusUsuario = async function (statusUsuario) {
    try {
        let sql = `update tbl_status_usuario set status = ? where id = ?`
        let result = await knexConex.raw(sql, [statusUsuario.status, statusUsuario.id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllStatusUsuarios = async function () {
    try {
        let sql = `select * from tbl_status_usuario order by id`
        let result = await knexConex.raw(sql)

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectStatusUsuarioById = async function (id) {
    try {
        let sql = `select * from tbl_status_usuario where id = ?`
        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteStatusUsuario = async function (id) {
    try {
        let sql = `delete from tbl_status_usuario where id = ?`
        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertStatusUsuario,
    updateStatusUsuario,
    selectAllStatusUsuarios,
    selectStatusUsuarioById,
    deleteStatusUsuario
}