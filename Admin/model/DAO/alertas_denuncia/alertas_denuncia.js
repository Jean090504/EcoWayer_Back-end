/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Alertas e Denúncias (sem endpoint, filha de alertas)
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertAlertaDenuncia = async function (relacao) {
    try {
        let sql = `INSERT INTO tbl_alertas_denuncias (id_alertas, id_denuncias) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [relacao.id_alertas, relacao.id_denuncias])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna só os ids das denúncias do alerta. Os dados completos (denunciante e tipo)
// vêm do controller de denúncia, que já monta esse formato.
const selectIdsDenunciasByIdAlerta = async function (idAlerta) {
    try {
        let sql = `SELECT id_denuncias FROM tbl_alertas_denuncias
                   WHERE id_alertas = ?
                   ORDER BY id_denuncias DESC;`
        let result = await knexConex.raw(sql, [idAlerta])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE do alerta: apaga todas as relações dele
const deleteDenunciasByIdAlerta = async function (idAlerta) {
    try {
        let sql = `DELETE FROM tbl_alertas_denuncias WHERE id_alertas = ?;`
        let result = await knexConex.raw(sql, [idAlerta])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertAlertaDenuncia,
    selectIdsDenunciasByIdAlerta,
    deleteDenunciasByIdAlerta
}