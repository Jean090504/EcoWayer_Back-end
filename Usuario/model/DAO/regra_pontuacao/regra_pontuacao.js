/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_regra_pontuacao no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertRegraPontuacao = async function (regra) {
    try {
        let sql = `insert into tbl_regra_pontuacao (id_categoria, bonus_campanha_percentual, bonus_campanha_ativo, status)
                   values (?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            regra.id_categoria, regra.bonus_campanha_percentual,
            regra.bonus_campanha_ativo, regra.status
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

const updateRegraPontuacao = async function (regra) {
    try {
        let sql = `update tbl_regra_pontuacao
                      set id_categoria = ?, bonus_campanha_percentual = ?,
                          bonus_campanha_ativo = ?, status = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            regra.id_categoria, regra.bonus_campanha_percentual,
            regra.bonus_campanha_ativo, regra.status, regra.id
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

const selectAllRegrasPontuacao = async function () {
    try {
        let sql = `select * from tbl_regra_pontuacao order by id`
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

const selectRegraPontuacaoById = async function (id) {
    try {
        let sql = `select * from tbl_regra_pontuacao where id = ?`
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

// Verifica se a categoria já tem regra (ignora o próprio registro na atualização)
const selectRegraPorCategoria = async function (idCategoria, idIgnorar = 0) {
    try {
        let sql = `select id from tbl_regra_pontuacao where id_categoria = ? and id <> ?`
        let result = await knexConex.raw(sql, [idCategoria, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectCategoriaExiste = async function (id) {
    try {
        let result = await knexConex.raw(`select id from tbl_categoria where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Quantos registros dependem da regra (multiplicadores e histórico de pontos). Usado antes de excluir.
const countDependenciasRegra = async function (id) {
    try {
        let sql = `select
                       (select count(*) from tbl_regra_pontuacao_condicao where id_regra_pontuacao = ?) +
                       (select count(*) from tbl_pontos where id_regra_pontuacao = ?) as total`
        let result = await knexConex.raw(sql, [id, id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteRegraPontuacao = async function (id) {
    try {
        let sql = `delete from tbl_regra_pontuacao where id = ?`
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
    insertRegraPontuacao,
    updateRegraPontuacao,
    selectAllRegrasPontuacao,
    selectRegraPontuacaoById,
    selectRegraPorCategoria,
    selectCategoriaExiste,
    countDependenciasRegra,
    deleteRegraPontuacao
}