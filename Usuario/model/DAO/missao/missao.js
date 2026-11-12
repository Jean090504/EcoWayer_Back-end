/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_missao no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertMissao = async function (missao) {
    try {
        let sql = `insert into tbl_missao (titulo, descricao, meta, periodo_dias, pontos_bonus, ativo)
                   values (?, ?, ?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            missao.titulo, missao.descricao, missao.meta,
            missao.periodo_dias, missao.pontos_bonus, missao.ativo
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

const updateMissao = async function (missao) {
    try {
        let sql = `update tbl_missao
                      set titulo = ?, descricao = ?, meta = ?,
                          periodo_dias = ?, pontos_bonus = ?, ativo = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            missao.titulo, missao.descricao, missao.meta,
            missao.periodo_dias, missao.pontos_bonus, missao.ativo, missao.id
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

const selectAllMissoes = async function () {
    try {
        let sql = `select * from tbl_missao order by id`
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

const selectMissaoById = async function (id) {
    try {
        let sql = `select * from tbl_missao where id = ?`
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

// Quantos usuários estão participando da missão. Usado antes de excluir.
const countDependenciasMissao = async function (id) {
    try {
        let sql = `select (select count(*) from tbl_usuario_missao where id_missao = ?) as total`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteMissao = async function (id) {
    try {
        let sql = `delete from tbl_missao where id = ?`
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
    insertMissao,
    updateMissao,
    selectAllMissoes,
    selectMissaoById,
    countDependenciasMissao,
    deleteMissao
}