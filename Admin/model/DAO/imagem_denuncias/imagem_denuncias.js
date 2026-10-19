/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Imagem e Denúncia (sem endpoint, filha de denúncia)
 * Local: model/DAO/imagem_denuncias/imagem_denuncias.js
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertImagemDenuncia = async function (relacao) {
    try {
        let sql = `INSERT INTO tbl_imagem_denuncias (id_imagem, id_denuncias) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [relacao.id_imagem, relacao.id_denuncias])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna as imagens de uma denúncia (com o tipo da imagem já junto)
const selectImagensByIdDenuncia = async function (idDenuncia) {
    try {
        let sql = `SELECT i.id, i.url, ti.id AS tipo_imagem_id, ti.tipo AS tipo_imagem_tipo
                   FROM tbl_imagem AS i
                   INNER JOIN tbl_imagem_denuncias AS idn ON idn.id_imagem = i.id
                   INNER JOIN tbl_tipo_imagem AS ti ON ti.id = i.id_tipo_imagem
                   WHERE idn.id_denuncias = ?
                   ORDER BY i.id;`
        let result = await knexConex.raw(sql, [idDenuncia])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE da denúncia: apaga todas as relações dela
// (0 linhas apagadas também é sucesso: a denúncia pode não ter imagens ainda)
const deleteImagensByIdDenuncia = async function (idDenuncia) {
    try {
        let sql = `DELETE FROM tbl_imagem_denuncias WHERE id_denuncias = ?;`
        let result = await knexConex.raw(sql, [idDenuncia])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertImagemDenuncia,
    selectImagensByIdDenuncia,
    deleteImagensByIdDenuncia
}