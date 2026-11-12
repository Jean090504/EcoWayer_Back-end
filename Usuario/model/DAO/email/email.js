/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_email no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/



const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const countDependenciasEmail = async function (id) {
    try {
        let sql = `select
                       (select count(*) from tbl_conta where id_email = ?) +
                       (select count(*) from tbl_email_verificacao where id_email = ?) as total`
        let result = await knexConex.raw(sql, [id, id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateEmail = async function (email) {
    try {
        let sql = `update tbl_email
                      set email = ?,
                          codigo_verificacao = ?,
                          id_usuario = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [email.email, email.codigo_verificacao, email.id_usuario, email.id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllEmails = async function () {
    try {
        let sql = `select id, email, codigo_verificacao, id_usuario from tbl_email order by id`
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

const selectEmailById = async function (id) {
    try {
        let sql = `select id, email, codigo_verificacao, id_usuario from tbl_email where id = ?`
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

const deleteEmail = async function (id) {
    try {
        let sql = `delete from tbl_email where id = ?`
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
    countDependenciasEmail,
    updateEmail,
    selectAllEmails,
    selectEmailById,
    deleteEmail
}