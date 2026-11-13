/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_usuario_missao no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertUsuarioMissao = async function (vinculo) {
    try {
        let sql = `insert into tbl_usuario_missao (id_usuario, id_missao, progresso, status, data_inicio, data_fim)
                   values (?, ?, ?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            vinculo.id_usuario, vinculo.id_missao, vinculo.progresso,
            vinculo.status, vinculo.data_inicio, vinculo.data_fim
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

const updateUsuarioMissao = async function (vinculo) {
    try {
        let sql = `update tbl_usuario_missao
                      set id_usuario = ?, id_missao = ?, progresso = ?,
                          status = ?, data_inicio = ?, data_fim = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            vinculo.id_usuario, vinculo.id_missao, vinculo.progresso,
            vinculo.status, vinculo.data_inicio, vinculo.data_fim, vinculo.id
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

const selectAllUsuarioMissoes = async function () {
    try {
        let sql = `select * from tbl_usuario_missao order by id`
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

const selectUsuarioMissaoById = async function (id) {
    try {
        let sql = `select * from tbl_usuario_missao where id = ?`
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

// Verifica se o par (usuário, missão) já existe, ignorando o próprio registro na atualização
const selectParUsuarioMissao = async function (idUsuario, idMissao, idIgnorar = 0) {
    try {
        let sql = `select id from tbl_usuario_missao
                   where id_usuario = ? and id_missao = ? and id <> ?`
        let result = await knexConex.raw(sql, [idUsuario, idMissao, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectUsuarioExiste = async function (id) {
    try {
        let result = await knexConex.raw(`select id from tbl_usuario where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectMissaoExiste = async function (id) {
    try {
        let result = await knexConex.raw(`select id from tbl_missao where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteUsuarioMissao = async function (id) {
    try {
        let sql = `delete from tbl_usuario_missao where id = ?`
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
    insertUsuarioMissao,
    updateUsuarioMissao,
    selectAllUsuarioMissoes,
    selectUsuarioMissaoById,
    selectParUsuarioMissao,
    selectUsuarioExiste,
    selectMissaoExiste,
    deleteUsuarioMissao
}