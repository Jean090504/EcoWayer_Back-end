/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_genero no banco de dados MySQL
 * Autor: Seu Nome
 * Versão: 1.0
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um novo gênero e retorna o id gerado (ou false)
const insertGenero = async function (genero) {
    try {
        let sql = `INSERT INTO tbl_genero (nome, sigla) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [genero.nome, genero.sigla])

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

// Atualiza um gênero existente
const updateGenero = async function (genero) {
    try {
        let sql = `UPDATE tbl_genero SET nome = ?, sigla = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [genero.nome, genero.sigla, genero.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um gênero pelo id
const selectByIdGenero = async function (id) {
    try {
        let sql = `SELECT id, nome, sigla FROM tbl_genero WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os gêneros (maior id primeiro)
const selectAllGenero = async function () {
    try {
        let sql = `SELECT id, nome, sigla FROM tbl_genero ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um gênero pelo id
const deleteGenero = async function (id) {
    try {
        let sql = `DELETE FROM tbl_genero WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertGenero,
    updateGenero,
    selectByIdGenero,
    selectAllGenero,
    deleteGenero
}