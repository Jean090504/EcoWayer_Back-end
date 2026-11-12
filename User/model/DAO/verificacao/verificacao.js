/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_verificacao no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertVerificacao = async function (verificacao) {
    try {
        let sql = `insert into tbl_verificacao (tentativas, tempo, reenvio, bloqueio, ultimo_reenvio)
                   values (?, ?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            verificacao.tentativas,
            verificacao.tempo,
            verificacao.reenvio,
            verificacao.bloqueio,
            verificacao.ultimo_reenvio
        ])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateVerificacao = async function (verificacao) {
    try {
        let sql = `update tbl_verificacao
                      set tentativas = ?,
                          tempo = ?,
                          reenvio = ?,
                          bloqueio = ?,
                          ultimo_reenvio = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            verificacao.tentativas,
            verificacao.tempo,
            verificacao.reenvio,
            verificacao.bloqueio,
            verificacao.ultimo_reenvio,
            verificacao.id
        ])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllVerificacoes = async function () {
    try {
        let sql = `select * from tbl_verificacao order by id`
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

const selectVerificacaoById = async function (id) {
    try {
        let sql = `select * from tbl_verificacao where id = ?`
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

// Quantos registros de e-mail e telefone apontam para a verificação. Usado antes de excluir.
const countDependenciasVerificacao = async function (id) {
    try {
        let sql = `select
                       (select count(*) from tbl_email_verificacao where id_verificacao = ?) +
                       (select count(*) from tbl_telefone_verificacao where id_verificacao = ?) as total`
        let result = await knexConex.raw(sql, [id, id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteVerificacao = async function (id) {
    try {
        let sql = `delete from tbl_verificacao where id = ?`
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
    insertVerificacao,
    updateVerificacao,
    selectAllVerificacoes,
    selectVerificacaoById,
    countDependenciasVerificacao,
    deleteVerificacao
}