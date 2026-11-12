/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Mensagens
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const SQL_SELECT_MENSAGEM = `SELECT m.id, m.texto,
        DATE_FORMAT(m.envio, '%Y-%m-%d %H:%i:%s') AS envio,
        m.lida, m.id_conversa, m.id_remetente, u.nome AS remetente
    FROM tbl_mensagens m
    INNER JOIN tbl_usuario u ON u.id = m.id_remetente`

// Grava a mensagem (envio = agora, lida = 0) e cria a notificação "X enviou uma mensagem no chat"
// para a outra pessoa da conversa. Tudo na mesma transação.
const insertMensagem = async function (mensagem) {
    try {
        let idMensagem = await knexConex.transaction(async function (trx) {
            let result = await trx.raw(
                `INSERT INTO tbl_mensagens (texto, envio, lida, id_conversa, id_remetente) VALUES (?, NOW(), 0, ?, ?);`,
                [mensagem.texto, mensagem.id_conversa, mensagem.id_remetente]
            )

            // destinatário = o interessado, se quem enviou é o anunciante; senão, o anunciante
            await trx.raw(
                `INSERT INTO tbl_notificacao (id_usuario, tipo, texto)
                 SELECT IF(c.id_usuario = ?, a.id_usuario, c.id_usuario), 'mensagem', CONCAT(u.nome, ' enviou uma mensagem no chat.')
                 FROM tbl_conversa c
                 INNER JOIN tbl_anuncio a ON a.id = c.id_anuncio
                 INNER JOIN tbl_usuario u ON u.id = ?
                 WHERE c.id = ?;`,
                [mensagem.id_remetente, mensagem.id_remetente, mensagem.id_conversa]
            )

            return result[0].insertId
        })

        return idMensagem ? idMensagem : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Só a leitura pode ser alterada: a mensagem enviada não é editada.
const updateLidaMensagem = async function (mensagem) {
    try {
        let result = await knexConex.raw(`UPDATE tbl_mensagens SET lida = ? WHERE id = ?;`, [mensagem.lida, mensagem.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdMensagem = async function (id) {
    try {
        let result = await knexConex.raw(`${SQL_SELECT_MENSAGEM} WHERE m.id = ?;`, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Mensagens de uma conversa, da mais antiga para a mais nova (ordem de leitura do chat).
const selectAllMensagemByConversa = async function (idConversa) {
    try {
        let sql = `${SQL_SELECT_MENSAGEM} WHERE m.id_conversa = ? ORDER BY m.envio ASC, m.id ASC;`
        let result = await knexConex.raw(sql, [idConversa])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Quem participa da conversa: o interessado e o dono do anúncio.
const selectParticipantesConversa = async function (idConversa) {
    try {
        let sql = `SELECT c.id_usuario AS id_interessado, a.id_usuario AS id_anunciante
                   FROM tbl_conversa c
                   INNER JOIN tbl_anuncio a ON a.id = c.id_anuncio
                   WHERE c.id = ?;`
        let result = await knexConex.raw(sql, [idConversa])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Mensagem citada em denúncia ou alerta não pode ser apagada.
const selectMensagemEmUso = async function (id) {
    try {
        let sql = `SELECT
                       (SELECT COUNT(*) FROM tbl_denuncias_mensagens WHERE id_mensagens = ?) +
                       (SELECT COUNT(*) FROM tbl_alertas_mensagens WHERE id_mensagens = ?) AS total;`
        let result = await knexConex.raw(sql, [id, id])

        if (Array.isArray(result)) {
            return Number(result[0][0].total)
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

const deleteMensagem = async function (id) {
    try {
        let result = await knexConex.raw(`DELETE FROM tbl_mensagens WHERE id = ?;`, [id])

        return result ? true : false
    } catch (error) {
        return false
    }
}

module.exports = {
    insertMensagem,
    updateLidaMensagem,
    selectByIdMensagem,
    selectAllMensagemByConversa,
    selectParticipantesConversa,
    selectMensagemEmUso,
    deleteMensagem
}