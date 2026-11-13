/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_historico_anuncio no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertHistoricoAnuncio = async function (historico) {
    try {
        let sql = `insert into tbl_historico_anuncio (status, data_alteracao, detalhes, id_anuncio)
                   values (?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            historico.status, historico.data_alteracao, historico.detalhes, historico.id_anuncio
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

const updateHistoricoAnuncio = async function (historico) {
    try {
        let sql = `update tbl_historico_anuncio
                      set status = ?, data_alteracao = ?, detalhes = ?, id_anuncio = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            historico.status, historico.data_alteracao, historico.detalhes,
            historico.id_anuncio, historico.id
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

const selectAllHistoricoAnuncio = async function () {
    try {
        let sql = `select * from tbl_historico_anuncio order by id`
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

const selectHistoricoAnuncioById = async function (id) {
    try {
        let sql = `select * from tbl_historico_anuncio where id = ?`
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

// Confere se o anúncio existe
const selectAnuncioExiste = async function (id) {
    try {
        let result = await knexConex.raw(`select id from tbl_anuncio where id = ?`, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertHistoricoAnuncio,
    updateHistoricoAnuncio,
    selectAllHistoricoAnuncio,
    selectHistoricoAnuncioById,
    selectAnuncioExiste
}