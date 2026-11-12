/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Alertas e Mensagens (sem endpoint, filha de alertas)
 * Local: model/DAO/alertas_mensagens/alertas_mensagens.js
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// tbl_entrega_id é opcional (null quando a mensagem não tem entrega)
const insertAlertaMensagem = async function (relacao) {
    try {
        let sql = `INSERT INTO tbl_alertas_mensagens (id_alertas, id_mensagens, tbl_entrega_id) VALUES (?, ?, ?);`
        let result = await knexConex.raw(sql, [
            relacao.id_alertas,
            relacao.id_mensagens,
            relacao.id_entrega ?? null
        ])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna os ids das mensagens (e da entrega) de um alerta.
// Os dados completos da mensagem vêm do controller de mensagem.
const selectMensagensByIdAlerta = async function (idAlerta) {
    try {
        let sql = `SELECT id_mensagens, tbl_entrega_id FROM tbl_alertas_mensagens WHERE id_alertas = ? ORDER BY id;`
        let result = await knexConex.raw(sql, [idAlerta])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE do alerta: apaga todas as relações dele
// (0 linhas apagadas também é sucesso: o alerta pode não ter mensagens ainda)
const deleteMensagensByIdAlerta = async function (idAlerta) {
    try {
        let sql = `DELETE FROM tbl_alertas_mensagens WHERE id_alertas = ?;`
        let result = await knexConex.raw(sql, [idAlerta])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertAlertaMensagem,
    selectMensagensByIdAlerta,
    deleteMensagensByIdAlerta
}