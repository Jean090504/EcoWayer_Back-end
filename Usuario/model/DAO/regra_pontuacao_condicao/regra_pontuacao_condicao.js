/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_regra_pontuacao_condicao no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertRegraCondicao = async function (vinculo) {
    try {
        let sql = `insert into tbl_regra_pontuacao_condicao (id_regra_pontuacao, id_condicao_item, multiplicador)
                   values (?, ?, ?)`
        let result = await knexConex.raw(sql, [
            vinculo.id_regra_pontuacao, vinculo.id_condicao_item, vinculo.multiplicador
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

const updateRegraCondicao = async function (vinculo) {
    try {
        let sql = `update tbl_regra_pontuacao_condicao
                      set id_regra_pontuacao = ?, id_condicao_item = ?, multiplicador = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            vinculo.id_regra_pontuacao, vinculo.id_condicao_item, vinculo.multiplicador, vinculo.id
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

const selectAllRegraCondicoes = async function () {
    try {
        let sql = `select * from tbl_regra_pontuacao_condicao order by id`
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

const selectRegraCondicaoById = async function (id) {
    try {
        let sql = `select * from tbl_regra_pontuacao_condicao where id = ?`
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

// Verifica se o par (regra, condição) já existe, ignorando o próprio registro na atualização
const selectParRegraCondicao = async function (idRegra, idCondicao, idIgnorar = 0) {
    try {
        let sql = `select id from tbl_regra_pontuacao_condicao
                   where id_regra_pontuacao = ? and id_condicao_item = ? and id <> ?`
        let result = await knexConex.raw(sql, [idRegra, idCondicao, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Confere se uma FK existe (tabelas permitidas fixas)
const selectExiste = async function (tabela, id) {
    try {
        const tabelasPermitidas = ['tbl_regra_pontuacao', 'tbl_condicao_item']
        if (!tabelasPermitidas.includes(tabela)) return false

        let result = await knexConex.raw(`select id from ${tabela} where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteRegraCondicao = async function (id) {
    try {
        let sql = `delete from tbl_regra_pontuacao_condicao where id = ?`
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
    insertRegraCondicao,
    updateRegraCondicao,
    selectAllRegraCondicoes,
    selectRegraCondicaoById,
    selectParRegraCondicao,
    selectExiste,
    deleteRegraCondicao
}