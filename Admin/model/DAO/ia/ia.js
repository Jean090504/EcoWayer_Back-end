/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_ia no banco de dados MySQL
 * Local: model/DAO/ia/ia.js
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere uma IA e retorna o id gerado (ou false)
const insertIA = async function (ia) {
    try {
        let sql = `INSERT INTO tbl_ia (nome, provedor, versao, status, id_externo)
                   VALUES (?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [ia.nome, ia.provedor, ia.versao, ia.status, ia.id_externo])

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

// Atualiza todos os campos editáveis da IA
const updateIA = async function (ia) {
    try {
        let sql = `UPDATE tbl_ia SET nome = ?, provedor = ?, versao = ?, status = ?, id_externo = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [ia.nome, ia.provedor, ia.versao, ia.status, ia.id_externo, ia.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um registro pelo id
const selectByIdIA = async function (id) {
    try {
        let sql = `SELECT id, nome, provedor, versao, status, id_externo
                   FROM tbl_ia WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os registros (mais recente primeiro)
const selectAllIA = async function () {
    try {
        let sql = `SELECT id, nome, provedor, versao, status, id_externo
                   FROM tbl_ia ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um registro pelo id
const deleteIA = async function (id) {
    try {
        let sql = `DELETE FROM tbl_ia WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertIA,
    updateIA,
    selectByIdIA,
    selectAllIA,
    deleteIA
}