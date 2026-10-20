/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Alertas e Anúncio (sem endpoint, filha de alertas)
 * Local: model/DAO/alertas_anuncio/alertas_anuncio.js
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertAlertaAnuncio = async function (relacao) {
    try {
        let sql = `INSERT INTO tbl_alertas_anuncio (id_alerta, id_anuncio) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [relacao.id_alertas, relacao.id_anuncio])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna só os ids dos anúncios de um alerta (os dados completos vêm do controller de anúncio)
const selectAnunciosByIdAlerta = async function (idAlerta) {
    try {
        let sql = `SELECT id_anuncio FROM tbl_alertas_anuncio WHERE id_alerta = ? ORDER BY id;`
        let result = await knexConex.raw(sql, [idAlerta])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE do alerta: apaga todas as relações dele
// (0 linhas apagadas também é sucesso: o alerta pode não ter anúncios ainda)
const deleteAnunciosByIdAlerta = async function (idAlerta) {
    try {
        let sql = `DELETE FROM tbl_alertas_anuncio WHERE id_alerta = ?;`
        let result = await knexConex.raw(sql, [idAlerta])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertAlertaAnuncio,
    selectAnunciosByIdAlerta,
    deleteAnunciosByIdAlerta
}