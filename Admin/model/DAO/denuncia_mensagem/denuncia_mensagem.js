/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Denúncia e Mensagens (sem endpoint, filha de denúncia)
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertDenunciaMensagem = async function (relacao) {
    try {
        let sql = `INSERT INTO tbl_denuncias_mensagens (id_denuncias, id_mensagens) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [relacao.id_denuncias, relacao.id_mensagens])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna as mensagens de uma denúncia, já com o nome do remetente (JOIN com o usuário)
const selectMensagensByIdDenuncia = async function (idDenuncia) {
    try {
        let sql = `SELECT m.id, m.texto,
                          DATE_FORMAT(m.envio, '%Y-%m-%d %H:%i:%s') AS envio,
                          m.lida,
                          u.id AS remetente_id, u.nome AS remetente_nome
                   FROM tbl_mensagens AS m
                   INNER JOIN tbl_denuncias_mensagens AS dm ON dm.id_mensagens = m.id
                   INNER JOIN tbl_usuario AS u ON u.id = m.id_remetente
                   WHERE dm.id_denuncias = ?
                   ORDER BY m.id DESC;`
        let result = await knexConex.raw(sql, [idDenuncia])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE da denúncia: apaga todas as relações dela
const deleteMensagensByIdDenuncia = async function (idDenuncia) {
    try {
        let sql = `DELETE FROM tbl_denuncias_mensagens WHERE id_denuncias = ?;`
        let result = await knexConex.raw(sql, [idDenuncia])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertDenunciaMensagem,
    selectMensagensByIdDenuncia,
    deleteMensagensByIdDenuncia
}