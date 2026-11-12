/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Conversa
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertConversa = async function (conversa) {
    try {
        let sql = `INSERT INTO tbl_conversa (id_anuncio, id_usuario) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [conversa.id_anuncio, conversa.id_usuario])

        if (Array.isArray(result) && result[0].insertId) {
            return result[0].insertId
        } else {
            return false
        }
    } catch (error) {
        console.log(error)

        // 1062 = já existe uma conversa igual (só ocorre se houver chave UNIQUE no banco)
        if (error.errno == 1062) {
            return 'DUPLICADA'
        }

        return false
    }
}

const updateConversa = async function (conversa) {
    try {
        let sql = `UPDATE tbl_conversa SET id_anuncio = ?, id_usuario = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [conversa.id_anuncio, conversa.id_usuario, conversa.id])

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
const selectByIdConversa = async function (id) {
    try {
        let sql = `SELECT id, id_anuncio, id_usuario FROM tbl_conversa WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllConversa = async function () {
    try {
        let sql = `SELECT id, id_anuncio, id_usuario FROM tbl_conversa ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deleteConversa = async function (id) {
    try {
        let sql = `DELETE FROM tbl_conversa WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)

        // 1451 = existe registro de outra tabela apontando para esta conversa
        if (error.errno == 1451) {
            return 'EM_USO'
        }

        return false
    }
}

module.exports = {
    insertConversa,
    updateConversa,
    selectByIdConversa,
    selectAllConversa,
    deleteConversa
}