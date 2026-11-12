/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Ponto de Coleta e Material Aceito (sem endpoint, filha de ponto de coleta)
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertMaterialAceitoPontoColeta = async function (relacao) {
    try {
        let sql = `INSERT INTO tbl_ponto_coleta_material_aceito (id_ponto_coleta, id_material_aceito) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [relacao.id_ponto_coleta, relacao.id_material_aceito])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna os materiais aceitos de um ponto de coleta (mesmas colunas do selectByIdMaterialAceito)
const selectMateriaisByIdPontoColeta = async function (idPontoColeta) {
    try {
        let sql = `SELECT m.id, m.nome, m.icone
                   FROM tbl_material_aceito AS m
                   INNER JOIN tbl_ponto_coleta_material_aceito AS pm ON pm.id_material_aceito = m.id
                   WHERE pm.id_ponto_coleta = ?
                   ORDER BY m.id;`
        let result = await knexConex.raw(sql, [idPontoColeta])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE do ponto de coleta: apaga todas as relações dele
// (0 linhas apagadas também é sucesso: o ponto pode não ter materiais ainda)
const deleteMateriaisByIdPontoColeta = async function (idPontoColeta) {
    try {
        let sql = `DELETE FROM tbl_ponto_coleta_material_aceito WHERE id_ponto_coleta = ?;`
        let result = await knexConex.raw(sql, [idPontoColeta])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertMaterialAceitoPontoColeta,
    selectMateriaisByIdPontoColeta,
    deleteMateriaisByIdPontoColeta
}