/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_acesso no banco de dados MySQL
 * Local: model/DAO/acesso/acesso.js
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um acesso e retorna o id gerado (ou false)
const insertAcesso = async function (acesso) {
    try {
        let sql = `INSERT INTO tbl_acesso (id_usuario, data_acesso)
                   VALUES (?, ?);`
        let result = await knexConex.raw(sql, [acesso.id_usuario, acesso.data_acesso])

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

// Atualiza id_usuario e data_acesso de um registro
const updateAcesso = async function (acesso) {
    try {
        let sql = `UPDATE tbl_acesso SET id_usuario = ?, data_acesso = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [acesso.id_usuario, acesso.data_acesso, acesso.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um registro pelo id
const selectByIdAcesso = async function (id) {
    try {
        let sql = `SELECT id, id_usuario, data_acesso
                   FROM tbl_acesso WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os registros (mais recente primeiro)
const selectAllAcesso = async function () {
    try {
        let sql = `SELECT id, id_usuario, data_acesso
                   FROM tbl_acesso ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um registro pelo id
const deleteAcesso = async function (id) {
    try {
        let sql = `DELETE FROM tbl_acesso WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertAcesso,
    updateAcesso,
    selectByIdAcesso,
    selectAllAcesso,
    deleteAcesso
}