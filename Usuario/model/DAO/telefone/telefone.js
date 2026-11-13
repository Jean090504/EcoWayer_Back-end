/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_telefone no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const updateTelefone = async function (telefone) {
    try {
        let sql = `update tbl_telefone
                      set numero = ?,
                          codigo_verificacao = ?,
                          id_usuario = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [telefone.numero, telefone.codigo_verificacao, telefone.id_usuario, telefone.id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllTelefones = async function () {
    try {
        let sql = `select id, numero, codigo_verificacao, id_usuario from tbl_telefone order by id`
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

const selectTelefoneById = async function (id) {
    try {
        let sql = `select id, numero, codigo_verificacao, id_usuario from tbl_telefone where id = ?`
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

// Quantos registros dependem do telefone (verificação e outras tabelas). Usado antes de excluir.
const countDependenciasTelefone = async function (id) {
    try {
        let sql = `select
                       (select count(*) from tbl_telefone_verificacao where id_telefone = ?) as total`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteTelefone = async function (id) {
    try {
        let sql = `delete from tbl_telefone where id = ?`
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
    updateTelefone,
    selectAllTelefones,
    selectTelefoneById,
    countDependenciasTelefone,
    deleteTelefone
}