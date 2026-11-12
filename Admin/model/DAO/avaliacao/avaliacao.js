/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Avaliação
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// data_avaliacao é opcional: sem valor, o banco grava a data e hora atuais
const insertAvaliacao = async function (avaliacao) {
    try {
        let sql = `INSERT INTO tbl_avaliacao (nota, comentario, data_avaliacao, id_entrega, id_usuario)
                   VALUES (?, ?, COALESCE(?, NOW()), ?, ?);`
        let result = await knexConex.raw(sql, [
            avaliacao.nota,
            avaliacao.comentario,
            avaliacao.data_avaliacao,
            avaliacao.id_entrega,
            avaliacao.id_usuario
        ])

        if (Array.isArray(result) && result[0].insertId) {
            return result[0].insertId
        } else {
            return false
        }
    } catch (error) {
        console.log(error)

        // 1062 = já existe uma avaliação igual (só ocorre se houver chave UNIQUE no banco)
        if (error.errno == 1062) {
            return 'DUPLICADA'
        }

        return false
    }
}

// data_avaliacao não enviada no PUT mantém o valor que já estava gravado
const updateAvaliacao = async function (avaliacao) {
    try {
        let sql = `UPDATE tbl_avaliacao SET
                       nota = ?, comentario = ?, data_avaliacao = COALESCE(?, data_avaliacao),
                       id_entrega = ?, id_usuario = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            avaliacao.nota,
            avaliacao.comentario,
            avaliacao.data_avaliacao,
            avaliacao.id_entrega,
            avaliacao.id_usuario,
            avaliacao.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)

        if (error.errno == 1062) {
            return 'DUPLICADA'
        }

        return false
    }
}

// Os selects trazem os id_... só para o controller consultar as tabelas relacionadas.
// O controller remove esses campos antes de responder.
// DATE_FORMAT evita que a data volte como "2026-10-20T10:30:00.000Z" (problema de fuso).
const selectByIdAvaliacao = async function (id) {
    try {
        let sql = `SELECT id, nota, comentario,
                          DATE_FORMAT(data_avaliacao, '%Y-%m-%d %H:%i:%s') AS data_avaliacao,
                          id_entrega, id_usuario
                   FROM tbl_avaliacao WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllAvaliacao = async function () {
    try {
        let sql = `SELECT id, nota, comentario,
                          DATE_FORMAT(data_avaliacao, '%Y-%m-%d %H:%i:%s') AS data_avaliacao,
                          id_entrega, id_usuario
                   FROM tbl_avaliacao ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deleteAvaliacao = async function (id) {
    try {
        let sql = `DELETE FROM tbl_avaliacao WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)

        // 1451 = existe registro de outra tabela apontando para esta avaliação
        if (error.errno == 1451) {
            return 'EM_USO'
        }

        return false
    }
}

module.exports = {
    insertAvaliacao,
    updateAvaliacao,
    selectByIdAvaliacao,
    selectAllAvaliacao,
    deleteAvaliacao
}