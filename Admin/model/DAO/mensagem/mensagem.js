/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Mensagens
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// envio e lida são opcionais: sem valor, o banco grava a data/hora atual e lida = 0
const insertMensagem = async function (mensagem) {
    try {
        let sql = `INSERT INTO tbl_mensagens (texto, envio, lida, id_conversa, id_remetente)
                   VALUES (?, COALESCE(?, NOW()), COALESCE(?, 0), ?, ?);`
        let result = await knexConex.raw(sql, [
            mensagem.texto,
            mensagem.envio,
            mensagem.lida,
            mensagem.id_conversa,
            mensagem.id_remetente
        ])

        if (Array.isArray(result) && result[0].insertId) {
            return result[0].insertId
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

// envio e lida não enviados no PUT mantêm o valor que já estava gravado
const updateMensagem = async function (mensagem) {
    try {
        let sql = `UPDATE tbl_mensagens SET
                       texto = ?, envio = COALESCE(?, envio), lida = COALESCE(?, lida),
                       id_conversa = ?, id_remetente = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            mensagem.texto,
            mensagem.envio,
            mensagem.lida,
            mensagem.id_conversa,
            mensagem.id_remetente,
            mensagem.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Os selects trazem os id_... só para o controller consultar as tabelas relacionadas.
// O controller remove esses campos antes de responder.
// DATE_FORMAT evita que o envio volte como "2026-10-19T11:30:00.000Z" (problema de fuso).
const selectByIdMensagem = async function (id) {
    try {
        let sql = `SELECT id, texto,
                          DATE_FORMAT(envio, '%Y-%m-%d %H:%i:%s') AS envio,
                          lida, id_conversa, id_remetente
                   FROM tbl_mensagens WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllMensagem = async function () {
    try {
        let sql = `SELECT id, texto,
                          DATE_FORMAT(envio, '%Y-%m-%d %H:%i:%s') AS envio,
                          lida, id_conversa, id_remetente
                   FROM tbl_mensagens ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deleteMensagem = async function (id) {
    try {
        let sql = `DELETE FROM tbl_mensagens WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)

        // 1451 = existe registro de outra tabela apontando para esta mensagem
        if (error.errno == 1451) {
            return 'EM_USO'
        }

        return false
    }
}

module.exports = {
    insertMensagem,
    updateMensagem,
    selectByIdMensagem,
    selectAllMensagem,
    deleteMensagem
}