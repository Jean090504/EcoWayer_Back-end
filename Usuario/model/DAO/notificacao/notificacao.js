/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Notificação
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const SQL_SELECT_NOTIFICACAO = `SELECT n.id, n.id_usuario, n.tipo, n.texto, n.lida,
        DATE_FORMAT(n.data_criacao, '%Y-%m-%d %H:%i:%s') AS data_criacao
    FROM tbl_notificacao n`

// lida = 0 e data_criacao = agora (padrões da tabela)
const insertNotificacao = async function (notificacao) {
    try {
        let sql = `INSERT INTO tbl_notificacao (id_usuario, tipo, texto) VALUES (?, ?, ?);`
        let result = await knexConex.raw(sql, [notificacao.id_usuario, notificacao.tipo, notificacao.texto])

        // devolve o id gerado (result[0] é o ResultSetHeader do MySQL)
        return result ? result[0].insertId : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Só a leitura pode ser alterada: o texto da notificação não é editado.
const updateLidaNotificacao = async function (notificacao) {
    try {
        let result = await knexConex.raw(`UPDATE tbl_notificacao SET lida = ? WHERE id = ?;`, [notificacao.lida, notificacao.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdNotificacao = async function (id) {
    try {
        let result = await knexConex.raw(`${SQL_SELECT_NOTIFICACAO} WHERE n.id = ?;`, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Notificações de um usuário, da mais recente para a mais antiga.
// apenasNaoLidas = true traz só as que ainda não foram lidas.
const selectAllNotificacaoByUsuario = async function (idUsuario, apenasNaoLidas) {
    try {
        let sql = `${SQL_SELECT_NOTIFICACAO} WHERE n.id_usuario = ?`

        if (apenasNaoLidas) {
            sql += ` AND n.lida = 0`
        }

        sql += ` ORDER BY n.data_criacao DESC, n.id DESC;`

        let result = await knexConex.raw(sql, [idUsuario])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Confere se o usuário existe (checagem direta na tabela, sem depender de outro controller)
const selectUsuarioExiste = async function (id) {
    try {
        let result = await knexConex.raw(`select id from tbl_usuario where id = ?`, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteNotificacao = async function (id) {
    try {
        let result = await knexConex.raw(`DELETE FROM tbl_notificacao WHERE id = ?;`, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertNotificacao,
    updateLidaNotificacao,
    selectByIdNotificacao,
    selectAllNotificacaoByUsuario,
    selectUsuarioExiste,
    deleteNotificacao
}