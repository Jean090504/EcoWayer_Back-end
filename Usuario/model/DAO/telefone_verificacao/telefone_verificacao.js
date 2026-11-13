/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_telefone_verificacao no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertTelefoneVerificacao = async function (vinculo) {
    try {
        let sql = `insert into tbl_telefone_verificacao (id_telefone, id_verificacao) values (?, ?)`
        let result = await knexConex.raw(sql, [vinculo.id_telefone, vinculo.id_verificacao])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateTelefoneVerificacao = async function (vinculo) {
    try {
        let sql = `update tbl_telefone_verificacao
                      set id_telefone = ?,
                          id_verificacao = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [vinculo.id_telefone, vinculo.id_verificacao, vinculo.id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllTelefoneVerificacoes = async function () {
    try {
        let sql = `select * from tbl_telefone_verificacao order by id`
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

const selectTelefoneVerificacaoById = async function (id) {
    try {
        let sql = `select * from tbl_telefone_verificacao where id = ?`
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

// Verifica se o par (telefone, verificação) já existe, ignorando o próprio registro na atualização
const selectParTelefoneVerificacao = async function (idTelefone, idVerificacao, idIgnorar = 0) {
    try {
        let sql = `select id from tbl_telefone_verificacao
                   where id_telefone = ? and id_verificacao = ? and id <> ?`
        let result = await knexConex.raw(sql, [idTelefone, idVerificacao, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteTelefoneVerificacao = async function (id) {
    try {
        let sql = `delete from tbl_telefone_verificacao where id = ?`
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
    insertTelefoneVerificacao,
    updateTelefoneVerificacao,
    selectAllTelefoneVerificacoes,
    selectTelefoneVerificacaoById,
    selectParTelefoneVerificacao,
    deleteTelefoneVerificacao
}