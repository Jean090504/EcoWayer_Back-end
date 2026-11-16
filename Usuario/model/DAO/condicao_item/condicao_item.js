/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_condicao_item no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertCondicaoItem = async function (condicao) {
    try {
        let result = await knexConex.raw(`insert into tbl_condicao_item (nome) values (?)`, [condicao.nome])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateCondicaoItem = async function (condicao) {
    try {
        let result = await knexConex.raw(`update tbl_condicao_item set nome = ? where id = ?`, [condicao.nome, condicao.id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllCondicoesItem = async function () {
    try {
        let result = await knexConex.raw(`select id, nome from tbl_condicao_item order by id`)

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectCondicaoItemById = async function (id) {
    try {
        let result = await knexConex.raw(`select id, nome from tbl_condicao_item where id = ?`, [id])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Verifica se o nome já existe em outra condição (ignora o próprio na atualização)
const selectCondicaoPorNome = async function (nome, idIgnorar = 0) {
    try {
        let result = await knexConex.raw(`select id from tbl_condicao_item where nome = ? and id <> ?`, [nome, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Quantos registros usam a condição (multiplicadores e anúncios). Usado antes de excluir.
const countDependenciasCondicao = async function (id) {
    try {
        let sql = `select
                       (select count(*) from tbl_regra_pontuacao_condicao where id_condicao_item = ?) +
                       (select count(*) from tbl_anuncio where id_condicao_item = ?) as total`
        let result = await knexConex.raw(sql, [id, id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteCondicaoItem = async function (id) {
    try {
        let result = await knexConex.raw(`delete from tbl_condicao_item where id = ?`, [id])

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
    insertCondicaoItem,
    updateCondicaoItem,
    selectAllCondicoesItem,
    selectCondicaoItemById,
    selectCondicaoPorNome,
    countDependenciasCondicao,
    deleteCondicaoItem
}