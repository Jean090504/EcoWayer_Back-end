/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Imagem e Anúncio (sem endpoint, filha de anúncio)
 * Local: model/DAO/imagem_anuncio/imagem_anuncio.js
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertImagemAnuncio = async function (relacao) {
    try {
        let sql = `INSERT INTO tbl_imagem_anuncio (id_imagem, id_anuncio) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [relacao.id_imagem, relacao.id_anuncio])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna as imagens de um anúncio (com o tipo da imagem já junto)
const selectImagensByIdAnuncio = async function (idAnuncio) {
    try {
        let sql = `SELECT i.id, i.url, ti.id AS tipo_imagem_id, ti.tipo AS tipo_imagem_tipo
                   FROM tbl_imagem AS i
                   INNER JOIN tbl_imagem_anuncio AS ia ON ia.id_imagem = i.id
                   INNER JOIN tbl_tipo_imagem AS ti ON ti.id = i.id_tipo_imagem
                   WHERE ia.id_anuncio = ?
                   ORDER BY ia.id;`
        let result = await knexConex.raw(sql, [idAnuncio])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE do anúncio: apaga todas as relações dele
// (0 linhas apagadas também é sucesso: o anúncio pode não ter imagens ainda)
const deleteImagensByIdAnuncio = async function (idAnuncio) {
    try {
        let sql = `DELETE FROM tbl_imagem_anuncio WHERE id_anuncio = ?;`
        let result = await knexConex.raw(sql, [idAnuncio])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertImagemAnuncio,
    selectImagensByIdAnuncio,
    deleteImagensByIdAnuncio
}