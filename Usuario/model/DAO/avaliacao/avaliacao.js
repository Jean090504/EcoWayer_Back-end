/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_avaliacao no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertAvaliacao = async function (avaliacao) {
    try {
        let sql = `insert into tbl_avaliacao (nota, comentario, data_avaliacao, id_entrega, id_usuario)
                   values (?, ?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            avaliacao.nota, avaliacao.comentario, avaliacao.data_avaliacao,
            avaliacao.id_entrega, avaliacao.id_usuario
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

const updateAvaliacao = async function (avaliacao) {
    try {
        let sql = `update tbl_avaliacao
                      set nota = ?, comentario = ?, data_avaliacao = ?,
                          id_entrega = ?, id_usuario = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            avaliacao.nota, avaliacao.comentario, avaliacao.data_avaliacao,
            avaliacao.id_entrega, avaliacao.id_usuario, avaliacao.id
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

const selectAllAvaliacoes = async function () {
    try {
        let sql = `select * from tbl_avaliacao order by id`
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

const selectAvaliacaoById = async function (id) {
    try {
        let sql = `select * from tbl_avaliacao where id = ?`
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

// Verifica se o usuário já avaliou esta entrega (ignora o próprio registro na atualização)
const selectParAvaliacao = async function (idEntrega, idUsuario, idIgnorar = 0) {
    try {
        let sql = `select id from tbl_avaliacao
                   where id_entrega = ? and id_usuario = ? and id <> ?`
        let result = await knexConex.raw(sql, [idEntrega, idUsuario, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectExiste = async function (tabela, id) {
    try {
        const tabelasPermitidas = ['tbl_entrega', 'tbl_usuario']
        if (!tabelasPermitidas.includes(tabela)) return false

        let result = await knexConex.raw(`select id from ${tabela} where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertAvaliacao,
    updateAvaliacao,
    selectAllAvaliacoes,
    selectAvaliacaoById,
    selectParAvaliacao,
    selectExiste
}