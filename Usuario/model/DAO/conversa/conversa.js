/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Conversa
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// tbl_conversa.id_usuario = o interessado (comprador). O anunciante vem do anúncio (tbl_anuncio.id_usuario).
const SQL_SELECT_CONVERSA = `SELECT c.id, c.id_anuncio, a.nome AS anuncio,
        c.id_usuario AS id_interessado, ui.nome AS interessado,
        a.id_usuario AS id_anunciante, ua.nome AS anunciante,
        (SELECT m.texto FROM tbl_mensagens m WHERE m.id_conversa = c.id ORDER BY m.envio DESC, m.id DESC LIMIT 1) AS ultima_mensagem,
        (SELECT DATE_FORMAT(m.envio, '%Y-%m-%d %H:%i:%s') FROM tbl_mensagens m WHERE m.id_conversa = c.id ORDER BY m.envio DESC, m.id DESC LIMIT 1) AS ultimo_envio`

const SQL_FROM_CONVERSA = ` FROM tbl_conversa c
    INNER JOIN tbl_anuncio a ON a.id = c.id_anuncio
    INNER JOIN tbl_usuario ui ON ui.id = c.id_usuario
    INNER JOIN tbl_usuario ua ON ua.id = a.id_usuario`

const insertConversa = async function (conversa) {
    try {
        let sql = `INSERT INTO tbl_conversa (id_anuncio, id_usuario) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [conversa.id_anuncio, conversa.id_usuario])

        // devolve o id gerado (result[0] é o ResultSetHeader do MySQL)
        return result ? result[0].insertId : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdConversa = async function (id) {
    try {
        let sql = `${SQL_SELECT_CONVERSA}${SQL_FROM_CONVERSA} WHERE c.id = ?;`
        let result = await knexConex.raw(sql, [id])

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

// Sem idUsuario: todas as conversas. Com idUsuario: só as do usuário (como interessado ou anunciante),
// com a quantidade de mensagens não lidas (enviadas pela outra pessoa) e a mais recente primeiro.
const selectAllConversa = async function (idUsuario) {
    try {
        let sql
        let result

        if (idUsuario) {
            sql = `${SQL_SELECT_CONVERSA},
                   (SELECT COUNT(*) FROM tbl_mensagens m WHERE m.id_conversa = c.id AND m.lida = 0 AND m.id_remetente <> ?) AS nao_lidas
                   ${SQL_FROM_CONVERSA}
                   WHERE c.id_usuario = ? OR a.id_usuario = ?
                   ORDER BY ultimo_envio DESC, c.id DESC;`
            result = await knexConex.raw(sql, [idUsuario, idUsuario, idUsuario])
        } else {
            sql = `${SQL_SELECT_CONVERSA}${SQL_FROM_CONVERSA} ORDER BY c.id DESC;`
            result = await knexConex.raw(sql)
        }

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

// Dados do anúncio necessários para abrir uma conversa (dono e status)
const selectAnuncioParaConversa = async function (idAnuncio) {
    try {
        let result = await knexConex.raw(`SELECT id, id_usuario, status FROM tbl_anuncio WHERE id = ?;`, [idAnuncio])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Devolve 0, 1 ou false (erro)
const selectExisteUsuario = async function (idUsuario) {
    try {
        let result = await knexConex.raw(`SELECT COUNT(*) AS total FROM tbl_usuario WHERE id = ?;`, [idUsuario])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        return false
    }
}

// Já existe conversa deste interessado neste anúncio?
const selectConversaExistente = async function (idAnuncio, idUsuario) {
    try {
        let result = await knexConex.raw(`SELECT id FROM tbl_conversa WHERE id_anuncio = ? AND id_usuario = ?;`, [idAnuncio, idUsuario])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Quantos registros dependem da conversa (mensagens + propostas). Usado antes de excluir.
const selectConversaEmUso = async function (id) {
    try {
        let sql = `SELECT
                       (SELECT COUNT(*) FROM tbl_mensagens WHERE id_conversa = ?) +
                       (SELECT COUNT(*) FROM tbl_negociacao WHERE id_conversa = ?) AS total;`
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

const deleteConversa = async function (id) {
    try {
        let result = await knexConex.raw(`DELETE FROM tbl_conversa WHERE id = ?;`, [id])

        return result ? true : false
    } catch (error) {
        return false
    }
}

module.exports = {
    insertConversa,
    selectByIdConversa,
    selectAllConversa,
    selectAnuncioParaConversa,
    selectExisteUsuario,
    selectConversaExistente,
    selectConversaEmUso,
    deleteConversa
}