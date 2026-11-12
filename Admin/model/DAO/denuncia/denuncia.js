/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Denuncias
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertDenuncia = async function (denuncia) {
    try {
        let sql = `INSERT INTO tbl_denuncias (descricao, id_tipo_denuncias, id_denunciante)
                   VALUES (?, ?, ?);`
        let result = await knexConex.raw(sql, [
            denuncia.descricao,
            denuncia.id_tipo_denuncias,
            denuncia.id_denunciante
        ])

        if (Array.isArray(result) && result[0].insertId) {
            return result[0].insertId
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateDenuncia = async function (denuncia) {
    try {
        let sql = `UPDATE tbl_denuncias SET
                       descricao = ?, id_tipo_denuncias = ?, id_denunciante = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            denuncia.descricao,
            denuncia.id_tipo_denuncias,
            denuncia.id_denunciante,
            denuncia.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Os selects trazem os id_... só para o controller consultar as tabelas relacionadas.
// O controller remove esses campos antes de responder.
const selectByIdDenuncia = async function (id) {
    try {
        let sql = `SELECT id, descricao, id_tipo_denuncias, id_denunciante
                   FROM tbl_denuncias WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllDenuncia = async function () {
    try {
        let sql = `SELECT id, descricao, id_tipo_denuncias, id_denunciante
                   FROM tbl_denuncias ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deleteDenuncia = async function (id) {
    try {
        let sql = `DELETE FROM tbl_denuncias WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)

        // 1451 = existe registro de outra tabela apontando para esta denúncia
        if (error.errno == 1451) {
            return 'EM_USO'
        }

        return false
    }
}

module.exports = {
    insertDenuncia,
    updateDenuncia,
    selectByIdDenuncia,
    selectAllDenuncia,
    deleteDenuncia
}