/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de relação
 *           entre Imagem e Entrega (sem endpoint, filha de entrega)
 * Autor : [SEU NOME]
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertImagemEntrega = async function (relacao) {
    try {
        let sql = `INSERT INTO tbl_imagem_entrega (id_imagem, id_entrega) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [relacao.id_imagem, relacao.id_entrega])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna as imagens de uma entrega (mesmas colunas do selectByIdImagem)
const selectImagensByIdEntrega = async function (idEntrega) {
    try {
        let sql = `SELECT i.id, i.url, i.id_tipo_imagem
                   FROM tbl_imagem AS i
                   INNER JOIN tbl_imagem_entrega AS ie ON ie.id_imagem = i.id
                   WHERE ie.id_entrega = ?
                   ORDER BY i.id;`
        let result = await knexConex.raw(sql, [idEntrega])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Usada no PUT e no DELETE da entrega: apaga todas as relações dela
// (0 linhas apagadas também é sucesso: a entrega pode não ter imagens ainda)
const deleteImagensByIdEntrega = async function (idEntrega) {
    try {
        let sql = `DELETE FROM tbl_imagem_entrega WHERE id_entrega = ?;`
        let result = await knexConex.raw(sql, [idEntrega])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertImagemEntrega,
    selectImagensByIdEntrega,
    deleteImagensByIdEntrega
}