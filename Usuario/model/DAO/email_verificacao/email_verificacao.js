/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_email_verificacao no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertEmailVerificacao = async function (vinculo) {
    try {
        let sql = `insert into tbl_email_verificacao (id_email, id_verificacao) values (?, ?)`
        let result = await knexConex.raw(sql, [vinculo.id_email, vinculo.id_verificacao])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateEmailVerificacao = async function (vinculo) {
    try {
        let sql = `update tbl_email_verificacao
                      set id_email = ?,
                          id_verificacao = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [vinculo.id_email, vinculo.id_verificacao, vinculo.id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllEmailVerificacoes = async function () {
    try {
        let sql = `select * from tbl_email_verificacao order by id`
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

const selectEmailVerificacaoById = async function (id) {
    try {
        let sql = `select * from tbl_email_verificacao where id = ?`
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

// Verifica se o par (e-mail, verificação) já existe, ignorando o próprio registro na atualização
const selectParEmailVerificacao = async function (idEmail, idVerificacao, idIgnorar = 0) {
    try {
        let sql = `select id from tbl_email_verificacao
                   where id_email = ? and id_verificacao = ? and id <> ?`
        let result = await knexConex.raw(sql, [idEmail, idVerificacao, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteEmailVerificacao = async function (id) {
    try {
        let sql = `delete from tbl_email_verificacao where id = ?`
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
    insertEmailVerificacao,
    updateEmailVerificacao,
    selectAllEmailVerificacoes,
    selectEmailVerificacaoById,
    selectParEmailVerificacao,
    deleteEmailVerificacao
}