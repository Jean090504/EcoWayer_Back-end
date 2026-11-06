/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Regra de Pontuação e Condição Item (sem endpoint, filha de regra_pontuacao)
 * Local: model/DAO/regra_pontuacao_condicao/regra_pontuacao_condicao.js
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertRegraPontuacaoCondicao = async function (relacao, trx = knexConex) {
    try {
        let sql = `INSERT INTO tbl_regra_pontuacao_condicao (id_regra_pontuacao, id_condicao_item, multiplicador)
                   VALUES (?, ?, ?);`
        let result = await trx.raw(sql, [
            relacao.id_regra_pontuacao,
            relacao.id_condicao_item,
            relacao.multiplicador
        ])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna id_condicao_item e multiplicador de uma regra (os dados completos da condição vêm do controller de condição item)
// OBS: o mysql devolve DECIMAL como string (ex: "1.50"), o controller converte para número
const selectCondicoesByIdRegra = async function (idRegra) {
    try {
        let sql = `SELECT id_condicao_item, multiplicador
                   FROM tbl_regra_pontuacao_condicao
                   WHERE id_regra_pontuacao = ? ORDER BY id;`
        let result = await knexConex.raw(sql, [idRegra])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE da regra: apaga todas as relações dela
// (0 linhas apagadas também é sucesso: a regra pode não ter condições ainda)
const deleteCondicoesByIdRegra = async function (idRegra, trx = knexConex) {
    try {
        let result = await trx.raw(
            `DELETE FROM tbl_regra_pontuacao_condicao WHERE id_regra_pontuacao = ?;`, [idRegra])
        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateRegraPontuacaoCompleta = async function (id, regra, condicoes) {
    try {
        await knexConex.transaction(async (trx) => {
            // update da regra aqui, usando trx.raw(...)
            await deleteCondicoesByIdRegra(id, trx)
            for (const c of condicoes) {
                const ok = await insertRegraPontuacaoCondicao(
                    { id_regra_pontuacao: id, id_condicao_item: c.id, multiplicador: c.multiplicador }, trx)
                if (!ok) throw new Error('Falha ao inserir condição')
            }
        })
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertRegraPontuacaoCondicao,
    selectCondicoesByIdRegra,
    deleteCondicoesByIdRegra
}