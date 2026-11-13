/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_conta no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const updateConta = async function (conta) {
    try {
        let sql = `update tbl_conta
                      set senha = ?,
                          id_email = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [conta.senha, conta.id_email, conta.id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllContas = async function () {
    try {
        let sql = `select id, id_email from tbl_conta order by id`
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

const selectContaById = async function (id) {
    try {
        let sql = `select id, id_email from tbl_conta where id = ?`
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

const deleteConta = async function (id) {
    try {
        let sql = `delete from tbl_conta where id = ?`
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
    updateConta,
    selectAllContas,
    selectContaById,
    deleteConta
}