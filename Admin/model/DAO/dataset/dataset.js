/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_dataset no banco de dados MySQL
 * Local: model/DAO/dataset/dataset.js
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um dataset e retorna o id gerado (ou false)
const insertDataset = async function (dataset) {
    try {
        let sql = `INSERT INTO tbl_dataset (nome, descricao) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [dataset.nome, dataset.descricao])

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

// Atualiza nome e descricao
const updateDataset = async function (dataset) {
    try {
        let sql = `UPDATE tbl_dataset SET nome = ?, descricao = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [dataset.nome, dataset.descricao, dataset.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um registro pelo id
const selectByIdDataset = async function (id) {
    try {
        let sql = `SELECT id, nome, descricao FROM tbl_dataset WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os registros (mais recente primeiro)
const selectAllDataset = async function () {
    try {
        let sql = `SELECT id, nome, descricao FROM tbl_dataset ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um registro pelo id
const deleteDataset = async function (id) {
    try {
        let sql = `DELETE FROM tbl_dataset WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertDataset,
    updateDataset,
    selectByIdDataset,
    selectAllDataset,
    deleteDataset
}