/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Condição do Item
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertCondicaoItem = async function (condicaoItem) {
    try {
        let sql = `INSERT INTO tbl_condicao_item (nome) VALUES (?);`
        let result = await knexConex.raw(sql, [condicaoItem.nome])

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

const updateCondicaoItem = async function (condicaoItem) {
    try {
        let sql = `UPDATE tbl_condicao_item SET nome = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [condicaoItem.nome, condicaoItem.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdCondicaoItem = async function (id) {
    try {
        let sql = `SELECT id, nome FROM tbl_condicao_item WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllCondicaoItem = async function () {
    try {
        let sql = `SELECT id, nome FROM tbl_condicao_item ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const deleteCondicaoItem = async function (id) {
    try {
        let sql = `DELETE FROM tbl_condicao_item WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)

        // 1451 = existe registro de outra tabela apontando para este
        if (error.errno == 1451) {
            return 'EM_USO'
        }

        return false
    }
}

module.exports = {
    insertCondicaoItem,
    updateCondicaoItem,
    selectByIdCondicaoItem,
    selectAllCondicaoItem,
    deleteCondicaoItem
}