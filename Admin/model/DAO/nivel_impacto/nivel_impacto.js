

/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_nivel_impacto no banco de dados MySQL
 * Autor: Seu Nome
 * Versão: 1.0
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um novo nível de impacto e retorna o id gerado (ou false)
const insertNivelImpacto = async function (nivelImpacto) {
    try {
        let sql = `INSERT INTO tbl_nivel_impacto (nome, numero, meta, unidade) VALUES (?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [nivelImpacto.nome, nivelImpacto.numero, nivelImpacto.meta, nivelImpacto.unidade])

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

// Atualiza um nível de impacto existente
const updateNivelImpacto = async function (nivelImpacto) {
    try {
        let sql = `UPDATE tbl_nivel_impacto SET nome = ?, numero = ?, meta = ?, unidade = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [nivelImpacto.nome, nivelImpacto.numero, nivelImpacto.meta, nivelImpacto.unidade, nivelImpacto.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um nível de impacto pelo id
const selectByIdNivelImpacto = async function (id) {
    try {
        let sql = `SELECT id, nome, numero, meta, unidade FROM tbl_nivel_impacto WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os níveis de impacto (maior id primeiro)
const selectAllNivelImpacto = async function () {
    try {
        let sql = `SELECT id, nome, numero, meta, unidade FROM tbl_nivel_impacto ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um nível de impacto pelo id
const deleteNivelImpacto = async function (id) {
    try {
        let sql = `DELETE FROM tbl_nivel_impacto WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertNivelImpacto,
    updateNivelImpacto,
    selectByIdNivelImpacto,
    selectAllNivelImpacto,
    deleteNivelImpacto
}